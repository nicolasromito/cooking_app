from django.conf import settings
from django.db import models


class Category(models.Model):
    """Categoría de receta (ej: Postres, Entradas, Vegano)."""

    name = models.CharField("nombre", max_length=80, unique=True)

    class Meta:
        verbose_name = "categoría"
        verbose_name_plural = "categorías"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Recipe(models.Model):
    """Receta de cocina creada por un usuario."""

    class Difficulty(models.TextChoices):
        EASY = "easy", "Fácil"
        MEDIUM = "medium", "Media"
        HARD = "hard", "Difícil"

    title = models.CharField("título", max_length=150)
    description = models.TextField("descripción", blank=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recipes",
        verbose_name="autor",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recipes",
        verbose_name="categoría",
    )
    image = models.ImageField(
        "imagen", upload_to="recipes/%Y/%m/", blank=True, null=True
    )
    servings = models.PositiveSmallIntegerField("porciones", default=1)
    prep_time_minutes = models.PositiveSmallIntegerField(
        "tiempo de preparación (min)", default=0
    )
    cook_time_minutes = models.PositiveSmallIntegerField(
        "tiempo de cocción (min)", default=0
    )
    difficulty = models.CharField(
        "dificultad", max_length=10, choices=Difficulty.choices, default=Difficulty.EASY
    )
    is_public = models.BooleanField("es pública", default=True)
    created_at = models.DateTimeField("creada", auto_now_add=True)
    updated_at = models.DateTimeField("actualizada", auto_now=True)

    class Meta:
        verbose_name = "receta"
        verbose_name_plural = "recetas"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    @property
    def total_time_minutes(self):
        return self.prep_time_minutes + self.cook_time_minutes


class Ingredient(models.Model):
    """Ingrediente asociado a una receta."""

    recipe = models.ForeignKey(
        Recipe, on_delete=models.CASCADE, related_name="ingredients", verbose_name="receta"
    )
    name = models.CharField("nombre", max_length=100)
    quantity = models.CharField(
        "cantidad", max_length=50, blank=True, help_text="Ej: 2, 1/2, al gusto"
    )
    unit = models.CharField(
        "unidad", max_length=30, blank=True, help_text="Ej: tazas, gramos, cucharadas"
    )
    order = models.PositiveSmallIntegerField("orden", default=0)

    class Meta:
        verbose_name = "ingrediente"
        verbose_name_plural = "ingredientes"
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.name} ({self.recipe.title})"


class Step(models.Model):
    """Paso de preparación de una receta."""

    recipe = models.ForeignKey(
        Recipe, on_delete=models.CASCADE, related_name="steps", verbose_name="receta"
    )
    order = models.PositiveSmallIntegerField("orden")
    description = models.TextField("descripción")

    class Meta:
        verbose_name = "paso"
        verbose_name_plural = "pasos"
        ordering = ["order"]

    def __str__(self):
        return f"Paso {self.order} - {self.recipe.title}"
