import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    """
    Crea un superusuario a partir de las variables de entorno
    DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL y
    DJANGO_SUPERUSER_PASSWORD.

    Pensado para correr en el build de Render (que no tiene acceso a
    Shell en el plan gratuito). Es seguro correrlo en cada deploy: si el
    usuario ya existe, no falla, solo confirma que sigue estando.
    """

    help = "Crea un superusuario desde variables de entorno (idempotente)."

    def handle(self, *args, **options):
        username = os.getenv("DJANGO_SUPERUSER_USERNAME")
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD")

        if not username or not password:
            self.stdout.write(
                self.style.WARNING(
                    "DJANGO_SUPERUSER_USERNAME o DJANGO_SUPERUSER_PASSWORD "
                    "no están configuradas: se omite la creación del superusuario."
                )
            )
            return

        user, created = User.objects.get_or_create(
            username=username, defaults={"email": email}
        )
        user.email = email
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"Superusuario '{username}' creado."))
        else:
            self.stdout.write(
                self.style.SUCCESS(f"Superusuario '{username}' ya existía, contraseña actualizada.")
            )