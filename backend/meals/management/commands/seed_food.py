from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from users.models import UserProfile
from meals.meal_generator import MealPlanGenerator


class Command(BaseCommand):
    help = "Test 7-day meal plan generation for a given username"

    def add_arguments(self, parser):
        parser.add_argument(
            "username",
            type=str,
            help="Username of the user to generate a plan for"
        )

    def handle(self, *args, **options):
        username = options["username"]

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"User '{username}' not found."))
            return

        try:
            profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"Profile for '{username}' not found. Complete onboarding first."))
            return

        self.stdout.write(f"Generating meal plan for: {username}")
        self.stdout.write(f"  Goal        : {profile.goal}")
        self.stdout.write(f"  Diet        : {profile.diet_preference}")
        self.stdout.write(f"  Fasting     : {profile.is_fasting}")
        self.stdout.write(f"  Gym         : {profile.has_gym}")

        generator = MealPlanGenerator(profile)
        plan = generator.generate()

        if plan:
            self.stdout.write(self.style.SUCCESS(
                f"\n✓ Plan generated successfully! WeeklyPlan ID: {plan.id}"
            ))
            self.stdout.write(f"  Week: {plan.week_start_date} → {plan.week_end_date}")
            self.stdout.write(f"  Target calories: {plan.target_calories} kcal/day")
        else:
            self.stderr.write(self.style.ERROR(
                "\n✗ Plan generation failed. Check Gemini API key and profile completeness."
            ))