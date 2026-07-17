import json
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Category, Ingredient, Recipe, Step

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Serializador para el registro de nuevos usuarios."""

    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password2"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Las contraseñas no coinciden."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        return user


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ["id", "name", "quantity", "unit", "order"]


class StepSerializer(serializers.ModelSerializer):
    class Meta:
        model = Step
        fields = ["id", "order", "description"]


class RecipeListSerializer(serializers.ModelSerializer):
    """Serializador liviano para listados de recetas."""

    author = serializers.ReadOnlyField(source="author.username")
    category = serializers.StringRelatedField()

    class Meta:
        model = Recipe
        fields = [
            "id",
            "title",
            "image",
            "author",
            "category",
            "difficulty",
            "servings",
            "total_time_minutes",
            "created_at",
        ]


class RecipeDetailSerializer(serializers.ModelSerializer):
    """Serializador completo, incluye ingredientes y pasos anidados."""

    author = serializers.ReadOnlyField(source="author.username")
    ingredients = IngredientSerializer(many=True, required=False)
    steps = StepSerializer(many=True, required=False)

    class Meta:
        model = Recipe
        fields = [
            "id",
            "title",
            "description",
            "author",
            "category",
            "image",
            "servings",
            "prep_time_minutes",
            "cook_time_minutes",
            "difficulty",
            "is_public",
            "ingredients",
            "steps",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["author"]

    def to_internal_value(self, data):
        data = data.copy()

        if "ingredients" in data and isinstance(data["ingredients"], str):
            data["ingredients"] = json.loads(data["ingredients"])
        
        # Si no se envían ingredientes, asegurar que sea una lista vacía
        if "ingredients" not in data:
            data["ingredients"] = []

        if "steps" in data and isinstance(data["steps"], str):
            data["steps"] = json.loads(data["steps"])
        
        # Si no se envían pasos, asegurar que sea una lista vacía
        if "steps" not in data:
            data["steps"] = []

        return super().to_internal_value(data)

    def create(self, validated_data):
        ingredients_data = validated_data.pop("ingredients", [])
        steps_data = validated_data.pop("steps", [])

        recipe = Recipe.objects.create(**validated_data)

        for ingredient_data in ingredients_data:
            Ingredient.objects.create(
                recipe=recipe,
                **ingredient_data
            )

        for step_data in steps_data:
            Step.objects.create(
                recipe=recipe,
                **step_data
            )

        return recipe

    def update(self, instance, validated_data):
        # Extraer ingredientes y pasos. Si no están presentes, usar listas vacías
        # para garantizar que se actualicen (por si el usuario intenta vaciarlos)
        ingredients_data = validated_data.pop("ingredients", [])
        steps_data = validated_data.pop("steps", [])

        # Actualizar los campos básicos de la receta
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Actualizar ingredientes: eliminar los viejos y crear los nuevos
        instance.ingredients.all().delete()
        for ingredient_data in ingredients_data:
            Ingredient.objects.create(
                recipe=instance,
                **ingredient_data
            )

        # Actualizar pasos: eliminar los viejos y crear los nuevos
        instance.steps.all().delete()
        for step_data in steps_data:
            Step.objects.create(
                recipe=instance,
                **step_data
            )

        return instance