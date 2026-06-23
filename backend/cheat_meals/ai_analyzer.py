"""
ai_analyzer.py  –  Gemini-based food analysis for cheat meals.
Uses raw HTTP requests instead of google-genai SDK (regional fix).
"""

import json
import re
import pathlib
import logging
import base64
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"]

FALLBACK_HINTS = [
    ("biryani", 650, 20, 75, 22),
    ("pizza", 320, 12, 36, 12),
    ("burger", 550, 25, 45, 30),
    ("fries", 350, 4, 45, 18),
    ("samosa", 250, 5, 28, 14),
    ("dosa", 260, 6, 30, 10),
    ("idli", 70, 2, 14, 1),
    ("poha", 240, 6, 40, 7),
    ("upma", 220, 6, 35, 6),
    ("rice", 220, 4, 45, 1),
    ("paneer", 300, 18, 8, 20),
    ("chicken", 450, 35, 10, 25),
    ("cake", 400, 5, 55, 18),
    ("ice cream", 250, 4, 28, 12),
    ("sandwich", 280, 12, 32, 10),
    ("pasta", 450, 14, 60, 14),
    ("noodles", 400, 10, 55, 14),
    ("milkshake", 350, 8, 45, 12),
]


def _extract_json_text(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.IGNORECASE | re.DOTALL).strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(raw[start : end + 1])
        raise


def _extract_gemini_text(data: dict) -> str:
    candidates = data.get("candidates") or []
    if not candidates:
        raise RuntimeError(f"Gemini response missing candidates: {data.keys()}")

    content = candidates[0].get("content") or {}
    parts = content.get("parts") or []
    if not parts:
        raise RuntimeError("Gemini response missing content parts")

    first_part = parts[0]
    if isinstance(first_part, dict) and "text" in first_part:
        return first_part["text"].strip()
    if isinstance(first_part, str):
        return first_part.strip()

    raise RuntimeError("Gemini response text part was not readable")


def _fallback_text_analysis(description: str, follow_up_answer: str | None = None) -> dict:
    text = f"{description} {follow_up_answer or ''}".lower()
    food_name = description.strip()[:120] or "Cheat meal"

    estimated_calories = 320
    protein_g = 8.0
    carbs_g = 35.0
    fats_g = 12.0
    portion_description = "1 serving"

    for keyword, calories, protein, carbs, fats in FALLBACK_HINTS:
        if keyword in text:
            estimated_calories = calories
            protein_g = float(protein)
            carbs_g = float(carbs)
            fats_g = float(fats)
            portion_description = f"1 serving of {keyword}"
            food_name = keyword.title()
            break

    if any(word in text for word in ["2 ", "two ", "double", "large", "big"]):
        estimated_calories = round(estimated_calories * 1.35)
    elif any(word in text for word in ["small", "half", "mini", "light"]):
        estimated_calories = round(estimated_calories * 0.75)

    return {
        "ready": True,
        "food_name": food_name,
        "portion_description": portion_description,
        "estimated_calories": int(estimated_calories),
        "protein_g": float(protein_g),
        "carbs_g": float(carbs_g),
        "fats_g": float(fats_g),
        "confidence_level": 0.35,
        "notes": "Fallback estimate used because AI analysis was unavailable or returned invalid JSON.",
    }


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
            text = _extract_gemini_text(data)
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
    data = _extract_json_text(raw)
    _validate_food_analysis(data)
    return data


def analyze_food_text(description: str, follow_up_answer: str | None = None) -> dict:
    context = f"User described: {description}"
    if follow_up_answer:
        context += f"\nAdditional info: {follow_up_answer}"

    prompt = "\n".join([
        context,
        "",
        "You are a professional nutritionist. Estimate the calorie content of the described food.",
        "",
        "If you have enough information, return:",
        '{',
        '  "ready": true,',
        '  "food_name": "...",',
        '  "portion_description": "...",',
        '  "estimated_calories": <integer>,',
        '  "protein_g": <float>,',
        '  "carbs_g": <float>,',
        '  "fats_g": <float>,',
        '  "confidence_level": <float 0-1>,',
        '  "notes": "..."',
        '}',
        "",
        "If you need ONE more piece of info (first call only), return:",
        '{',
        '  "ready": false,',
        '  "follow_up_question": "your single clarifying question"',
        '}',
        "",
        "Rules:",
        "- If called with follow_up_answer, you MUST set ready=true.",
        "- Return ONLY valid JSON, no markdown fences.",
    ])

    try:
        raw = _gemini_post([{"text": prompt}], temperature=0.3)
        data = _extract_json_text(raw)
        if not isinstance(data, dict):
            raise ValueError("Gemini response was not a JSON object")

        if not data.get("ready", True):
            return {
                "ready": False,
                "follow_up_question": data.get("follow_up_question")
                or "Can you share a bit more detail about the portion size?",
            }

        return {
            "ready": True,
            "food_name": data.get("food_name", description[:120] or "Cheat meal"),
            "portion_description": data.get("portion_description", "1 serving"),
            "estimated_calories": int(data.get("estimated_calories", 0) or 0),
            "protein_g": float(data.get("protein_g", 0) or 0),
            "carbs_g": float(data.get("carbs_g", 0) or 0),
            "fats_g": float(data.get("fats_g", 0) or 0),
            "confidence_level": float(data.get("confidence_level", 0.5) or 0.5),
            "notes": data.get("notes", ""),
        }
    except Exception as e:
        logger.warning(f"[AIAnalyzer] Falling back to heuristic text analysis: {e}")
        return _fallback_text_analysis(description, follow_up_answer)


def _validate_food_analysis(data: dict):
    required = [
        "food_name", "portion_description", "estimated_calories",
        "protein_g", "carbs_g", "fats_g", "confidence_level",
    ]
    for field in required:
        if field not in data:
            raise ValueError(f"Gemini response missing field: {field}")
