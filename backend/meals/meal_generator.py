import json
import time
import logging
from datetime import date, timedelta

from django.conf import settings
from pydantic import ValidationError

from meals.schemas import WeeklyPlanSchema
from meals.models import WeeklyPlan, DayMeal, MealSlot, FoodItem

logger = logging.getLogger(__name__)


class MealPlanGenerator:

    def __init__(self, profile):
        self.profile = profile
        self.user = profile.user
        # Use direct HTTP requests to the Generative Language API instead of the SDK client.

    def _clean_json_text(self, raw: str) -> str:
        text = (raw or "").strip()
        if not text:
            return ""

        if text.startswith("```json"):
            text = text[7:].strip()
        elif text.startswith("```"):
            text = text[3:].strip()

        if text.endswith("```"):
            text = text[:-3].strip()

        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start : end + 1]
        return text

    def _extract_json(self, raw: str):
        cleaned = self._clean_json_text(raw)
        if not cleaned:
            return None
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return None

    # ──────────────────────────────────────────────────────
    # 1. CALORIE CALCULATION
    # ──────────────────────────────────────────────────────

    def calculate_tdee(self) -> int:
        p = self.profile

        if p.gender == "male":
            bmr = (
                88.36
                + (13.4 * float(p.weight_kg))
                + (4.8 * float(p.height_cm))
                - (5.7 * p.age)
            )
        else:
            bmr = (
                447.6
                + (9.2 * float(p.weight_kg))
                + (3.1 * float(p.height_cm))
                - (4.3 * p.age)
            )

        health_hours = p.health_time_minutes / 60

        # ✅ FIXED: Tighter boundaries — 30 mins/day is lightly active, not moderate
        if health_hours < 0.25:
            multiplier = 1.2  # Sedentary (< 15 mins)
        elif health_hours < 0.75:
            multiplier = 1.3  # Lightly active (15–45 mins) ← Ketan falls here
        elif health_hours < 1.25:
            multiplier = 1.375  # Moderately active (45–75 mins)
        elif health_hours < 1.75:
            multiplier = 1.55  # Very active (75–105 mins)
        else:
            multiplier = 1.725  # Extra active (105+ mins)

        tdee = bmr * multiplier

        # ✅ FIXED: Higher deficit for weight_loss to account for obese BMI profiles
        goal_adjustments = {
            "fat_loss": -300,
            "weight_loss": -600,  # was -500
            "muscle_building": +300,
            "maintenance": 0,
        }
        tdee += goal_adjustments.get(p.goal, 0)

        return round(tdee)

    # ──────────────────────────────────────────────────────
    # 2. BEVERAGE CALORIES
    # ──────────────────────────────────────────────────────

    def calculate_beverage_calories(self) -> int:
        p = self.profile

        calorie_map = {
            "milk_tea": 50,
            "black_tea": 5,
            "green_tea": 3,
            "milk_coffee": 60,
            "black_coffee": 5,
        }

        if p.beverage_habit == "none":
            return 0
        elif p.beverage_habit == "tea":
            return calorie_map.get(f"{p.tea_type}_tea", 0)
        elif p.beverage_habit == "coffee":
            return calorie_map.get(f"{p.coffee_type}_coffee", 0)
        elif p.beverage_habit == "both":
            total = 0
            if p.morning_beverage == "tea":
                total += calorie_map.get(f"{p.tea_type}_tea", 0)
            else:
                total += calorie_map.get(f"{p.coffee_type}_coffee", 0)
            if p.evening_beverage == "tea":
                total += calorie_map.get(f"{p.tea_type}_tea", 0)
            else:
                total += calorie_map.get(f"{p.coffee_type}_coffee", 0)
            return total

        return 0

    # ──────────────────────────────────────────────────────
    # 3. RESOLVE FASTING DAYS
    # ──────────────────────────────────────────────────────

    def get_fasting_day_indices(self, week_start: date) -> set:
        """
        Returns a set of day indices (0, 1, 2) within the 3-day plan
        that fall on the user's fasting day.
        """
        if not self.profile.is_fasting:
            return set()

        DAY_NAME_TO_WEEKDAY = {
            "monday": 0,
            "tuesday": 1,
            "wednesday": 2,
            "thursday": 3,
            "friday": 4,
            "saturday": 5,
            "sunday": 6,
        }

        fasting_raw = (self.profile.fasting_days or "").lower()
        # Handle comma-separated AND strip whitespace
        fasting_day_names = [d.strip() for d in fasting_raw.split(",") if d.strip()]
        fasting_weekdays = {
            DAY_NAME_TO_WEEKDAY[d]
            for d in fasting_day_names
            if d in DAY_NAME_TO_WEEKDAY
        }

        fasting_indices = set()
        for i in range(3):
            if (week_start + timedelta(days=i)).weekday() in fasting_weekdays:
                fasting_indices.add(i)

        return fasting_indices

    # ──────────────────────────────────────────────────────
    # 4. BUILD PERSONALIZED GEMINI PROMPT
    # ──────────────────────────────────────────────────────

    def build_compact_prompt(
        self,
        tdee: int,
        beverage_cal: int,
        week_start: date,
        fasting_indices: set,
        prev_week_names: list | None = None,
    ) -> str:
        p = self.profile
        net_meal_calories = tdee - beverage_cal

        if p.goal in ["weight_loss", "fat_loss"]:
            b_cal, l_cal, d_cal = (
                round(net_meal_calories * 0.30),
                round(net_meal_calories * 0.40),
                round(net_meal_calories * 0.30),
            )
        else:
            b_cal, l_cal, d_cal = (
                round(net_meal_calories * 0.28),
                round(net_meal_calories * 0.38),
                round(net_meal_calories * 0.34),
            )

        weight = float(p.weight_kg)
        protein_multiplier = (
            1.4
            if p.goal in ["weight_loss", "fat_loss"]
            else 1.8 if p.goal == "muscle_building" else 1.2
        )
        if p.age > 40:
            protein_multiplier += 0.1

        min_protein = round(weight * protein_multiplier)
        min_protein_per_meal = round(min_protein / 3)
        fat_ceiling = 55 if p.goal in ["weight_loss", "fat_loss"] else 85
        fat_per_meal_max = round(fat_ceiling / 3)
        daily_floor = 1200 if p.gender == "female" else 1400

        high_cal_instruction = ""
        if net_meal_calories > 2800 and p.goal in ["muscle_building", "maintenance"]:
            high_cal_instruction = f"High calorie target: {net_meal_calories} kcal. Use larger portions, not extra fat."

        schedule_lines = []
        for i in range(3):
            day_date = week_start + timedelta(days=i)
            if i in fasting_indices:
                note = f"Fasting day ({p.fasting_type}): only sabudana, makhana, kuttu atta, rajgira, singhara, sendha namak, fruits, curd, milk, nuts, ghee."
            else:
                note = (
                    "Gym day: prioritize protein and complex carbs."
                    if p.has_gym
                    else "Regular day: balanced macros."
                )
            schedule_lines.append(
                f"Day {i + 1} ({day_date.strftime('%A, %d %b')}): {note}"
            )

        avoid_block = ""
        if prev_week_names:
            avoid_block = "Avoid these previously used meal names: " + ", ".join(
                prev_week_names
            )

        return f"""
Generate a 3-day Indian meal plan as compact JSON only.

User:
- Age: {p.age}
- Gender: {p.gender}
- City: {p.city}
- Height: {p.height_cm} cm
- Weight: {p.weight_kg} kg
- BMI: {p.bmi}
- Goal: {p.goal}
- Diet: {p.diet_preference}
- Gym: {'yes' if p.has_gym else 'no'}

Targets:
- Daily TDEE: {tdee} kcal
- Beverage calories: {beverage_cal} kcal
- Meal budget: {net_meal_calories} kcal/day
- Breakfast target: {b_cal} kcal
- Lunch target: {l_cal} kcal
- Dinner target: {d_cal} kcal
- Protein target: {min_protein} g/day, minimum {min_protein_per_meal} g/meal
- Fat cap: {fat_ceiling} g/day, maximum {fat_per_meal_max} g/meal
- Daily calorie floor: {daily_floor} kcal
- Daily carb cap: 380 g

Rules:
- Return exactly 3 days and 3 meals per day.
- Use 9 unique meal names total. No repeats.
- Every meal must use 5 to 10 ingredients.
- Each ingredient must include name, quantity, and unit.
- Use only g, ml, pcs, tsp, tbsp, cup.
- Keep dinner lighter than lunch.
- Keep fats under the per-meal cap.
- Use realistic Indian portions and meal names.
- Include vegetables in every meal.
- If the day is fasting, use only fasting-safe ingredients for all 3 meals.
- {high_cal_instruction}
- {avoid_block}

Schedule:
{chr(10).join(schedule_lines)}

Return this JSON shape only:
{{
  "days": [
    {{
      "day_number": 1,
      "date_label": "{week_start.strftime('%A, %d %b')}",
      "is_fasting_day": false,
      "breakfast": {{"meal_type": "breakfast", "name": "...", "calories": 0, "protein": 0.0, "carbs": 0.0, "fats": 0.0, "ingredients": [{{"name": "...", "quantity": 100, "unit": "g"}}]}},
      "lunch": {{"meal_type": "lunch", "name": "...", "calories": 0, "protein": 0.0, "carbs": 0.0, "fats": 0.0, "ingredients": [{{"name": "...", "quantity": 100, "unit": "g"}}]}},
      "dinner": {{"meal_type": "dinner", "name": "...", "calories": 0, "protein": 0.0, "carbs": 0.0, "fats": 0.0, "ingredients": [{{"name": "...", "quantity": 100, "unit": "g"}}]}},
      "day_notes": "Explain why the meals fit this user and mention one specific nutrient benefit."
    }}
  ],
  "total_weekly_calories": {net_meal_calories * 3},
  "plan_notes": "Brief summary of the plan."
}}
Return JSON only.
""".strip()

    # ──────────────────────────────────────────────────────
    # 5. CALL GEMINI + PYDANTIC VALIDATION
    # ──────────────────────────────────────────────────────

    def fetch_from_gemini(self, prompt: str) -> WeeklyPlanSchema | None:
        import requests
        import time

        models_to_try = [
            ("gemini-2.5-flash-lite", 2),
            ("gemini-2.5-flash", 1),
        ]

        raw = None
        api_key = settings.GEMINI_API_KEY

        for model_name, max_attempts in models_to_try:
            logger.info(f"[MealGenerator] Trying model: {model_name}")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 65536,
                    "responseMimeType": "application/json",
                },
            }

            for attempt in range(max_attempts):
                try:
                    resp = requests.post(url, json=payload, timeout=120)
                    if resp.status_code != 200:
                        raise RuntimeError(f"{resp.status_code}: {resp.text[:500]}")
                    data = resp.json()
                    raw = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    logger.info(f"[MealGenerator] ✓ Got response from {model_name}")
                    break
                except Exception as e:
                    logger.warning(
                        f"[MealGenerator] {model_name} attempt {attempt+1} failed: {e}"
                    )
                    if attempt < max_attempts - 1:
                        wait = (attempt + 1) * 10
                        logger.info(f"[MealGenerator] Retrying in {wait}s...")
                        time.sleep(wait)

            if raw:
                break

        if not raw:
            logger.error("[MealGenerator] All models and attempts failed.")
            return None

        try:
            data = self._extract_json(raw)
            if data is None:
                raise json.JSONDecodeError("Unable to extract JSON", raw, 0)
        except json.JSONDecodeError as e:
            logger.error(f"[MealGenerator] JSON parse failed: {e}")
            logger.error(f"[MealGenerator] Raw response: {raw[:500]}")
            return None

        try:
            validated = WeeklyPlanSchema(**data)
            return validated
        except ValidationError as e:
            logger.error(f"[MealGenerator] Pydantic validation failed:\n{e}")
            return None

    # ──────────────────────────────────────────────────────
    # 6. SAVE TO DATABASE
    # ──────────────────────────────────────────────────────

    def save_to_db(self, validated, week_start, tdee):
        from .models import WeeklyPlan, DayMeal, FoodItem, MealSlot
        import datetime

        # ✅ Get context for computed fields
        fasting_indices = self.get_fasting_day_indices(week_start)
        is_jain = self.profile.diet_preference == "jain"

        week_end = week_start + datetime.timedelta(days=2)

        plan, _ = WeeklyPlan.objects.get_or_create(
            user=self.user,
            week_start_date=week_start,
            defaults={
                "week_end_date": week_end,
                "target_calories": tdee,
                "plan_notes": validated.plan_notes or "",
            },
        )

        self.profile.target_calories = tdee
        self.profile.save(update_fields=["target_calories"])

        # ✅ Collect slots for bulk create
        slots_to_create = []

        for day_data in validated.days:
            actual_date = week_start + datetime.timedelta(days=day_data.day_number - 1)
            actual_weekday = actual_date.weekday()  # 0=Monday ... 6=Sunday

            # ✅ Get day index for fasting check
            day_index = day_data.day_number - 1
            is_fasting_day = day_index in fasting_indices

            day_meal, _ = DayMeal.objects.update_or_create(
                weekly_plan=plan,
                date=actual_date,  # use date as the unique key — guaranteed unique
                defaults={
                    "day_of_week": actual_weekday,
                    "is_fasting_day": day_data.is_fasting_day,
                    "day_notes": day_data.day_notes or "",
                },
            )

            # Delete existing slots before recreating — prevents duplicate macro counting
            day_meal.meal_slots.all().delete()

            for slot_name in ["breakfast", "lunch", "dinner"]:
                meal_data = getattr(day_data, slot_name)

                # Parse ingredients safely
                ingredients_list = []
                for ing in meal_data.ingredients or []:
                    if isinstance(ing, str):
                        ingredients_list.append(
                            {"name": ing, "quantity": None, "unit": ""}
                        )
                    elif hasattr(ing, "dict"):
                        ingredients_list.append(ing.dict())
                    elif isinstance(ing, dict):
                        ingredients_list.append(ing)

                food_item, created = FoodItem.objects.get_or_create(
                    name=meal_data.name,
                    diet_type=self.profile.diet_preference,  # scoped per diet
                    created_by=self.user,
                    defaults={
                        "category": slot_name,
                        "diet_type": self.profile.diet_preference,
                        "created_by": self.user,
                        "calories": meal_data.calories,
                        "protein_g": meal_data.protein,
                        "carbs_g": meal_data.carbs,
                        "fats_g": meal_data.fats,
                        # ✅ Computed on backend — not from Gemini anymore
                        "fiber_g": (
                            meal_data.fiber
                            if meal_data.fiber
                            else round(meal_data.carbs * 0.12)
                        ),
                        "serving_size_g": meal_data.serving_size or 1.0,
                        "serving_unit": meal_data.serving_unit or "plate",
                        "ingredients": ingredients_list,
                        "is_fasting_friendly": is_fasting_day,  # from context
                        "is_jain_friendly": is_jain,  # from profile
                    },
                )
                if not created:
                    food_item.calories = meal_data.calories
                    food_item.protein_g = meal_data.protein
                    food_item.carbs_g = meal_data.carbs
                    food_item.fats_g = meal_data.fats
                    food_item.ingredients = ingredients_list
                    food_item.is_fasting_friendly = is_fasting_day
                    food_item.save(
                        update_fields=[
                            "calories",
                            "protein_g",
                            "carbs_g",
                            "fats_g",
                            "ingredients",
                            "is_fasting_friendly",
                        ]
                    )

                # ✅ Collect slots instead of creating one by one
                slots_to_create.append(
                    MealSlot(
                        day_meal=day_meal,
                        slot=slot_name,
                        food_item=food_item,
                        quantity_g=meal_data.serving_size or 1.0,
                        calories=meal_data.calories or food_item.calories,
                        protein_g=meal_data.protein or food_item.protein_g,
                        carbs_g=meal_data.carbs or food_item.carbs_g,
                        fats_g=meal_data.fats or food_item.fats_g,
                    )
                )

        # ✅ Single bulk insert instead of 21 individual creates
        MealSlot.objects.bulk_create(slots_to_create)

        # Update totals for all day meals
        for day_meal in DayMeal.objects.filter(weekly_plan=plan):
            day_meal.update_totals()

        return plan

    # 7A. BUILD SINGLE-DAY REGENERATION PROMPT
    # ──────────────────────────────────────────────────────

    def build_regen_prompt(self, day_meal, existing_names: list) -> str:
        p = self.profile
        tdee = self.calculate_tdee()
        beverage_cal = self.calculate_beverage_calories()
        net_calories = tdee - beverage_cal

        if p.goal in ["weight_loss", "fat_loss"]:
            b_cal = round(net_calories * 0.30)
            l_cal = round(net_calories * 0.40)
            d_cal = round(net_calories * 0.30)
        else:
            b_cal = round(net_calories * 0.28)
            l_cal = round(net_calories * 0.38)
            d_cal = round(net_calories * 0.34)

        weight = float(p.weight_kg)
        protein_multiplier = (
            1.4
            if p.goal in ["weight_loss", "fat_loss"]
            else 1.8 if p.goal == "muscle_building" else 1.2
        )
        if p.age > 40:
            protein_multiplier += 0.1

        min_protein = round(weight * protein_multiplier)
        min_protein_per_meal = round(min_protein / 3)
        fat_ceiling = 55 if p.goal in ["weight_loss", "fat_loss"] else 85
        fat_per_meal_max = round(fat_ceiling / 3)

        # Mirror the same conditional from build_compact_prompt()
        if net_calories > 2800 and p.goal in ["muscle_building", "maintenance"]:
            high_cal_regen = f"""
⚠️ HIGH CALORIE TARGET ({net_calories} kcal) — MANDATORY:
  Fill calories via LARGER PORTIONS only — not more fat.
  Breakfast {b_cal} kcal: 3 eggs or 200g paneer + 3 rotis + 200g curd
  Lunch {l_cal} kcal: 200g chicken/paneer + 1.5 cups rice + full bowl dal
  Dinner {d_cal} kcal: 200g protein + 1–2 rotis + dal — 1 tsp ghee MAX
  Fat budget: {fat_per_meal_max}g/meal. Exceed it → remove ghee/cream, add more rice.
"""
        else:
            high_cal_regen = ""

        avoid_str = ", ".join(existing_names) if existing_names else "none"

        protein_sources = {
            "veg": "paneer, Greek yogurt/hung curd, moong dal, rajma, chana, tofu, besan, quinoa, soy milk",
            "jain": "paneer, curd, moong dal, chana dal, toor dal, quinoa, besan — NO onion/garlic",
            "non_veg": "chicken breast, eggs, fish, paneer, dal, Greek yogurt",
        }.get(p.diet_preference, "paneer, dal, curd, chana, rajma, tofu")

        fasting_note = ""
        if day_meal.is_fasting_day:
            fasting_note = (
                f"⚠️ FASTING DAY ({p.fasting_type}) — ALL 3 meals must use ONLY: "
                "sabudana, makhana, kuttu atta, rajgira, singhara, sendha namak, "
                "fruits, curd, milk, nuts, ghee. No regular grains or lentils."
            )

        return f"""
You are a certified Indian nutritionist.
Regenerate meals for ONE day only.

══════════════════════════════════════════
USER PROFILE
══════════════════════════════════════════
Age    : {p.age} years
Gender : {p.gender}
Weight : {p.weight_kg} kg
Goal   : {p.goal}
Diet   : {p.diet_preference}
City   : {p.city}
{fasting_note}

══════════════════════════════════════════
CALORIE TARGETS
══════════════════════════════════════════
Daily budget : {net_calories} kcal
Breakfast    : ~{b_cal} kcal
Lunch        : ~{l_cal} kcal
Dinner       : ~{d_cal} kcal (HARD CAP — do not exceed)

CALORIE RULES:
- HARD FAT LIMIT: No single meal may exceed {fat_per_meal_max}g fat — NON-NEGOTIABLE.
  Any meal exceeding this will be rejected. If you need more calories, use complex carbs or lean protein — NOT fat.
- HARD FAT LIMIT: Daily fat total must stay under {fat_ceiling}g — NON-NEGOTIABLE.
  Current meals are repeatedly exceeding this. 40–60g fat per meal is UNACCEPTABLE for this goal.
- Each meal's fat content: Breakfast ≤{fat_per_meal_max}g | Lunch ≤{fat_per_meal_max}g | Dinner ≤{fat_per_meal_max}g
- Use ghee sparingly — max 1 tsp (5g) per meal. Avoid cream, butter, coconut oil in large quantities.
- No meal should derive more than 45% of its calories from fats.
- No single meal exceeds: 1,100 kcal | 100g carbs | {fat_per_meal_max}g fat
{high_cal_regen}

══════════════════════════════════════════
PROTEIN TARGETS
══════════════════════════════════════════
Daily protein target : {min_protein}g
Breakfast minimum    : {max(18, min_protein_per_meal)}g
Lunch minimum        : {max(25, min_protein_per_meal)}g
Dinner minimum       : {max(20, min_protein_per_meal)}g
Best sources         : {protein_sources}
Include at least ONE high-protein ingredient from the above list in EVERY meal.

══════════════════════════════════════════
MEAL CONSTRUCTION — PLATE METHOD
══════════════════════════════════════════
Each meal must follow this structure:
  50% non-starchy vegetables (spinach, capsicum, lauki, tomato, cucumber, broccoli)
  25% lean protein source (dal, paneer, chana, tofu, rajma, curd, eggs/chicken if non-veg)
  25% complex carbohydrate (brown rice, millets, whole wheat roti, oats, quinoa)
  + small healthy fat portion (≤1 tsp ghee, or nuts/seeds garnish)

Breakfast must be protein-anchored — not starch-first.
Lunch is the largest meal — must include dal OR legume OR paneer + salad/raita side.
Dinner is the lightest meal — soup, dal, or sabzi-based. Minimize rice at dinner.

══════════════════════════════════════════
VARIETY — AVOID THESE MEALS ALREADY USED THIS WEEK
══════════════════════════════════════════
{avoid_str}
Generate 3 completely different meal names not in the above list.

══════════════════════════════════════════
ANTI-HALLUCINATION — MACRO SANITY CHECKS
══════════════════════════════════════════
Before finalizing each meal, verify:
1. calories ≈ (protein × 4) + (carbs × 4) + (fats × 9) — tolerance ±25 kcal
2. Realistic Indian portion benchmarks:
   - 1 medium roti (30g)        = 80–100 kcal
   - 1 cup cooked brown rice    = 200–220 kcal
   - 100g paneer                = 265 kcal, 18g protein
   - 1 bowl cooked dal (200ml)  = 150–180 kcal, 9–12g protein
   - 1 cup curd (200g)          = 120 kcal, 7g protein
   - 100g tofu                  = 76 kcal, 8g protein
   - 1 large egg                = 78 kcal, 6g protein
   If numbers deviate significantly — recalculate before returning.
3. Protein per meal calculated from ACTUAL ingredients — not rounded to 45g.

══════════════════════════════════════════
RESPONSE - COMPACT VALID JSON ONLY. OMIT: fiber, serving_size, serving_unit, is_fasting_friendly, is_jain_friendly.
══════════════════════════════════════════
{{
  "day_number": {day_meal.day_of_week + 1},
  "date_label": "{day_meal.date.strftime('%A, %d %b')}",
  "is_fasting_day": {str(day_meal.is_fasting_day).lower()},
  "breakfast": {{
    "meal_type": "breakfast",
    "name": "...",
    "calories": 0,
    "protein": 0.0,
    "carbs": 0.0,
    "fats": 0.0,
    "ingredients": [{{"name": "...", "quantity": 100, "unit": "g"}}]
  }},
  "lunch": {{...}},
  "dinner": {{...}},
  "day_notes": "Specific note explaining nutrient benefits for this user's goal."
}}
"""

    # ──────────────────────────────────────────────────────
    # 7B. REGENERATE A SINGLE DAY
    # ──────────────────────────────────────────────────────

    def regenerate_day(self, day_meal) -> bool:
        """
        Regenerates all 3 meal slots for a given DayMeal instance.
        Returns True on success, False on failure.
        """
        from meals.models import FoodItem, MealSlot
        from meals.schemas import DayMealSchema

        # ✅ Get context for computed fields
        is_jain = self.profile.diet_preference == "jain"
        is_fasting = day_meal.is_fasting_day

        # Collect existing meal names from the rest of the week to avoid repeats
        existing_names = list(
            MealSlot.objects.filter(day_meal__weekly_plan=day_meal.weekly_plan)
            .exclude(day_meal=day_meal)
            .values_list("food_item__name", flat=True)
        )

        prompt = self.build_regen_prompt(day_meal, existing_names)

        import requests

        models_to_try = [
            ("gemini-2.5-flash-lite", 2),
            ("gemini-2.5-flash", 1),
        ]

        raw = None
        api_key = settings.GEMINI_API_KEY

        for model_name, max_attempts in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 65536,
                    "responseMimeType": "application/json",
                },
            }

            for attempt in range(max_attempts):
                try:
                    resp = requests.post(url, json=payload, timeout=120)
                    if resp.status_code != 200:
                        raise RuntimeError(f"{resp.status_code}: {resp.text[:500]}")
                    data = resp.json()
                    raw = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    logger.info(f"[RegenerateDay] ✓ Got response from {model_name}")
                    break
                except Exception as e:
                    logger.warning(
                        f"[RegenerateDay] {model_name} attempt {attempt+1} failed: {e}"
                    )
                    if attempt < max_attempts - 1:
                        time.sleep((attempt + 1) * 10)
            if raw:
                break

        if not raw:
            logger.error("[RegenerateDay] All models failed.")
            return False

        try:
            data = self._extract_json(raw)
            if data is None:
                raise json.JSONDecodeError("Unable to extract JSON", raw, 0)
            validated = DayMealSchema(**data)
        except (json.JSONDecodeError, ValidationError) as e:
            logger.error(f"[RegenerateDay] Parse/validation failed: {e}")
            return False

        # Delete old slots
        day_meal.meal_slots.all().delete()

        # Save new slots
        for slot_name in ["breakfast", "lunch", "dinner"]:
            meal_data = getattr(validated, slot_name)

            ingredients_list = []
            for ing in meal_data.ingredients or []:
                if isinstance(ing, str):
                    ingredients_list.append({"name": ing, "quantity": None, "unit": ""})
                elif hasattr(ing, "dict"):
                    ingredients_list.append(ing.dict())
                elif isinstance(ing, dict):
                    ingredients_list.append(ing)

            food_item, _ = FoodItem.objects.update_or_create(
                name=meal_data.name,
                diet_type=self.profile.diet_preference,
                created_by=self.user,
                defaults={
                    "category": slot_name,
                    "diet_type": self.profile.diet_preference,
                    "created_by": self.user,
                    "calories": meal_data.calories,
                    "protein_g": meal_data.protein,
                    "carbs_g": meal_data.carbs,
                    "fats_g": meal_data.fats,
                    # ✅ Computed on backend — not from Gemini anymore
                    "fiber_g": (
                        meal_data.fiber
                        if meal_data.fiber
                        else round(meal_data.carbs * 0.12)
                    ),
                    "serving_size_g": meal_data.serving_size or 1.0,
                    "serving_unit": meal_data.serving_unit or "plate",
                    "ingredients": ingredients_list,
                    "is_fasting_friendly": is_fasting,
                    "is_jain_friendly": is_jain,
                },
            )

            MealSlot.objects.create(
                day_meal=day_meal,
                slot=slot_name,
                food_item=food_item,
                quantity_g=meal_data.serving_size or 1.0,
                calories=meal_data.calories,
                protein_g=meal_data.protein,
                carbs_g=meal_data.carbs,
                fats_g=meal_data.fats,
            )

        # Update day record
        day_meal.status = "regenerated"
        day_meal.day_notes = validated.day_notes or day_meal.day_notes
        day_meal.save()

        day_meal.update_totals()
        return True

    # ──────────────────────────────────────────────────────
    # 7. PUBLIC ENTRY POINT
    # ──────────────────────────────────────────────────────

    def generate(self, week_start: date = None) -> "WeeklyPlan | None":
        if week_start is None:
            week_start = date.today()

        tdee = self.calculate_tdee()
        beverage_cal = self.calculate_beverage_calories()
        fasting_indices = self.get_fasting_day_indices(week_start)

        prev_period_start = week_start - timedelta(days=3)
        prev_names = list(
            MealSlot.objects.filter(
                day_meal__weekly_plan__user=self.user,
                day_meal__date__gte=prev_period_start,
                day_meal__date__lt=week_start,
            )
            .values_list("food_item__name", flat=True)
            .distinct()
        )
        logger.info(
            f"MealGenerator: TDEE={tdee} BevCal={beverage_cal} FastingDays={fasting_indices}"
        )
        logger.info(f"MealGenerator: {len(prev_names)} previous meals to avoid")

        prompt = self.build_compact_prompt(
            tdee, beverage_cal, week_start, fasting_indices, prev_week_names=prev_names
        )
        validated = self.fetch_from_gemini(prompt)

        if validated is None:
            logger.error("MealGenerator: Generation failed — no plan saved.")
            return None

        plan = self.save_to_db(validated, week_start, tdee)
        logger.info(f"MealGenerator: Plan ID={plan.id} saved successfully.")
        return plan

