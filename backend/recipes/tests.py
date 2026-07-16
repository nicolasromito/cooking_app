from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Recipe

User = get_user_model()


class RecipeAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ana", password="claveSegura123")
        self.category = Category.objects.create(name="Postres")

    def test_listar_recetas_sin_autenticar(self):
        Recipe.objects.create(
            title="Flan casero", author=self.user, category=self.category
        )
        url = reverse("recipe-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_crear_receta_requiere_autenticacion(self):
        url = reverse("recipe-list")
        payload = {
            "title": "Tarta de manzana",
            "description": "Deliciosa",
            "servings": 4,
            "ingredients": [],
            "steps": [],
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_crear_receta_autenticado(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-list")
        payload = {
            "title": "Milanesas",
            "description": "Con puré",
            "servings": 2,
            "ingredients": [{"name": "Carne", "quantity": "500", "unit": "g", "order": 1}],
            "steps": [{"order": 1, "description": "Freír la carne empanada"}],
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Recipe.objects.count(), 1)
        self.assertEqual(Recipe.objects.first().author, self.user)
