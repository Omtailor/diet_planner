import json
import time
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

        # ──────────────────────────────────────────────────────
        # MEAL CALORIE DISTRIBUTION (Strict 3 Meals)
        # ──────────────────────────────────────────────────────
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

        # ──────────────────────────────────────────────────────
        # PROTEIN & SUPPLEMENT LOGIC
        # ──────────────────────────────────────────────────────
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

        # Fat ceiling
        fat_ceiling = 55 if p.goal in ["weight_loss", "fat_loss"] else 85
        fat_per_meal_max = round(fat_ceiling / 3)

        # Logic for high calorie profiles (like Yash)
        high_cal_instruction = f"""
        ⚠️ HIGH CALORIE TARGET ({net_meal_calories} kcal) — hit this through LARGER PORTIONS of real food:
        - BREAKFAST: Use generous portions — 3 eggs or 200g paneer, 2–3 rotis or 1.5 cups oats,
        full bowl of dal or curd (200g) as a side. NO protein shakes or smoothies.
        - LUNCH: Serve 1.5 cups cooked rice or 3 rotis, 200g paneer/chicken, full bowl dal + raita.
        Add a side of roasted chana or handful of mixed nuts (20g) for calorie density.
        - DINNER: Keep it lighter but protein-rich — large bowl dal/sabzi, 150g paneer/tofu,
        1–2 rotis allowed for muscle-building goal. Add 1 tbsp ghee for healthy calories.
        - Prioritize PROTEIN + COMPLEX CARBS to fill the gap — NOT fats.
        - Every meal must feel like a complete, satisfying Indian meal — not a supplement stack.
    """

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

        # Age-specific dietary guidance
        if p.age < 25:
            age_guidance = (
                "Age < 25: Higher carb tolerance. Prioritize variety and micronutrient density. "
                "Include iron-rich foods (spinach, rajma) and calcium sources (curd, ragi) regularly."
            )
        elif p.age < 40:
            age_guidance = (
                "Age 25–40: Balanced macros. Prioritize fibre for metabolic health. "
                "Include fermented foods (curd, idli, dosa) at least 2x/week for gut health. "
                "Add flaxseeds or walnuts 3x/week for Omega-3."
            )
        elif p.age < 55:
            age_guidance = (
                "Age 40–55: Reduce sodium — avoid extra salt, papad, heavy pickles daily. "
                "Increase anti-inflammatory foods: turmeric, ginger, flaxseeds, walnuts. "
                "Muscle preservation is critical — prioritize protein at every meal. "
                "Reduce simple carbs aggressively — insulin sensitivity declines with age. "
                "Include calcium-rich ragi, sesame seeds, or curd daily."
            )
        else:
            age_guidance = (
                "Age > 55: Calcium mandatory every day — curd, ragi, sesame, moringa. "
                "Prefer soft, easily digestible textures. Split protein across meals (max 30g/sitting). "
                "Include high-fibre foods to support digestion and bowel health."
            )

        # Protein sources guidance by diet
        protein_sources = {
            "veg": "paneer, Greek yogurt/hung curd, moong dal, rajma, chana, tofu, besan, quinoa, soy milk",
            "jain": "paneer, curd, moong dal, chana dal, toor dal, quinoa, besan — NO onion/garlic",
            "non_veg": "chicken breast, eggs, fish, paneer, dal, Greek yogurt",
        }.get(p.diet_preference, "paneer, dal, curd, chana, rajma, tofu")

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
Breakdown       : Breakfast ~{b_cal} kcal
                  Lunch     ~{l_cal} kcal
                  Dinner    ~{d_cal} kcal
{beverage_note}
{high_cal_instruction}

