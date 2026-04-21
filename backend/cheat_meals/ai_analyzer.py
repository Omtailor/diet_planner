"""
ai_analyzer.py  –  Gemini-based food analysis for cheat meals.
Two modes:
  1. Image mode  → send up to 2 images to Gemini Vision
  2. Manual mode → send text description; AI may ask 1 follow-up question
"""

import json, pathlib, logging
from django.conf import settings
from google import genai
from google.genai import types as genai_types

logger = logging.getLogger(__name__)

MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"]


def _client():
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def _generate_with_fallback(client, contents, config):
    """Try each model in MODELS order, return first successful response."""
    last_error = None
    for model in MODELS:
        try:
            logger.info(f"[AIAnalyzer] Trying model: {model}")
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=config,
            )
            logger.info(f"[AIAnalyzer] ✓ Got response from {model}")
            return response
        except Exception as e:
            logger.warning(f"[AIAnalyzer] {model} failed: {e}")
            last_error = e
    raise last_error


def analyze_food_images(image_paths: list[str]) -> dict:
    """
    Send up to 2 food images to Gemini.
    Returns: food_name, portion_description, estimated_calories,
             protein_g, carbs_g, fats_g, confidence_level, notes
    """
    client = _client()
    prompt = """You are a professional nutritionist and food analyst.
Analyze the food item(s) in the image(s) provided.

Return a JSON object with EXACTLY these fields:
{
  "food_name": "concise name of the food",
  "portion_description": "e.g. 1 plate (~300g)",
  "estimated_calories": <integer kcal>,
  "protein_g": <float>,
  "carbs_g": <float>,
  "fats_g": <float>,
  "confidence_level": <float between 0 and 1>,
  "notes": "brief observation about the food or estimation basis"
}
Rules:
- estimated_calories must be a realistic integer.
- confidence_level: 1.0 = completely certain, 0.5 = guessing.
- If multiple items visible, sum their calories.
- Return ONLY valid JSON, no markdown fences, no extra text."""

    parts = [prompt]
    for path in image_paths[:2]:
        img_bytes = pathlib.Path(path).read_bytes()
        ext = pathlib.Path(path).suffix.lower()
        mime = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        }.get(ext, "image/jpeg")
        parts.append(genai_types.Part.from_bytes(data=img_bytes, mime_type=mime))

    config = genai_types.GenerateContentConfig(
        temperature=0.3,
        response_mime_type="application/json",
    )

    response = _generate_with_fallback(client, parts, config)
    data = json.loads(response.text.strip())
    _validate_food_analysis(data)
    return data


def analyze_food_text(description: str, follow_up_answer: str | None = None) -> dict:
    """
    Analyze a text description. May return a follow-up question on first call.
    If follow_up_answer is provided, MUST return ready=true.
    """
    client = _client()
    context = f"User described: {description}"
    if follow_up_answer:
        context += f"\nAdditional info: {follow_up_answer}"

    prompt = f"""{context}

You are a professional nutritionist. Estimate the calorie content of the described food.

If you have enough information, return:
{{
  "ready": true,
  "food_name": "...",
  "portion_description": "...",
  "estimated_calories": <integer>,
  "protein_g": <float>,
  "carbs_g": <float>,
  "fats_g": <float>,
  "confidence_level": <float 0-1>,
  "notes": "..."
}}

If you need ONE more piece of info (first call only), return:
{{
  "ready": false,
  "follow_up_question": "your single clarifying question"
}}

Rules:
- If called with follow_up_answer, you MUST set ready=true.
- Return ONLY valid JSON, no markdown fences."""

    config = genai_types.GenerateContentConfig(
        temperature=0.3,
        response_mime_type="application/json",
    )

    response = _generate_with_fallback(client, [prompt], config)
    return json.loads(response.text.strip())


def _validate_food_analysis(data: dict):
    required = [
        "food_name",
        "portion_description",
        "estimated_calories",
        "protein_g",
        "carbs_g",
        "fats_g",
        "confidence_level",
    ]
    for field in required:
        if field not in data:
            raise ValueError(f"Gemini response missing field: {field}")
