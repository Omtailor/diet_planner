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
    def validate_3_meal_density(cls, protein_val, info):
        data = info.data
        if not data:
            return protein_val

        name = data.get("name", "").lower()
        calories = data.get("calories", 0)

        # 1. Hallucination Check: High protein in low-protein foods
        low_protein_triggers = ["ragi", "oat", "poha", "upma", "soup", "juice"]
        if any(t in name for t in low_protein_triggers) and protein_val > 25:
            # UNLESS they added a supplement in ingredients
            ingredients_str = str(data.get("ingredients", "")).lower()
            if (
                "whey" not in ingredients_str
                and "scoop" not in ingredients_str
                and "paneer" not in ingredients_str
            ):
                raise ValueError(
                    f"{data.get('name')} cannot have {protein_val}g protein without a supplement."
                )

        # 2. Fat Density Check: Prevents the "Fat Explosion" for Yash's profile
        fats = data.get("fats", 0)
        if calories > 0 and (fats * 9) / calories > 0.50:
            raise ValueError(
                f"Meal '{data.get('name')}' is too fat-heavy (>50% calories from fat). Increase carbs/protein instead."
            )

        return protein_val


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
        if len(v) != 7:
            raise ValueError(f"Expected 7 days, got {len(v)}")
        return v

    @field_validator("plan_notes")
    @classmethod
    def truncate_notes(cls, v):
        if v and len(v) > 1000:
            return v[:1000]
        return v