# ✅ NEW
CALORIE RULES:
- Vary daily totals naturally by ±75 kcal — do NOT generate identical totals across days.
- No single meal may exceed 45% of the daily calorie budget ({round(net_meal_calories * 0.45)} kcal max/meal).
- NEVER go below {1200 if p.gender == 'female' else 1400} kcal/day total.
- HARD FAT LIMIT: No single meal may exceed {fat_per_meal_max}g fat — NON-NEGOTIABLE.
- HARD FAT LIMIT: Daily fat total must stay under {fat_ceiling}g — NON-NEGOTIABLE.
- DINNER HARD CAP: Dinner must be ≤ {d_cal} kcal. Soup, dal, or sabzi ONLY at dinner.
  {'No roti or rice at dinner.' if p.goal in ['weight_loss', 'fat_loss'] else 'Minimize rice at dinner.'}

══════════════════════════════════════════
PROTEIN TARGETS
══════════════════════════════════════════
Daily protein target : {min_protein}g ({protein_multiplier}g × {weight}kg)
Minimum per meal     : {min_protein_per_meal}g (distribute evenly)
- Breakfast: minimum {max(18, min_protein_per_meal)}g protein
- Lunch    : minimum {max(25, min_protein_per_meal)}g protein
- Dinner   : minimum {max(20, min_protein_per_meal)}g protein

Best protein sources for this user: {protein_sources}
Include at least ONE high-protein ingredient from the above list in EVERY meal.

FORBIDDEN as primary breakfast for weight loss/fat loss goals:
Plain Poha (without protein addition), plain white idli (without sambar/chutney),
Sabudana Khichdi (ONLY allowed on fasting days), plain bread toast.

══════════════════════════════════════════
MACRO TARGETS
══════════════════════════════════════════
Macro split (weight loss): Protein 28% | Carbs 42% | Fats 30%
Daily fat ceiling        : {fat_ceiling}g total — do NOT exceed this.
Daily carb target        : {round((net_meal_calories * 0.42) / 4)}g
- Prefer complex carbs ONLY: brown rice, millets (bajra/jowar/ragi), quinoa,
  whole wheat roti, oats, daliya. White rice only on special occasion meals.
- Dinner carbs must be ≤ 50% of lunch carbs.
- No meal should exceed 100g carbs.
- Include 25–35g total dietary fibre per day.
- Include vegetables (min 100g) in EVERY meal — non-negotiable.

══════════════════════════════════════════
MEAL CONSTRUCTION — PLATE METHOD
══════════════════════════════════════════
Each meal must follow this structure:
  50% non-starchy vegetables (spinach, capsicum, lauki, tomato, cucumber, broccoli)
  25% lean protein source (dal, paneer, chana, tofu, rajma, curd, eggs/chicken if non-veg)
  25% complex carbohydrate (brown rice, millets, whole wheat roti, oats, quinoa)
  + small healthy fat portion (≤1 tsp ghee, or nuts/seeds garnish)

Breakfast must be filling and protein-anchored — not starch-first.
Lunch is the largest meal — must include dal OR legume OR paneer + salad/raita side.
Dinner is the lightest meal — soup, dal, or sabzi-based. Minimize rice at dinner.

══════════════════════════════════════════
VARIETY RULES
══════════════════════════════════════════
- 21 UNIQUE meal names across the 7 days — zero repeats.
- Rotate protein source daily: rajma → chana → moong → paneer → tofu → dal makhani → lobia
- Rotate grain/carb daily: brown rice → bajra roti → quinoa → jowar roti → daliya → oats → ragi
- Include at least 3 regional styles across the week (e.g. Maharashtrian, South Indian, Punjabi, Gujarati)
- Include at least 2 fermented/probiotic meals per week: curd, idli, dosa, dhokla, kanji, buttermilk

══════════════════════════════════════════
AGE-SPECIFIC GUIDANCE
══════════════════════════════════════════
{age_guidance}

══════════════════════════════════════════
MICRONUTRIENT CHECKLIST (across the week)
══════════════════════════════════════════
- Iron: include spinach, methi, rajma, or lobia at least 3x — pair with lemon/tomato (Vitamin C boosts absorption)
- Calcium: include curd, ragi, or sesame seeds every day
- Omega-3: include flaxseeds, walnuts, or chia seeds at least 3x
- Zinc: include pumpkin seeds, chickpeas, or cashews at least 2x
- B12 note (vegetarian): include fortified milk or curd daily

