"""
ai_analyzer.py  –  Gemini-based food analysis for cheat meals.
Uses raw HTTP requests instead of google-genai SDK (regional fix).
"""

import json
import pathlib
import logging
import base64
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"]


def _gemini_post(contents: list, temperature: float = 0.3) -> str:
    """Raw HTTP call to Gemini — works from all Render regions."""
    api_key = settings.GEMINI_API_KEY
    last_error = None

    for model in MODELS:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent?key={api_key}"
        )
        payload = {
            "contents": [{"parts": contents}],
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": "application/json",
            },
        }
        try:
            logger.info(f"[AIAnalyzer] Trying model: {model}")
            resp = requests.post(url, json=payload, timeout=60)
            if resp.status_code != 200:
                raise RuntimeError(f"{resp.status_code}: {resp.text[:500]}")
            data = resp.json()
            text = data["candidates"][0]["content"][0]["parts"][0]["text"].strip()
            logger.info(f"[AIAnalyzer] ✓ Got response from {model}")
            return text
        except Exception as e:
            logger.warning(f"[AIAnalyzer] {model} failed: {e}")
            last_error = e

    raise last_error


def analyze_food_images(image_paths: list[str]) -> dict:
    prompt_text = """You are a professional nutritionist and food analyst.
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

    # Build parts: text prompt + inline base64 images
    parts = [{"text": prompt_text}]
    for path in image_paths[:2]:
        img_bytes = pathlib.Path(path).read_bytes()
        ext = pathlib.Path(path).suffix.lower()
        mime = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        }.get(ext, "image/jpeg")
        parts.append({
            "inline_data": {
                "mime_type": mime,
                "data": base64.b64encode(img_bytes).decode("utf-8"),
            }
        })

    raw = _gemini_post(parts, temperature=0.3)
    data = json.loads(raw)
    _validate_food_analysis(data)
    return data


def analyze_food_text(description: str, follow_up_answer: str | None = None) -> dict:
    context = f"User described: {description}"
    if follow_up_answer:
        context += f"\nAdditional info: {follow_up_answer}"

    prompt = f"""{context}

You are a professional nutritionist. Estimate the calorie content of the described food.

If you have enough information, return:
{
  "ready": true,
  "food_name": "...",
  "portion_description": "...",
  "estimated_calories": <integer>,
  "protein_g": <float>,
  "carbs_g": <float>,
  "fats_g": <float>,
  "confidence_level": <float 0-1>,
  "notes": "..."
}

If you need ONE more piece of info (first call only), return:
{
  "ready": false,
  "follow_up_question": "your single clarifying question"
}

Rules:
- If called with follow_up_answer, you MUST set ready=true.
- Return ONLY valid JSON, no markdown fences."""

    raw = _gemini_post([{"text": prompt}], temperature=0.3)
    return json.loads(raw)


def _validate_food_analysis(data: dict):
    required = [
        "food_name", "portion_description", "estimated_calories",
        "protein_g", "carbs_g", "fats_g", "confidence_level",
    ]
    for field in required:
        if field not in data:
            raise ValueError(f"Gemini response missing field: {field}")
