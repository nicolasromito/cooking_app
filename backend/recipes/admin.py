from django.contrib import admin

from .models import Category, Ingredient, Recipe, Step


class IngredientInline(admin.TabularInline):
    model = Ingredient
    extra = 1


class StepInline(admin.TabularInline):
    model = Step
    extra = 1


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ["title", "author", "category", "difficulty", "is_public", "created_at"]
    list_filter = ["category", "difficulty", "is_public"]
    search_fields = ["title", "description", "author__username"]
    inlines = [IngredientInline, StepInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name"]
    search_fields = ["name"]
