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

    @field_validator('ingredients', mode='before')
    @classmethod
    def normalize_ingredients(cls, v):
        result = []
        for item in v:
            if isinstance(item, str):
                # Convert plain string to IngredientSchema dict
                result.append({"name": item, "quantity": None, "unit": ""})
            elif isinstance(item, dict):
                result.append(item)
            else:
                result.append(item)
        return result

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

    @field_validator('days')
    @classmethod
    def must_have_7_days(cls, v):
        if len(v) != 7:
            raise ValueError(f'Expected 7 days, got {len(v)}')
        return v

    @field_validator('plan_notes')
    @classmethod
    def truncate_notes(cls, v):
        if v and len(v) > 1000:
            return v[:1000]
        return v