"""
AI-powered 3-day training plan generator using Gemini.
Extreme personalization based on full user profile.
"""

import json
import re
from datetime import timedelta, date
from google import genai
from django.conf import settings
from .models import Exercise, TrainingPlan, DayTraining

VALID_CATEGORIES = {"strength", "cardio", "flexibility", "bodyweight"}


def _safe_int(value, default=None):
    """Convert Gemini's creative strings to int or None."""
    if value is None:
        return default
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    match = re.search(r"\d+", str(value))
    return int(match.group()) if match else default


def _truncate(value, max_length, default=""):
    text = str(value if value is not None else default).strip()
    return text[:max_length]


def normalize_category(raw):
    """Normalize AI-returned category to a known valid value."""
    val = (raw or "").strip().lower()
    if val in VALID_CATEGORIES:
        return val
    if "cardio" in val or "run" in val or "walk" in val:
        return "cardio"
    if "flex" in val or "stretch" in val or "yoga" in val:
        return "flexibility"
    if "body" in val or "weight" in val or "calist" in val:
        return "bodyweight"
    return "strength"


def _build_profile_context(profile):
    """
    Build a rich, human-readable profile context string for the prompt.
    Covers all personalization dimensions.
    """
    has_gym = getattr(profile, "has_gym", False)
    age = getattr(profile, "age", 25)
    weight = getattr(profile, "weight_kg", 70)
    height = getattr(profile, "height_cm", 170)
    goal = getattr(profile, "goal", "general_fitness")
    gender = getattr(profile, "gender", "male")
    health_mins = getattr(profile, "health_time_minutes", 60)
    activity = getattr(profile, "activity_level", "moderate")
    injuries = getattr(profile, "injuries", "") or "none"
    diet = getattr(profile, "diet_preference", "non_veg")
    target_wt = getattr(profile, "target_weight_kg", None)

    # Fallback: should never reach here due to view guard, but safety net
    if health_mins == 0:
        health_mins = 30

    bmi = round(weight / ((height / 100) ** 2), 1)

    # BMI category
    if bmi < 18.5:
        bmi_category = "underweight"
    elif bmi < 25:
        bmi_category = "normal weight"
    elif bmi < 30:
        bmi_category = "overweight"
    else:
        bmi_category = "obese"

    # Weight delta context
    weight_note = ""
    if target_wt:
        delta = round(weight - float(target_wt), 1)
        if delta > 0:
            weight_note = f"Wants to lose {delta}kg to reach target {target_wt}kg."
        elif delta < 0:
            weight_note = f"Wants to gain {abs(delta)}kg to reach target {target_wt}kg."
        else:
            weight_note = "Already at target weight — maintenance focus."

    # Equipment string
    if has_gym:
        equipment_str = "Full gym access: barbells, dumbbells, cables, machines, pull-up bar, bench, squat rack."
    else:
        equipment_str = (
            "Home/outdoor only: bodyweight exercises, resistance bands (if available). "
            "No barbells, no machines, no gym equipment."
        )

    # Session volume guidance based on time
    if health_mins < 30:
        volume_guidance = (
            f"{health_mins} min/day — very short sessions. "
            "Use 2-3 high-efficiency compound or HIIT exercises. "
            "Superset where possible. No rest-heavy routines."
        )
    elif health_mins < 45:
        volume_guidance = (
            f"{health_mins} min/day — short sessions. "
            "3 exercises, moderate intensity, 45-60s rest between sets."
        )
    elif health_mins < 60:
        volume_guidance = (
            f"{health_mins} min/day — standard sessions. "
            "3-4 exercises, good intensity, 60s rest between sets."
        )
    elif health_mins < 90:
        volume_guidance = (
            f"{health_mins} min/day — full sessions. "
            "4-5 exercises, progressive overload, 60-90s rest."
        )
    else:
        volume_guidance = (
            f"{health_mins} min/day — long sessions. "
            "5-6 exercises, high volume, can include warm-up and cooldown sets."
        )

    # Age-specific notes
    if age < 18:
        age_note = (
            "Teenager: avoid heavy spinal loading, focus on bodyweight and technique."
        )
    elif age < 30:
        age_note = (
            "Young adult: can handle high intensity, focus on progressive overload."
        )
    elif age < 40:
        age_note = "Prime age: balanced intensity, incorporate mobility work."
    elif age < 50:
        age_note = (
            "Late 30s/40s: reduce high-impact, prioritize joint health and recovery."
        )
    elif age < 60:
        age_note = "50s: low-impact cardio preferred, focus on functional strength and flexibility."
    else:
        age_note = "Senior (60+): chair-assisted exercises acceptable, gentle cardio, balance training."

    # Goal-specific notes
    goal_note = {
        "fat_loss": "Fat loss: HIIT, circuit training, compound lifts with short rest. Calorie burn priority.",
        "weight_loss": "Weight loss: moderate cardio + full-body strength. Consistent moderate intensity.",
        "muscle_building": "Muscle building: progressive overload, compound lifts (squat/bench/deadlift/row), higher volume.",
        "maintenance": "Maintenance: balanced mix of strength and cardio. Keep current fitness level.",
        "general_fitness": "General fitness: balanced push/pull/legs split across 3 days.",
    }.get(goal, "General fitness: balanced approach.")

    # Activity level note
    activity_note = {
        "sedentary": "Sedentary lifestyle: start slow, beginner-friendly instructions, low intensity first session.",
        "light": "Lightly active: moderate intensity acceptable, clear form cues needed.",
        "moderate": "Moderately active: standard intensity and volume.",
        "active": "Active: can handle higher intensity and volume.",
        "very_active": "Very active: high intensity, advanced variations acceptable.",
    }.get(activity, "Moderate activity level.")

    # Injury note
    injury_note = (
        f"Has injuries/limitations: {injuries}. Avoid exercises that stress these areas. "
        "Substitute with low-impact alternatives."
        if injuries.lower() != "none"
        else "No injuries reported."
    )

    return {
        "has_gym": has_gym,
        "age": age,
        "weight": weight,
        "height": height,
        "goal": goal,
        "gender": gender,
        "health_mins": health_mins,
        "activity": activity,
        "injuries": injuries,
        "diet": diet,
        "bmi": bmi,
        "bmi_category": bmi_category,
        "weight_note": weight_note,
        "equipment_str": equipment_str,
        "volume_guidance": volume_guidance,
        "age_note": age_note,
        "goal_note": goal_note,
        "activity_note": activity_note,
        "injury_note": injury_note,
    }


