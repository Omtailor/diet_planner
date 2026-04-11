from datetime import date, timedelta, datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser

from .models import GroceryList, GroceryItem
from .serializers import GroceryListSerializer
from .grocery_generator import generate_grocery_list
from meals.models import DayMeal, MealSlot


class GroceryListView(APIView):
    """GET /api/grocery/ — Get grocery list, optionally filtered by date range."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        # ── Custom date range: build grocery on the fly from meal slots ──
        if start_date and end_date:
            try:
                start = datetime.strptime(start_date, "%Y-%m-%d").date()
                end = datetime.strptime(end_date, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD."}, status=400
                )

            # Get all meal slots for days in the range belonging to this user
            slots = MealSlot.objects.filter(
                day_meal__weekly_plan__user=request.user,
                day_meal__date__gte=start,
                day_meal__date__lte=end,
                food_item__isnull=False,
            ).select_related("food_item", "day_meal")

            if not slots.exists():
                return Response(
                    {"error": "No meal plan found for the selected date range."},
                    status=404,
                )

            # Aggregate ingredients from all food items in those slots
            merged = {}
            for slot in slots:
                ingredients = slot.food_item.ingredients or []
                for ing in ingredients:
                    # Each ingredient: {"name": "Paneer", "quantity": 200, "unit": "g"}
                    name = ing.get("name", "").strip()
                    unit = ing.get("unit", "g").strip()
                    qty = ing.get("quantity", 0)

                    if not name:
                        continue

                    key = (name.lower(), unit.lower())
                    if key in merged:
                        merged[key]["quantity"] = round(
                            merged[key]["quantity"] + qty, 2
                        )
                    else:
                        merged[key] = {
                            "id": None,  # not a DB item — generated on the fly
                            "ingredient_name": name,
                            "quantity": round(qty, 2),
                            "unit": unit,
                            "is_checked": False,
                        }

            items_list = sorted(
                merged.values(), key=lambda x: x["ingredient_name"].lower()
            )

            return Response(
                {
                    "id": None,
                    "items": items_list,
                    "total_items": len(items_list),
                    "checked_items": 0,
                }
            )

        # ── No date filter — fall back to latest plan's saved grocery list ──
        try:
            grocery = (
                GroceryList.objects.filter(user=request.user)
                .order_by("-weekly_plan__week_start_date")
                .first()
            )

            if not grocery:
                return Response(
                    {"error": "No grocery list found. Generate a meal plan first."},
                    status=404,
                )

            return Response(GroceryListSerializer(grocery).data)

        except Exception:
            return Response(
                {"error": "No grocery list found. Generate a meal plan first."},
                status=404,
            )


class CheckGroceryItemView(APIView):
    """PATCH /api/grocery/check/<id>/ — Toggle check/uncheck a grocery item."""

    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def patch(self, request, pk):
        try:
            item = GroceryItem.objects.get(
                id=pk,
                grocery_list__user=request.user,
            )
        except GroceryItem.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        is_checked = request.data.get("is_checked")
        if is_checked is None:
            item.is_checked = not item.is_checked
        else:
            item.is_checked = bool(is_checked)

        item.save(update_fields=["is_checked"])
        return Response(
            {
                "id": item.id,
                "ingredient_name": item.ingredient_name,
                "is_checked": item.is_checked,
            }
        )


class RefreshGroceryListView(APIView):
    """POST /api/grocery/refresh/ — Rebuild grocery list from latest meal plan."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        grocery = generate_grocery_list(request.user)
        if not grocery:
            return Response(
                {"error": "No meal plan found. Generate a meal plan first."},
                status=404,
            )
        return Response(GroceryListSerializer(grocery).data)