══════════════════════════════════════════
DAY NOTES QUALITY STANDARD
══════════════════════════════════════════
Each day_notes must:
- Reference a specific nutrient or health mechanism (NOT generic statements)
- Explain WHY that day's meals suit this user's specific goal
- BAD example:  "Balanced intake with complex carbs for energy."
- GOOD example: "Ragi at breakfast delivers 10x more calcium than wheat — critical for bone density.
                 Rajma-rice combo at lunch forms a complete protein (all 9 essential amino acids).
                 Spinach dal at dinner provides non-heme iron; the tomato garnish triples absorption."

══════════════════════════════════════════
ANTI-HALLUCINATION — MACRO SANITY CHECKS
══════════════════════════════════════════
Before finalizing each meal, verify:
1. calories ≈ (protein × 4) + (carbs × 4) + (fats × 9) — tolerance ±30 kcal
2. No single meal exceeds: 1,100 kcal | 60g protein | 100g carbs | 45g fat
3. Realistic Indian portion benchmarks:
   - 1 medium roti (30g)        = 80–100 kcal
   - 1 cup cooked brown rice    = 200–220 kcal
   - 100g paneer                = 265 kcal, 18g protein
   - 1 bowl cooked dal (200ml)  = 150–180 kcal, 9–12g protein
   - 1 cup curd (200g)          = 120 kcal, 7g protein
   If your numbers deviate significantly, recalculate before returning.

══════════════════════════════════════════
7-DAY PLAN STARTING ({week_start.strftime("%A, %d %b %Y")})
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
7. day_notes: specific, educational, explain WHY meals suit this user's goal
8. is_jain_friendly: {str(p.diet_preference == 'jain').lower()} for ALL meals
9. is_fasting_friendly: true ONLY on fasting days, false on all regular days
10. Macros sanity check: calories ≈ (protein × 4) + (carbs × 4) + (fats × 9)
11. Day 1 starts on {week_start.strftime("%A, %d %b %Y")} — do NOT assume Monday is Day 1
12. VOLUME RULE: A meal exceeding 800 kcal MUST have a total ingredient weight of at least 350g
13. FAT DENSITY: No meal should derive more than 45% of its calories from fats. If you need more calories, increase the portion of complex carbs (Rice/Roti) or lean protein


══════════════════════════════════════════
FINAL VERIFICATION — MANDATORY BEFORE RETURNING JSON
══════════════════════════════════════════
For EVERY meal, verify ALL of the following before outputting:
  ✓ calories ≈ (protein × 4) + (carbs × 4) + (fats × 9) — tolerance ±25 kcal only
  ✓ fats ≤ {fat_per_meal_max}g per meal (HARD LIMIT — fix if exceeded)
  ✓ Daily fat total ≤ {fat_ceiling}g (HARD LIMIT — fix if exceeded)
  ✓ Dinner ≤ {d_cal} kcal (HARD LIMIT — fix if exceeded)
  ✓ No meal name appears more than once across all 7 days (21 unique names)
  ✓ Protein per meal calculated from ACTUAL ingredients — not rounded to 45g
    Example: 100g paneer=18g, 1 cup rajma=15g, 100g tofu=8g, 200ml dal=10g
  ✓ No single meal exceeds 90g carbs
