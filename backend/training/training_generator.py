"""
Generates a 7-day training plan based on user profile.
Rule-based — no AI needed here.

Rules:
- Gym user    → uses gym equipment exercises
- No gym      → bodyweight/cardio only
- Rest days   → based on health_time (< 30 min/day = more rest days)
- Age > 50    → more flexibility, less heavy strength
"""
from datetime import timedelta
from .models import Exercise, TrainingPlan, DayTraining


def generate_training_plan(user, profile, week_start=None):
    from datetime import date
    if week_start is None:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())

    # Delete existing plan for this week
    TrainingPlan.objects.filter(user=user, week_start_date=week_start).delete()

    plan = TrainingPlan.objects.create(
        user=user,
        week_start_date=week_start,
        is_active=True,
    )

    has_gym = getattr(profile, 'has_gym', False)
    age = getattr(profile, 'age', 25)
    health_minutes = getattr(profile, 'health_time_minutes', 60)

    # Determine rest days per week based on available time
    if health_minutes < 30:
        rest_days = {2, 4, 6}      # 3 rest days (Wed, Fri, Sun)
    elif health_minutes < 60:
        rest_days = {3, 6}         # 2 rest days (Thu, Sun)
    else:
        rest_days = {6}            # 1 rest day (Sunday only)

    # Filter exercises by equipment
    if has_gym:
        pool = list(Exercise.objects.filter(equipment__in=['gym', 'none']))
    else:
        pool = list(Exercise.objects.filter(equipment='none'))

    # For older users, prefer flexibility + bodyweight
    if age > 50:
        preferred = [e for e in pool if e.category in ('flexibility', 'bodyweight', 'cardio')]
        if len(preferred) >= 3:
            pool = preferred

    if not pool:
        # Fallback: all exercises
        pool = list(Exercise.objects.all())

    # Assign exercises to each day
    used_exercise_ids = set()

    for day_index in range(7):
        current_date = week_start + timedelta(days=day_index)
        is_rest = day_index in rest_days

        day_training = DayTraining.objects.create(
            training_plan=plan,
            day_of_week=day_index,
            date=current_date,
            is_rest_day=is_rest,
        )

        if not is_rest:
            # Pick 3-4 exercises not used recently
            available = [e for e in pool if e.id not in used_exercise_ids]
            if len(available) < 3:
                # Reset used pool if running low
                used_exercise_ids.clear()
                available = pool

            selected = available[:4] if health_minutes >= 60 else available[:3]
            day_training.exercises.set(selected)
            used_exercise_ids.update(e.id for e in selected)

    return plan