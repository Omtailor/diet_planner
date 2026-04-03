from datetime import date, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser

from .models import GroceryList, GroceryItem
from .serializers import GroceryListSerializer
from .grocery_generator import generate_grocery_list


class GroceryListView(APIView):
    """GET /api/grocery/ — Get this week's grocery list."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        week_start = today - timedelta(days=today.weekday())

        try:
            grocery = GroceryList.objects.get(
                user=request.user,
                weekly_plan__week_start_date=week_start,
            )
        except GroceryList.DoesNotExist:
            return Response(
                {'error': 'No grocery list found. Generate a meal plan first.'},
                status=404,
            )

        return Response(GroceryListSerializer(grocery).data)


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
            return Response({'error': 'Item not found.'}, status=404)

        is_checked = request.data.get('is_checked')
        if is_checked is None:
            item.is_checked = not item.is_checked  # toggle
        else:
            item.is_checked = bool(is_checked)

        item.save(update_fields=['is_checked'])
        return Response({
            'id': item.id,
            'ingredient_name': item.ingredient_name,
            'is_checked': item.is_checked,
        })


class RefreshGroceryListView(APIView):
    """POST /api/grocery/refresh/ — Rebuild grocery list from current meal plan."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        grocery = generate_grocery_list(request.user)
        if not grocery:
            return Response(
                {'error': 'No meal plan found. Generate a meal plan first.'},
                status=404,
            )
        return Response(GroceryListSerializer(grocery).data)