def _build_split_guidance(goal, has_gym, health_mins):
    """
    Return a 3-day muscle group split recommendation
    based on goal and available time.
    """
    if goal in ("muscle_building",):
        if has_gym:
            return (
                "Day 1: Chest + Triceps (bench press, chest fly, tricep pushdown)\n"
                "Day 2: Back + Biceps (deadlift, row, curl)\n"
                "Day 3: Legs + Shoulders (squat, leg press, OHP, lateral raise)"
            )
        else:
            return (
                "Day 1: Push (push-ups, pike push-up, tricep dips)\n"
                "Day 2: Pull (inverted row, resistance band row, bicep curl)\n"
                "Day 3: Legs + Core (squats, lunges, glute bridge, plank)"
            )
    elif goal in ("fat_loss", "weight_loss"):
        if health_mins < 45:
            return (
                "Day 1: Full body HIIT circuit\n"
                "Day 2: Upper body + cardio intervals\n"
                "Day 3: Lower body + core circuit"
            )
        else:
            return (
                "Day 1: Full body strength + HIIT finisher\n"
                "Day 2: Cardio-focused (running, cycling, jump rope) + abs\n"
                "Day 3: Full body circuit, higher reps lower weight"
            )
    elif goal == "maintenance":
        return (
            "Day 1: Upper body strength\n"
            "Day 2: Lower body strength\n"
            "Day 3: Full body functional + cardio"
        )
    else:  # general_fitness
        return (
            "Day 1: Upper body (push focus)\n"
            "Day 2: Lower body + core\n"
            "Day 3: Full body + cardio"
        )