If any check fails — FIX that meal before returning. Do not skip this step.


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
      "day_notes": "Specific educational note explaining nutrient benefits for this user's goal"
    }},
    {{ ...day 2... }},
    {{ ...day 3... }},
    {{ ...day 4... }},
    {{ ...day 5... }},
    {{ ...day 6... }},
    {{ ...day 7... }}
  ],
  "total_weekly_calories": {net_meal_calories * 7},
  "plan_notes": "Brief summary of the overall plan approach for this user"
}}
"""

    # ──────────────────────────────────────────────────────
    # 5. CALL GEMINI + PYDANTIC VALIDATION
    # ──────────────────────────────────────────────────────

    def fetch_from_gemini(self, prompt: str) -> WeeklyPlanSchema | None:
        import time

        # Primary model with retries, fallback to 2.0-flash on persistent 503
        models_to_try = [
            ("gemini-2.5-flash", 3),  # Primary
            ("gemini-2.5-flash-lite", 2),  # Fallback
        ]

        raw = None

        for model_name, max_attempts in models_to_try:
            print(f"[MealGenerator] Trying model: {model_name}")
            for attempt in range(max_attempts):
                try:
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            # ✅ FIXED: Lower temperature for mathematical accuracy
                            temperature=0.1,
                            response_mime_type="application/json",
                        ),
                    )
                    raw = response.text.strip()
                    print(f"[MealGenerator] ✓ Got response from {model_name}")
                    break  # Success — exit attempt loop

                except Exception as e:
                    print(
                        f"[MealGenerator] {model_name} attempt {attempt+1} failed: {e}"
                    )
                    if attempt < max_attempts - 1:
                        wait = (attempt + 1) * 10
                        print(f"[MealGenerator] Retrying in {wait}s...")
                        time.sleep(wait)

            if raw:
                break  # Got a response — exit model loop

        if not raw:
            print("[MealGenerator] All models and attempts failed.")
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
            actual_date = week_start + datetime.timedelta(days=day_data.day_number - 1)
            actual_weekday = actual_date.weekday()  # 0=Monday ... 6=Sunday

            day_meal, _ = DayMeal.objects.update_or_create(
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

                food_item, _ = FoodItem.objects.update_or_create(
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

                MealSlot.objects.create(
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

            day_meal.update_totals()

        return plan

    # ──────────────────────────────────────────────────────
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
- HARD FAT LIMIT: Daily fat total must stay under {fat_ceiling}g — NON-NEGOTIABLE.
- No meal should derive more than 45% of its calories from fats.
- No single meal exceeds: 1,100 kcal | 100g carbs | {fat_per_meal_max}g fat

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
RESPONSE — VALID JSON ONLY, NO MARKDOWN
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
    "fiber": 0.0,
    "serving_size": 1.0,
    "serving_unit": "plate",
    "ingredients": [
      {{"name": "ingredient name", "quantity": 100, "unit": "g"}}
    ],
    "is_fasting_friendly": false,
    "is_jain_friendly": false
  }},
  "lunch": {{ ...same structure... }},
  "dinner": {{ ...same structure... }},
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

        # Collect existing meal names from the rest of the week to avoid repeats
        existing_names = list(
            MealSlot.objects.filter(day_meal__weekly_plan=day_meal.weekly_plan)
            .exclude(day_meal=day_meal)
            .values_list("food_item__name", flat=True)
        )

        prompt = self.build_regen_prompt(day_meal, existing_names)

        models_to_try = [
            ("gemini-2.0-flash", 3),
            ("gemini-1.5-flash", 2),
        ]

        raw = None
        for model_name, max_attempts in models_to_try:
            for attempt in range(max_attempts):
                try:
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            temperature=0.1,
                            response_mime_type="application/json",
                        ),
                    )
                    raw = response.text.strip()
                    print(f"[RegenerateDay] ✓ Got response from {model_name}")
                    break
                except Exception as e:
                    print(
                        f"[RegenerateDay] {model_name} attempt {attempt+1} failed: {e}"
                    )
                    if attempt < max_attempts - 1:
                        time.sleep((attempt + 1) * 10)
            if raw:
                break

        if not raw:
            print("[RegenerateDay] All models failed.")
            return False

        try:
            data = json.loads(raw)
            validated = DayMealSchema(**data)
        except (json.JSONDecodeError, ValidationError) as e:
            print(f"[RegenerateDay] Parse/validation failed: {e}")
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

            MealSlot.objects.create(
                day_meal=day_meal,
                slot=slot_name,
                food_item=food_item,
                quantity_g=meal_data.serving_size,
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
