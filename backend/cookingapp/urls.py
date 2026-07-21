from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("rest_framework.urls")),
    path("api/", include("recipes.urls")),
    # Servir las imágenes de recetas subidas (media/). En un proyecto más
    # grande esto iría en un servicio de almacenamiento aparte (S3, etc.),
    # pero para este proyecto personal alcanza con servirlas directo acá,
    # incluso en producción.
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]