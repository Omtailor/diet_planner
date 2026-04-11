from pydantic import BaseModel, field_validator
from typing import List, Optional, Union


class IngredientSchema(BaseModel):
    name: str
    quantity: Union[float, int, str, None] = None
    unit: str = ""


class MealSchema(BaseModel):
    meal_type: str
    name: str
    calories: float
    protein: float
    carbs: float
    fats: float
    fiber: float = 0.0
    serving_size: float = 100.0
    serving_unit: str = "g"
    ingredients: list[Union[IngredientSchema, str]] = []
    is_fasting_friendly: bool = False
    is_jain_friendly: bool = False

    @field_validator("protein")
    @classmethod
    def validate_protein(cls, protein_val, info):
        data = info.data
        if not data:
            return protein_val

        name = data.get("name", "").lower()
        calories = data.get("calories", 0)
        ingredients_str = str(data.get("ingredients", "")).lower()
        has_supplement = any(
            t in ingredients_str for t in ["whey", "scoop", "protein powder"]
        )

        # ── Hallucination clamp: low-protein foods claiming high protein ──
        # Only trigger if the DISH ITSELF is primarily a soup/light item
        # not if soup appears as a side in a larger meal name
        low_protein_solo = ["poha", "juice", "dal shorba", "kanji", "lassi"]
        low_protein_with_check = ["ragi", "oat", "upma"]

        is_solo_low_protein = any(
            name.startswith(t) or name == t for t in low_protein_solo
        )
        is_light_dish = any(
            t in name for t in low_protein_with_check
        ) and "chicken" not in name and "egg" not in name and "paneer" not in name

        # Only clamp if it's clearly a standalone light dish
        if (is_solo_low_protein or is_light_dish) and not has_supplement:
            # Realistic ceiling for these dishes even with paneer/egg additions
            max_realistic = 22
            if protein_val > max_realistic:
                print(
                    f"[SchemaValidator] ⚠️ Clamping protein for '{data.get('name')}': "
                    f"{protein_val}g → {max_realistic}g"
                )
                protein_val = max_realistic

        # ── Global hard cap: no single meal can exceed 65g protein ──
        # (only possible with 500g+ chicken which is unrealistic for one meal)
        if protein_val > 65:
            print(
                f"[SchemaValidator] ⚠️ Clamping unrealistic protein for '{data.get('name')}': "
                f"{protein_val}g → 65g"
            )
            protein_val = 65.0

        return protein_val

    @field_validator("fats")
    @classmethod
    def validate_fats(cls, fats_val, info):
        data = info.data
        if not data:
            return fats_val

        calories = data.get("calories", 0)

        # ── Fat density clamp: no meal > 50% calories from fat ──
        if calories > 0 and (fats_val * 9) / calories > 0.50:
            # Clamp fats to 45% of calories
            max_fats = round((calories * 0.45) / 9, 1)
            print(
                f"[SchemaValidator] ⚠️ Clamping fat density for '{data.get('name')}': "
                f"{fats_val}g → {max_fats}g"
            )
            fats_val = max_fats

        # ── Absolute per-meal fat cap aligned with prompt hard limit ──
        # muscle_building ceiling = 85g/day ÷ 3 meals = ~28g, but we allow
        # some flexibility here — hard rejection happens via prompt
        if fats_val > 45:
            print(
                f"[SchemaValidator] ⚠️ Clamping absolute fat for '{data.get('name')}': "
                f"{fats_val}g → 45g"
            )
            fats_val = 45.0

        return fats_val

    @field_validator("calories")
    @classmethod
    def validate_calorie_math(cls, cal_val, info):
        data = info.data
        if not data:
            return cal_val

        p = data.get("protein", 0)
        c = data.get("carbs", 0)
        f = data.get("fats", 0)
        expected = (p * 4) + (c * 4) + (f * 9)

        if expected > 0 and abs(cal_val - expected) > 50:
            # Correct the stated calories to match macro math
            print(
                f"[SchemaValidator] ⚠️ Correcting calories for '{data.get('name', '?')}': "
                f"stated={cal_val} → macro_math={round(expected)}"
            )
            return round(expected)

        return cal_val

    @field_validator("calories")
    @classmethod
    def validate_calories(cls, cal_val, info):
        # ── Hard cap: no single meal exceeds 1200 kcal ──
        if cal_val > 1200:
            print(f"[SchemaValidator] ⚠️ Clamping calories: {cal_val} → 1200")
            return 1200.0
        return cal_val


class DayMealSchema(BaseModel):
    day_number: int
    date_label: str
    is_fasting_day: bool
    breakfast: MealSchema
    lunch: MealSchema
    dinner: MealSchema
    day_notes: Optional[str] = None


class WeeklyPlanSchema(BaseModel):
    days: List[DayMealSchema]
    total_weekly_calories: float
    plan_notes: Optional[str] = None

    @field_validator("days")
    @classmethod
    def must_have_7_days(cls, v):
        if len(v) < 7:
            raise ValueError(f"Expected 7 days, got {len(v)} — too few to save.")
        if len(v) > 7:
            print(f"[SchemaValidator] ⚠️ Got {len(v)} days, trimming to 7.")
            return v[:7]
        return v

    @field_validator("plan_notes")
    @classmethod
    def truncate_notes(cls, v):
        if v and len(v) > 1000:
            return v[:1000]
        return v
