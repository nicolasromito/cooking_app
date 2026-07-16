# Backend - Cooking App (Django + DRF)

## Requisitos

- Python 3.11+
- pip

## Instalación

```bash
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

`0.0.0.0:8000` hace que el servidor sea accesible desde otros dispositivos
en tu red local (necesario para probar con el celular).

## Endpoints principales

| Método | URL                        | Descripción                          | Auth |
|--------|-----------------------------|---------------------------------------|------|
| GET    | /api/recipes/               | Listar recetas públicas               | No   |
| GET    | /api/recipes/?mine=1        | Listar mis recetas                    | Sí   |
| GET    | /api/recipes/{id}/          | Detalle de una receta                 | No   |
| POST   | /api/recipes/                | Crear receta                         | Sí   |
| PUT    | /api/recipes/{id}/          | Editar receta (solo autor)            | Sí   |
| DELETE | /api/recipes/{id}/          | Borrar receta (solo autor)            | Sí   |
| GET    | /api/categories/             | Listar categorías                    | No   |
| POST   | /api/auth/login/             | Login (sesión, útil para pruebas)    | No   |

Para autenticación por token desde la app móvil, se recomienda agregar un
endpoint de `obtain_auth_token` (ya incluido en DRF) en `cookingapp/urls.py`
si querés habilitar login/registro desde React Native.

## Panel de administración

Accedé a `http://localhost:8000/admin/` con el superusuario creado para
cargar categorías y gestionar recetas manualmente.

## Correr las pruebas

```bash
python manage.py test
```

## Base de datos

Por defecto usa SQLite (archivo `db.sqlite3`, cero configuración). Para
producción, configurá PostgreSQL con las variables `DB_*` en `.env`.
