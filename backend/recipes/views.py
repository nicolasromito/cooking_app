import json
import os

from django.contrib.auth import get_user_model

# from anthropic import Anthropic
from rest_framework import generics, permissions, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Recipe
from .serializers import (
    CategorySerializer,
    RecipeDetailSerializer,
    RecipeListSerializer,
    RegisterSerializer,
)

User = get_user_model()

# Usuario "invitado" que se usa como autor de las recetas mientras la app
# no tiene login. Se crea solo, la primera vez que hace falta.
GUEST_USERNAME = "invitado_app"


def get_guest_user():
    user, _ = User.objects.get_or_create(
        username=GUEST_USERNAME,
        defaults={"email": "invitado@app.local"},
    )
    return user


class SuggestRecipeView(APIView):
    """
    Recibe una lista de ingredientes (ej: los que hay en la heladera) y
    devuelve, en texto simple, una receta sugerida generada con IA.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            from anthropic import Anthropic
        except ImportError:
            return Response(
                {"detail": "La función de sugerencias con IA todavía no está habilitada."},
                status=501,
            )

        ingredients = request.data.get("ingredients")

        if not ingredients or not isinstance(ingredients, list):
            return Response(
                {"detail": "Enviá una lista de ingredientes, ej: [\"tomate\", \"huevo\"]."},
                status=400,
            )

        ingredients_text = ", ".join(
            str(item).strip() for item in ingredients if str(item).strip()
        )
        if not ingredients_text:
            return Response({"detail": "La lista de ingredientes está vacía."}, status=400)

        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            return Response(
                {"detail": "El servidor no tiene configurada la clave de IA (ANTHROPIC_API_KEY)."},
                status=500,
            )

        prompt = (
            f"Tengo estos ingredientes disponibles: {ingredients_text}. "
            "Sugerime UNA receta simple y realista que pueda preparar con ellos "
            "(podés asumir que tengo condimentos básicos como sal, aceite, pimienta "
            "aunque no los haya nombrado, pero no asumas otros ingredientes principales). "
            "Respondé en español, en texto simple sin markdown ni asteriscos, con este formato:\n"
            "Título de la receta\n"
            "Una línea de descripción\n"
            "Ingredientes que se usan\n"
            "Pasos numerados, breves y claros para prepararla."
        )

        try:
            client = Anthropic(api_key=api_key)
            message = client.messages.create(
                model="claude-sonnet-5",
                max_tokens=700,
                messages=[{"role": "user", "content": prompt}],
            )
            suggestion = "".join(
                block.text for block in message.content if block.type == "text"
            )
        except Exception:
            return Response(
                {"detail": "No se pudo generar la sugerencia. Intentá de nuevo en un momento."},
                status=502,
            )

        return Response({"suggestion": suggestion, "ingredients": ingredients})


class LoginView(generics.GenericAPIView):
    """
    Autentica un usuario existente por username/password y devuelve su token.
    NOTA: la app móvil no usa esto por ahora (login deshabilitado), queda
    disponible para cuando se quiera reactivar.
    """

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
    """
    Crea un nuevo usuario y devuelve un token de autenticación.
    NOTA: la app móvil no usa esto por ahora (login deshabilitado), queda
    disponible para cuando se quiera reactivar.
    """

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "username": user.username}, status=201)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class RecipeViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de recetas. Sin login: todas las operaciones están
    abiertas y las recetas se guardan bajo un usuario "invitado" fijo.
    """

    queryset = Recipe.objects.all().select_related("author", "category").prefetch_related(
        "ingredients", "steps"
    )
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action == "list":
            return RecipeListSerializer
        return RecipeDetailSerializer

    def get_queryset(self):
        # Sin login, mostramos todas las recetas públicas directamente.
        return super().get_queryset().filter(is_public=True)

    @staticmethod
    def _parse_json_fields(data):
        """
        Cuando el request llega como multipart/form-data (necesario para
        poder subir una imagen), Django recibe todos los valores como listas.
        Hay que extraer el valor real y parsear los campos JSON anidados.
        """
        parsed = {}
        for key, value in data.items():
            if isinstance(value, list):
                parsed[key] = value[0] if value else ""
            else:
                parsed[key] = value

        for field in ("ingredients", "steps"):
            value = parsed.get(field)
            if value and isinstance(value, str):
                try:
                    parsed[field] = json.loads(value)
                except (TypeError, ValueError):
                    pass

        return parsed

    def create(self, request, *args, **kwargs):
        data = self._parse_json_fields(request.data)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        data = self._parse_json_fields(request.data)
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def perform_create(self, serializer):
        author = self.request.user if self.request.user.is_authenticated else get_guest_user()
        serializer.save(author=author)



