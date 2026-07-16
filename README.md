# Cooking App

App móvil de recetas de cocina. Permite cargar recetas propias (título,
descripción, ingredientes, pasos e imagen) y guardarlas en una base de datos.

## Estructura del proyecto

```
cooking_app/
├── backend/    → API REST con Django + Django REST Framework
└── mobile/     → App móvil con React Native + Expo
```

## Backend (Django)

Ver `backend/README.md` para instrucciones detalladas. Resumen rápido:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # en Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

La API queda disponible en `http://localhost:8000/api/`.

## Mobile (React Native con Expo)

Ver `mobile/README.md` para instrucciones detalladas. Resumen rápido:

```bash
cd mobile
npm install
npx expo start
```

**Importante:** antes de correr la app, editá `mobile/src/api/client.js` y
poné la IP local de tu máquina donde corre el backend (no "localhost"),
para que el celular/emulador pueda conectarse.

## Modelo de datos

- **Category**: categorías de recetas (Postres, Entradas, etc.)
- **Recipe**: receta con título, descripción, autor, categoría, imagen,
  porciones, tiempos y dificultad
- **Ingredient**: ingredientes de una receta (nombre, cantidad, unidad)
- **Step**: pasos de preparación, ordenados

## Próximos pasos sugeridos

- Registro/login de usuarios en la app (la API ya soporta autenticación
  por token vía `rest_framework.authtoken`)
- Búsqueda y filtros por categoría
- Favoritos
- Subida de múltiples imágenes por receta
