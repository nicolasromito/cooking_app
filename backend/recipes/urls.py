from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, LoginView, RecipeViewSet, RegisterView

router = DefaultRouter()
router.register("recipes", RecipeViewSet, basename="recipe")
router.register("categories", CategoryViewSet, basename="category")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("", include(router.urls)),
]