# import json
# import os

# # from anthropic import Anthropic
# from rest_framework import generics, permissions, viewsets
# from rest_framework.authtoken.models import Token
# from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
# from rest_framework.response import Response
# from rest_framework.views import APIView

# from .models import Category, Recipe
# from .serializers import (
#     CategorySerializer,
#     RecipeDetailSerializer,
#     RecipeListSerializer,
#     RegisterSerializer,
# )


# class SuggestRecipeView(APIView):
#     """
#     Recibe una lista de ingredientes (ej: los que hay en la heladera) y
#     devuelve, en texto simple, una receta sugerida generada con IA.
#     """

#     permission_classes = [permissions.IsAuthenticated]

#     def post(self, request, *args, **kwargs):
#         ingredients = request.data.get("ingredients")

#         if not ingredients or not isinstance(ingredients, list):
#             return Response(
#                 {"detail": "Enviá una lista de ingredientes, ej: [\"tomate\", \"huevo\"]."},
#                 status=400,
#             )

#         ingredients_text = ", ".join(
#             str(item).strip() for item in ingredients if str(item).strip()
#         )
#         if not ingredients_text:
#             return Response({"detail": "La lista de ingredientes está vacía."}, status=400)

#         api_key = os.getenv("ANTHROPIC_API_KEY")
#         if not api_key:
#             return Response(
#                 {"detail": "El servidor no tiene configurada la clave de IA (ANTHROPIC_API_KEY)."},
#                 status=500,
#             )

#         prompt = (
#             f"Tengo estos ingredientes disponibles: {ingredients_text}. "
#             "Sugerime UNA receta simple y realista que pueda preparar con ellos "
#             "(podés asumir que tengo condimentos básicos como sal, aceite, pimienta "
#             "aunque no los haya nombrado, pero no asumas otros ingredientes principales). "
#             "Respondé en español, en texto simple sin markdown ni asteriscos, con este formato:\n"
#             "Título de la receta\n"
#             "Una línea de descripción\n"
#             "Ingredientes que se usan\n"
#             "Pasos numerados, breves y claros para prepararla."
#         )

#         try:
#             client = Anthropic(api_key=api_key)
#             message = client.messages.create(
#                 model="claude-sonnet-5",
#                 max_tokens=700,
#                 messages=[{"role": "user", "content": prompt}],
#             )
#             suggestion = "".join(
#                 block.text for block in message.content if block.type == "text"
#             )
#         except Exception:
#             return Response(
#                 {"detail": "No se pudo generar la sugerencia. Intentá de nuevo en un momento."},
#                 status=502,
#             )

#         return Response({"suggestion": suggestion, "ingredients": ingredients})


# class LoginView(generics.GenericAPIView):
#     """Autentica un usuario existente por username/password y devuelve su token."""

#     permission_classes = [permissions.AllowAny]

#     def post(self, request, *args, **kwargs):
#         from django.contrib.auth import authenticate

#         username = request.data.get("username")
#         password = request.data.get("password")
#         user = authenticate(username=username, password=password)
#         if user is None:
#             return Response({"detail": "Usuario o contraseña incorrectos."}, status=400)
#         token, _ = Token.objects.get_or_create(user=user)
#         return Response({"token": token.key, "username": user.username})


