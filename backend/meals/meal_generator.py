import json
from datetime import date, timedelta

from google import genai
from google.genai import types
from django.conf import settings
from pydantic import ValidationError

from meals.schemas import WeeklyPlanSchema
from meals.models import WeeklyPlan, DayMeal, MealSlot, FoodItem


class MealPlanGenerator:

    def __init__(self, profile):
        self.profile = profile
        self.user = profile.user
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

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

        # health_time_minutes is total minutes in your model
        health_hours = p.health_time_minutes / 60

        if health_hours < 0.5:
            multiplier = 1.2
        elif health_hours < 1.0:
            multiplier = 1.375
        elif health_hours < 1.5:
            multiplier = 1.55
        else:
            multiplier = 1.725

        tdee = bmr * multiplier

        goal_adjustments = {
            "fat_loss": -300,
            "weight_loss": -500,
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
        if not self.profile.is_fasting:
            return set()

        day_name_to_weekday = {
            "monday": 0,
            "tuesday": 1,
            "wednesday": 2,
            "thursday": 3,
            "friday": 4,
            "saturday": 5,
            "sunday": 6,
        }

        fasting_raw = (self.profile.fasting_days or "").lower()
        fasting_indices = set()

        for day_name, weekday in day_name_to_weekday.items():
            if day_name in fasting_raw:
                # Convert absolute weekday → loop index relative to week_start
                loop_index = (weekday - week_start.weekday()) % 7
                fasting_indices.add(loop_index)

        return fasting_indices

    # ──────────────────────────────────────────────────────
    # 4. BUILD PERSONALIZED GEMINI PROMPT
    # ──────────────────────────────────────────────────────

    def build_prompt(
        self, tdee: int, beverage_cal: int, week_start: date, fasting_indices: set
    ) -> str:
        p = self.profile
        net_meal_calories = tdee - beverage_cal

        # Day-by-day schedule block
        day_schedule_lines = []
        for i in range(7):
            day_date = week_start + timedelta(days=i)
            is_fasting = i in fasting_indices
            day_label = day_date.strftime("%A, %d %b")
            notes = []

            if is_fasting:
                notes.append(
                    f"FASTING DAY ({p.fasting_type}) — ONLY use: "
                    f"sabudana, makhana, kuttu atta, rajgira, singhara, "
                    f"sendha namak, fruits, curd, milk, nuts, ghee"
                )
            else:
                if p.has_gym:
                    notes.append("Gym day — boost protein, include complex carbs")
                else:
                    notes.append("Regular day — balanced macros")

            day_schedule_lines.append(f"  Day {i+1} ({day_label}): {' | '.join(notes)}")

        day_schedule = "\n".join(day_schedule_lines)

        diet_descriptions = {
            "jain": (
                "STRICT Jain vegetarian — NO onion, NO garlic, NO potato, NO carrot, "
                "NO beetroot, NO radish, NO turnip, NO root vegetables at all. "
                "Use paneer, lentils, rice, wheat, above-ground vegetables only."
            ),
            "veg": (
                "Vegetarian — no meat, no eggs, no seafood. "
                "Dairy (milk, curd, paneer, ghee) is allowed."
            ),
            "non_veg": (
                "Non-vegetarian — include chicken, eggs, or fish on at least 4 days. "
                "Remaining days can be vegetarian for variety."
            ),
        }

        goal_descriptions = {
            "fat_loss": (
                "Fat Loss — light, high-fiber meals. Moderate protein. "
                "Avoid fried foods. Prefer grilled, steamed, boiled."
            ),
            "weight_loss": (
                "Weight Loss — strict calorie deficit. High-volume low-calorie foods. "
                "Avoid heavy carbs at dinner. Soups, salads, dals preferred at night."
            ),
            "muscle_building": (
                "Muscle Building — high protein at EVERY meal. "
                "Include paneer/chicken/dal/eggs generously. "
                "Complex carbs at breakfast and lunch."
            ),
            "maintenance": (
                "Maintenance — balanced macros. Focus on variety and sustainability."
            ),
        }

        beverage_note = ""
        if beverage_cal > 0:
            beverage_note = (
                f"\n⚠️  User consumes beverages adding ~{beverage_cal} kcal/day. "
                f"Meal calories must total {net_meal_calories} kcal (NOT {tdee})."
            )

        return f"""
You are a certified Indian nutritionist and professional meal planner.
Generate a complete, highly personalized 7-day Indian meal plan for this user.

══════════════════════════════════════════
USER PROFILE
══════════════════════════════════════════
Name     : {p.user.first_name or "User"}
Age      : {p.age} years
City     : {p.city}
Height   : {p.height_cm} cm
Weight   : {p.weight_kg} kg
BMI      : {p.bmi}
Gender   : {p.gender}

══════════════════════════════════════════
GOAL
══════════════════════════════════════════
{goal_descriptions.get(p.goal, "Maintenance — balanced nutrition")}

══════════════════════════════════════════
DIET
══════════════════════════════════════════
{diet_descriptions.get(p.diet_preference, "Vegetarian")}

══════════════════════════════════════════
CALORIES
══════════════════════════════════════════
Daily TDEE      : {tdee} kcal
Meal budget/day : {net_meal_calories} kcal
Breakdown       : Breakfast ~25% ({round(net_meal_calories * 0.25)} kcal)
                  Lunch     ~40% ({round(net_meal_calories * 0.40)} kcal)
                  Dinner    ~35% ({round(net_meal_calories * 0.35)} kcal)
{beverage_note}

══════════════════════════════════════════
7-DAY PLAN STARTING TODAY ({week_start.strftime("%A, %d %b %Y")})
══════════════════════════════════════════
{day_schedule}

══════════════════════════════════════════
STRICT RULES
══════════════════════════════════════════
1. Return ALL 7 days — no skipping
2. NO meal name repeats across 7 days (21 unique meals total)
3. Use authentic Indian dish names only
4. Fasting days: ALL 3 meals must use ONLY fasting-safe ingredients listed above
5. ingredients: 5-10 items per meal. Each item MUST be an object with "name" (string), "quantity" (number), "unit" (g/ml/pcs/tsp/tbsp/cup)
6. Calories must match realistic Indian portion sizes
7. day_notes: specific, helpful, explain why meals suit this user's goal
8. is_jain_friendly: {str(p.diet_preference == 'jain').lower()} for ALL meals
9. is_fasting_friendly: true ONLY on fasting days, false on all regular days
10. Macros sanity check: calories ≈ (protein × 4) + (carbs × 4) + (fats × 9)
11. Day 1 starts on {week_start.strftime("%A, %d %b %Y")} — do NOT assume Monday is Day 1

══════════════════════════════════════════
RESPONSE — VALID JSON ONLY, NO MARKDOWN
══════════════════════════════════════════
{{
  "days": [
    {{
      "day_number": 1,
      "date_label": "{week_start.strftime('%A, %d %b')}",
      "is_fasting_day": false,
      "breakfast": {{
        "meal_type": "breakfast",
        "name": "Poha",
        "calories": 250,
        "protein": 5.0,
        "carbs": 45.0,
        "fats": 6.0,
        "fiber": 2.0,
        "serving_size": 1.0,
        "serving_unit": "plate",
        "ingredients": [
  {{"name": "flattened rice", "quantity": 80, "unit": "g"}},
  {{"name": "mustard seeds", "quantity": 5, "unit": "g"}},
  {{"name": "onion", "quantity": 30, "unit": "g"}},
  {{"name": "turmeric", "quantity": 2, "unit": "g"}},
  {{"name": "peanuts", "quantity": 20, "unit": "g"}}
],
        "is_fasting_friendly": false,
        "is_jain_friendly": false
      }},
      "lunch": {{ ...same structure, meal_type: "lunch" }},
      "dinner": {{ ...same structure, meal_type: "dinner" }},
      "day_notes": "Regular gym day — high protein lunch aids muscle recovery"
    }},
    {{ ...day 2... }},
    {{ ...day 3... }},
    {{ ...day 4... }},
    {{ ...day 5... }},
    {{ ...day 6... }},
    {{ ...day 7... }}
  ],
  "total_weekly_calories": {net_meal_calories * 7},
  "plan_notes": "Brief summary of the plan approach for this user"
}}
"""

    # ──────────────────────────────────────────────────────
    # 5. CALL GEMINI + PYDANTIC VALIDATION
    # ──────────────────────────────────────────────────────

    def fetch_from_gemini(self, prompt: str) -> WeeklyPlanSchema | None:
        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.4,
                    response_mime_type="application/json",
                ),
            )
            raw = response.text.strip()
        except Exception as e:
            print(f"[MealGenerator] Gemini API call failed: {e}")
            return None

        try:
            data = json.loads(raw)
        except json.JSONDecodeError as e:
            print(f"[MealGenerator] JSON parse failed: {e}")
            print(f"[MealGenerator] Raw response: {raw[:500]}")
            return None

        try:
            validated = WeeklyPlanSchema(**data)
            return validated
        except ValidationError as e:
            print(f"[MealGenerator] Pydantic validation failed:\n{e}")
            return None

    # ──────────────────────────────────────────────────────
    # 6. SAVE TO DATABASE
    # ──────────────────────────────────────────────────────

    def save_to_db(self, validated, week_start, tdee):
        from .models import WeeklyPlan, DayMeal, FoodItem, MealSlot
        import datetime

        week_end = week_start + datetime.timedelta(days=6)

        plan, _ = WeeklyPlan.objects.get_or_create(
            user=self.user,
            week_start_date=week_start,
            defaults={
                "week_end_date": week_end,
                "target_calories": tdee,
                "plan_notes": validated.plan_notes or "",
            },
        )

        for day_data in validated.days:
            actual_date = week_start + datetime.timedelta(
                days=day_data.day_number - 1
            )
            actual_weekday = actual_date.weekday()  # 0=Monday ... 6=Sunday

            day_meal, _ = DayMeal.objects.get_or_create(
                weekly_plan=plan,
                day_of_week=actual_weekday,
                defaults={
                    "date": actual_date,
                    "is_fasting_day": day_data.is_fasting_day,
                    "day_notes": day_data.day_notes or "",
                },
            )

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

                food_item, _ = FoodItem.objects.get_or_create(
                    name=meal_data.name,
                    defaults={
                        "category": slot_name,
                        "diet_type": self.profile.diet_preference,
                        "calories": meal_data.calories,
                        "protein_g": meal_data.protein,
                        "carbs_g": meal_data.carbs,
                        "fats_g": meal_data.fats,
                        "fiber_g": meal_data.fiber,
                        "serving_size_g": meal_data.serving_size,
                        "serving_unit": meal_data.serving_unit,
                        "ingredients": ingredients_list,
                        "is_fasting_friendly": meal_data.is_fasting_friendly,
                        "is_jain_friendly": meal_data.is_jain_friendly,
                    },
                )

                MealSlot.objects.get_or_create(
                    day_meal=day_meal,
                    slot=slot_name,
                    defaults={
                        "food_item": food_item,
                        "quantity_g": meal_data.serving_size,
                        "calories": meal_data.calories,
                        "protein_g": meal_data.protein,
                        "carbs_g": meal_data.carbs,
                        "fats_g": meal_data.fats,
                    },
                )

        return plan

    # ──────────────────────────────────────────────────────
    # 7. PUBLIC ENTRY POINT
    # ──────────────────────────────────────────────────────

    def generate(self, week_start: date = None) -> WeeklyPlan | None:
        """
        Call this from:
        - OnboardingView (auto after profile save)
        - POST /api/meals/generate/
        - End of week (next week generation)
        """
        if week_start is None:
            today = date.today()
            week_start = today  # Start from TODAY, not last Monday

        tdee = self.calculate_tdee()
        beverage_cal = self.calculate_beverage_calories()
        fasting_indices = self.get_fasting_day_indices(week_start)

        print(
            f"[MealGenerator] TDEE={tdee} | BevCal={beverage_cal} | FastingDays={fasting_indices}"
        )

        prompt = self.build_prompt(tdee, beverage_cal, week_start, fasting_indices)
        validated = self.fetch_from_gemini(prompt)

        if validated is None:
            print("[MealGenerator] ✗ Generation failed — no plan saved.")
            return None

        plan = self.save_to_db(validated, week_start, tdee)
        print(f"[MealGenerator] ✓ WeeklyPlan ID={plan.id} saved successfully.")
        return plan
