from rest_framework import generics, permissions, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .models import Category, Recipe
from .serializers import (
    CategorySerializer,
    RecipeDetailSerializer,
    RecipeListSerializer,
    RegisterSerializer,
)


class LoginView(generics.GenericAPIView):
    """Autentica un usuario existente por username/password y devuelve su token."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        from django.contrib.auth import authenticate

        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)
        if user is None:
            return Response({"detail": "Usuario o contraseña incorrectos."}, status=400)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "username": user.username})


class RegisterView(generics.CreateAPIView):
    """Crea un nuevo usuario y devuelve un token de autenticación."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "username": user.username}, status=201)


class IsAuthorOrReadOnly(permissions.BasePermission):
    """Solo el autor de la receta puede editarla o borrarla."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class RecipeViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de recetas.
    - Listar/ver: cualquiera (recetas públicas)
    - Crear: usuario autenticado
    - Editar/borrar: solo el autor
    """

    queryset = Recipe.objects.all().select_related("author", "category").prefetch_related(
        "ingredients", "steps"
    )
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action == "list":
            return RecipeListSerializer
        return RecipeDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # Por defecto solo se muestran recetas públicas, salvo que el usuario
        # pida explícitamente ver las suyas propias.
        mine = self.request.query_params.get("mine")
        if mine and self.request.user.is_authenticated:
            return queryset.filter(author=self.request.user)
        return queryset.filter(is_public=True)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    def create(self, request, *args, **kwargs):
        print("===== DATA RECIBIDA =====")
        print(request.data)
        print("=========================")

        return super().create(request, *args, **kwargs)