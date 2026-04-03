"""
calorie_adjustment.py – Adjusts upcoming DayMeal records after a cheat meal.

Adjustment rules:
  Small  (≤300 kcal)  → mark 2 upcoming days as 'adjusted'
  Medium (300–700)    → mark 4 upcoming days
  Large  (>700 kcal)  → mark 7 upcoming days

Does NOT delete meals. Writes a reduction note to day_notes so the frontend
can display a warning. Flags the GroceryList for refresh.
"""
from datetime import date, timedelta
from meals.models import DayMeal, WeeklyPlan
from grocery.models import GroceryList

SIZE_TO_DAYS = {'small': 2, 'medium': 4, 'large': 7}


def apply_cheat_meal_adjustment(user, cheat_meal):
    final_cal = cheat_meal.final_calories
    if not final_cal or final_cal <= 0:
        return

    adjustment_days = SIZE_TO_DAYS.get(cheat_meal.size, 2)
    daily_reduction = round(final_cal / adjustment_days)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    try:
        plan = WeeklyPlan.objects.get(user=user, week_start_date=week_start)
    except WeeklyPlan.DoesNotExist:
        return

    upcoming = DayMeal.objects.filter(
        weekly_plan=plan,
        date__gt=today,
    ).order_by('date')[:adjustment_days]

    for day in upcoming:
        day.status = 'adjusted'
        existing = day.day_notes or ''
        day.day_notes = (
            f"{existing} | Cheat meal adjustment: -{daily_reduction} kcal/day "
            f"(from {cheat_meal.food_name or 'cheat meal'} on {cheat_meal.logged_at.date()})"
        ).strip(' |')
        day.save(update_fields=['status', 'day_notes'])

    # Flag grocery list for refresh
    try:
        grocery = GroceryList.objects.get(weekly_plan=plan)
        grocery.needs_refresh = True
        grocery.save(update_fields=['needs_refresh'])
    except GroceryList.DoesNotExist:
        pass