# class RegisterView(generics.CreateAPIView):
#     """Crea un nuevo usuario y devuelve un token de autenticación."""

#     serializer_class = RegisterSerializer
#     permission_classes = [permissions.AllowAny]

#     def create(self, request, *args, **kwargs):
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         user = serializer.save()
#         token, _ = Token.objects.get_or_create(user=user)
#         return Response({"token": token.key, "username": user.username}, status=201)


# class IsAuthorOrReadOnly(permissions.BasePermission):
#     """Solo el autor de la receta puede editarla o borrarla."""

#     def has_object_permission(self, request, view, obj):
#         if request.method in permissions.SAFE_METHODS:
#             return True
#         return obj.author == request.user


# class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
#     queryset = Category.objects.all()
#     serializer_class = CategorySerializer
#     permission_classes = [permissions.IsAuthenticatedOrReadOnly]


# class RecipeViewSet(viewsets.ModelViewSet):
#     """
#     CRUD completo de recetas.
#     - Listar/ver: cualquiera (recetas públicas)
#     - Crear: usuario autenticado
#     - Editar/borrar: solo el autor
#     """

#     queryset = Recipe.objects.all().select_related("author", "category").prefetch_related(
#         "ingredients", "steps"
#     )
#     permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
#     parser_classes = [MultiPartParser, FormParser, JSONParser]

#     def get_serializer_class(self):
#         if self.action == "list":
#             return RecipeListSerializer
#         return RecipeDetailSerializer

#     def get_queryset(self):
#         queryset = super().get_queryset()
#         # Por defecto solo se muestran recetas públicas, salvo que el usuario
#         # pida explícitamente ver las suyas propias.
#         mine = self.request.query_params.get("mine")
#         if mine and self.request.user.is_authenticated:
#             return queryset.filter(author=self.request.user)
#         return queryset.filter(is_public=True)

#     @staticmethod
#     def _parse_json_fields(data):
#         """
#         Cuando el request llega como multipart/form-data (necesario para
#         poder subir una imagen), Django recibe todos los valores como listas.
#         Hay que extraer el valor real y parsear los campos JSON anidados.
#         """
#         # Convertir QueryDict a dict mutable, extrayendo primer elemento de listas
#         parsed = {}
#         for key, value in data.items():
#             # Si es una lista, tomar el primer elemento (excepto para ingredients y steps que lo haremos después)
#             if isinstance(value, list):
#                 parsed[key] = value[0] if value else ""
#             else:
#                 parsed[key] = value
        
#         # Ahora parsear ingredients y steps si están como strings JSON
#         for field in ("ingredients", "steps"):
#             value = parsed.get(field)
#             if value and isinstance(value, str):
#                 try:
#                     parsed[field] = json.loads(value)
#                 except (TypeError, ValueError):
#                     pass
        
#         return parsed

#     def create(self, request, *args, **kwargs):
#         data = self._parse_json_fields(request.data)
#         print(f"DEBUG: Datos después de parsear: {data}")  # ← NUEVO
#         print(f"DEBUG: Ingredientes: {data.get('ingredients')}")  # ← NUEVO
#         print(f"DEBUG: Pasos: {data.get('steps')}")  # ← NUEVO
#         serializer = self.get_serializer(data=data)
#         serializer.is_valid(raise_exception=True)
#         self.perform_create(serializer)
#         headers = self.get_success_headers(serializer.data)
#         return Response(serializer.data, status=201, headers=headers)

#     def update(self, request, *args, **kwargs):
#         partial = kwargs.pop("partial", False)
#         instance = self.get_object()
#         data = self._parse_json_fields(request.data)
#         serializer = self.get_serializer(instance, data=data, partial=partial)
#         serializer.is_valid(raise_exception=True)
#         self.perform_update(serializer)
#         return Response(serializer.data)

#     def perform_create(self, serializer):
#         serializer.save(author=self.request.user)