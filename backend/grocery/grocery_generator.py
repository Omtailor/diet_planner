"""
grocery_generator.py
Builds/rebuilds a GroceryList by aggregating real ingredients
from all 9 MealSlots in the current week's meal plan.
Merges similar ingredients (e.g. Tomato + Tomato Puree → Tomato).
"""
from datetime import date, timedelta
from collections import defaultdict
from meals.models import WeeklyPlan, MealSlot
from .models import GroceryList, GroceryItem


# ── Normalization map ─────────────────────────────────────────────────────────
# Any ingredient name containing a KEY gets merged into that key's base name.
# Order matters: more specific entries first.
INGREDIENT_ALIASES = {
    # Tomato variants → Tomato
    'tomato puree':           'Tomato',
    'tomato paste':           'Tomato',
    'tomato sauce':           'Tomato',
    'tomato for salad':       'Tomato',
    'tomatoes':               'Tomato',
    'tomato':                 'Tomato',

    # Onion variants → Onion
    'onion for pakora':       'Onion',
    'onion for salad':        'Onion',
    'onion (chopped)':        'Onion',
    'onions':                 'Onion',
    'onion':                  'Onion',

    # Cucumber variants → Cucumber
    'cucumber for salad':     'Cucumber',
    'cucumber (sliced)':      'Cucumber',
    'cucumbers':              'Cucumber',
    'cucumber':               'Cucumber',

    # Curd / Yogurt variants → Curd (Yogurt)
    'yogurt for kadhi':       'Curd (Yogurt)',
    'yogurt (low fat)':       'Curd (Yogurt)',
    'low fat yogurt':         'Curd (Yogurt)',
    'curd (yogurt)':          'Curd (Yogurt)',
    'yogurt':                 'Curd (Yogurt)',
    'curd':                   'Curd (Yogurt)',

    # Lemon variants → Lemon
    'lemon juice':            'Lemon',
    'lime juice':             'Lemon',
    'lemon':                  'Lemon',

    # Mixed vegetables variants → Mixed Vegetables
    'mixed vegetables (carrot, beans, cabbage)': 'Mixed Vegetables',
    'mixed vegetables (drumstick, brinjal)':     'Mixed Vegetables',
    'mixed vegetables (peas, carrots)':          'Mixed Vegetables',
    'mixed vegetables (peas, carrots, beans)':   'Mixed Vegetables',
    'mixed vegetables':                          'Mixed Vegetables',

    # Kidney beans → Kidney Beans
    'kidney beans (boiled)':  'Kidney Beans',
    'kidney beans':           'Kidney Beans',

    # Bell pepper variants → Bell Peppers
    'bell peppers (mixed)':   'Bell Peppers',
    'bell pepper':            'Bell Peppers',
    'bell peppers':           'Bell Peppers',
    'capsicum':               'Bell Peppers',

    # Brown rice variants → Brown Rice
    'brown rice (cooked)':    'Brown Rice',
    'brown rice':             'Brown Rice',

    # Oil variants → keep separate (olive vs regular)
    'oil (for shallow frying pakora)': 'Oil (Any)',
    'oil (for tadka)':        'Oil (Any)',

    # Ginger variants → Ginger
    'ginger (grated)':        'Ginger',
    'ginger (minced)':        'Ginger',
    'ginger garlic paste':    'Ginger-Garlic Paste',
    'ginger-garlic paste':    'Ginger-Garlic Paste',
    'ginger':                 'Ginger',

    # Spinach variants → Spinach
    'spinach (chopped)':      'Spinach',
    'spinach leaves':         'Spinach',
    'spinach':                'Spinach',
}


def normalize_ingredient(raw_name: str) -> str:
    """Map raw ingredient name to its canonical base name."""
    lower = raw_name.strip().lower()
    # Check exact matches first, then substring matches
    if lower in INGREDIENT_ALIASES:
        return INGREDIENT_ALIASES[lower]
    for key, base in INGREDIENT_ALIASES.items():
        if key in lower:
            return base
    # No match — title-case the original
    return raw_name.strip().title()


def normalize_unit(unit: str, base_name: str) -> str:
    """Standardize units."""
    unit = (unit or 'g').strip().lower()
    return unit


def generate_grocery_list(user, week_start=None):
    if week_start is None:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())

    try:
        plan = WeeklyPlan.objects.get(user=user, week_start_date=week_start)
    except WeeklyPlan.DoesNotExist:
        return None

    grocery_list, _ = GroceryList.objects.get_or_create(
        user=user,
        weekly_plan=plan,
    )

    # Clear existing items and rebuild fresh
    grocery_list.items.all().delete()
    grocery_list.needs_refresh = False
    grocery_list.save(update_fields=['needs_refresh', 'updated_at'])

    # key: (normalized_name, unit) → total quantity
    aggregated = defaultdict(float)

    meal_slots = MealSlot.objects.filter(
        day_meal__weekly_plan=plan,
        food_item__isnull=False,
    ).select_related('food_item')

    for slot in meal_slots:
        ingredients = slot.food_item.ingredients
        if not ingredients:
            aggregated[(slot.food_item.name, 'g')] += (slot.quantity_g or 0)
            continue

        serving_size = slot.food_item.serving_size_g
        quantity_g   = slot.quantity_g or 0
        scale = (quantity_g / serving_size) if (serving_size is not None and serving_size > 0) else 1.0

        for item in ingredients:
            if not isinstance(item, dict):
                continue
            raw_name = item.get('name', '').strip().lower()
            if not raw_name:
                continue
            raw_qty = item.get('quantity')
            if raw_qty is None:
                continue
            try:
                qty = float(raw_qty) * scale
            except (TypeError, ValueError):
                continue
            if qty <= 0:
                continue

            # Normalize name + unit
            canon_name = normalize_ingredient(raw_name)
            unit       = normalize_unit(item.get('unit', 'g'), canon_name)
            aggregated[(canon_name, unit)] += qty

    # Create GroceryItem for each unique ingredient
    for (ingredient_name, unit), total_qty in sorted(aggregated.items()):
        # Convert to sensible display quantity
        if unit == 'g' and total_qty >= 1000:
            display_qty  = round(total_qty / 1000, 2)
            display_unit = 'kg'
        elif unit == 'ml' and total_qty >= 1000:
            display_qty  = round(total_qty / 1000, 2)
            display_unit = 'l'
        else:
            display_qty  = round(total_qty, 1)
            display_unit = unit

        GroceryItem.objects.create(
            grocery_list=grocery_list,
            ingredient_name=ingredient_name,
            quantity=display_qty,
            unit=display_unit,
            is_checked=False,
        )

    grocery_list.refresh_from_db()
    return grocery_list