def generate_training_plan(user, profile, week_start=None):
    if week_start is None:
        week_start = date.today()

    # Deactivate old plans
    TrainingPlan.objects.filter(user=user, is_active=True).update(is_active=False)

    # Create or reuse plan record (3 days: day 0, 1, 2)
    plan, created = TrainingPlan.objects.get_or_create(
        user=user,
        week_start_date=week_start,
        defaults={
            "week_end_date": week_start + timedelta(days=2),
            "is_active": True,
        },
    )

    if not created:
        # Plan already exists for this start date — wipe old days and regenerate
        plan.day_trainings.all().delete()
        plan.week_end_date = week_start + timedelta(days=2)
        plan.is_active = True
        plan.save(update_fields=["week_end_date", "is_active"])

    # Build profile context
    ctx = _build_profile_context(profile)

    # Build 3-day schedule — no forced rest days
    days_info = []
    for i in range(3):
        d = week_start + timedelta(days=i)
        days_info.append(
            {
                "day_index": i,
                "date": str(d),
                "weekday": d.strftime("%A"),
                "is_rest": False,
            }
        )

    split_guidance = _build_split_guidance(
        ctx["goal"], ctx["has_gym"], ctx["health_mins"]
    )

    prompt = f"""
You are an elite personal trainer and sports scientist. Generate an extremely personalized 3-day training plan as JSON.

═══════════════════════════════════════
USER PROFILE
═══════════════════════════════════════
Name context   : {ctx["gender"]}, Age {ctx["age"]}
Body           : {ctx["weight"]}kg, {ctx["height"]}cm, BMI {ctx["bmi"]} ({ctx["bmi_category"]})
Goal           : {ctx["goal"]}
{ctx["weight_note"]}
Diet           : {ctx["diet"]}
Equipment      : {ctx["equipment_str"]}
Session time   : {ctx["volume_guidance"]}
Activity level : {ctx["activity_note"]}
Age guidance   : {ctx["age_note"]}
Goal guidance  : {ctx["goal_note"]}
Injuries       : {ctx["injury_note"]}

═══════════════════════════════════════
RECOMMENDED 3-DAY SPLIT
═══════════════════════════════════════
{split_guidance}

═══════════════════════════════════════
DAYS TO GENERATE
═══════════════════════════════════════
{json.dumps(days_info, indent=2)}

═══════════════════════════════════════
STRICT RULES
═══════════════════════════════════════
1.  ALL 3 days are workout days. Never set is_rest to true.
2.  Session volume: follow the split guidance above exactly.
3.  Equipment: {"Use gym equipment (barbells, dumbbells, machines, cables). No bodyweight-only exercises unless specified." if ctx["has_gym"] else "ONLY bodyweight exercises. No gym equipment. No barbells, no dumbbells, no machines."}
4.  sets and reps MUST be plain integers (3, 10, 15). NEVER strings like "to failure" or "as many as possible".
5.  For timed exercises (plank, running, cycling, jump rope): set reps=null, sets=null, use duration_minutes only.
6.  For strength exercises: set duration_minutes = estimated time including rest (sets × reps time + rest).
7.  calories_burned_per_min must be realistic: strength=5-8, HIIT=10-14, cardio=8-12, flexibility=3-4.
8.  instructions must be detailed, form-focused, and {"beginner-friendly with extra form cues" if ctx["activity"] in ("sedentary", "light") else "intermediate level with progressive overload cues"}.
9.  {"Avoid all spinal compression, heavy leg exercises. Focus on upper body and low-impact." if "back" in ctx["injuries"].lower() else ""}
10. {"Prioritize low-impact: no jumping, no running, no heavy squats." if ctx["bmi"] > 30 else ""}
11. {"Use only low-impact, chair-assisted or gentle exercises." if ctx["age"] >= 60 else ""}
12. {"Include at least 1 HIIT or circuit exercise per day to maximize calorie burn." if ctx["goal"] in ("fat_loss", "weight_loss") else ""}
13. {"Include at least 1 compound lift per day (squat/deadlift/bench/row/OHP)." if ctx["goal"] == "muscle_building" and ctx["has_gym"] else ""}
14. Vary muscle groups: Day 1 and Day 2 must NOT hit the same primary muscle group.
15. day_notes must be specific and motivational, mentioning the focus area and a form tip.

═══════════════════════════════════════
RESPOND WITH ONLY THIS JSON
(no markdown, no explanation, no code fences)
═══════════════════════════════════════
{{
  "days": [
    {{
      "day_index": 0,
      "is_rest": false,
      "day_notes": "Day 1 — Chest & Triceps. Focus on full range of motion on all pressing movements.",
      "exercises": [
        {{
          "name": "Barbell Bench Press",
          "category": "strength",
          "equipment": "gym",
          "duration_minutes": 15,
          "sets": 4,
          "reps": 8,
          "calories_burned_per_min": 6.5,
          "instructions": "Lie flat on bench, grip bar slightly wider than shoulders. Lower bar to mid-chest with control, press explosively. Keep shoulder blades retracted throughout."
        }}
      ]
    }}
  ]
}}

Categories must be one of: strength, cardio, flexibility, bodyweight
Equipment must be one of: gym, none
"""

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
        )
        raw = response.text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)
    except Exception as e:
        print(f"[TrainingGenerator] Gemini error: {e}")
        plan.delete()
        return None

    for day_data in data.get("days", []):
        idx = day_data["day_index"]
        current_date = week_start + timedelta(days=idx)
        actual_weekday = current_date.weekday()
        is_rest = day_data.get("is_rest", False)

        day_training = DayTraining.objects.create(
            training_plan=plan,
            day_of_week=actual_weekday,
            date=current_date,
            is_rest_day=is_rest,
            day_notes=day_data.get("day_notes", ""),
        )

        if not is_rest:
            exercise_objs = []
            for ex in day_data.get("exercises", []):
                exercise_objs.append(
                    Exercise(
                        name=_truncate(ex.get("name", "Exercise"), 200, "Exercise"),
                        category=normalize_category(ex.get("category", "strength")),
                        equipment=_truncate(ex.get("equipment", "none"), 10, "none"),
                        duration_minutes=_safe_int(ex.get("duration_minutes"), 20),
                        sets=_safe_int(ex.get("sets")),
                        reps=_safe_int(ex.get("reps")),
                        calories_burned_per_min=float(
                            ex.get("calories_burned_per_min", 5.0)
                        ),
                        instructions=ex.get("instructions", ""),
                    )
                )
            created = Exercise.objects.bulk_create(exercise_objs)
            day_training.exercises.set(created)

    return plan
