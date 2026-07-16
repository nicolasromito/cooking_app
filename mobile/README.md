# Mobile - Cooking App (React Native + Expo)

## Requisitos

- Node.js 18+
- Expo CLI (se instala automáticamente con `npx`)
- App "Expo Go" en tu celular, o un emulador Android/iOS

## Instalación

```bash
npm install
npx expo start
```

Escaneá el código QR con la app Expo Go (Android) o la cámara (iOS), o
presioná `a`/`i` en la terminal para abrir en un emulador.

## Configurar la conexión con el backend

Editá `src/api/client.js` y reemplazá la IP de ejemplo por la IP local de
tu computadora (donde corre `python manage.py runserver`):

```js
export const BASE_URL = "http://TU_IP_LOCAL:8000/api";
```

Para encontrar tu IP local:
- Mac/Linux: `ifconfig | grep inet`
- Windows: `ipconfig`

No uses `localhost` ni `127.0.0.1`: el celular o emulador no apuntarían a
tu computadora.

## Estructura

```
mobile/
├── App.js                        → punto de entrada
└── src/
    ├── api/
    │   ├── client.js              → cliente axios + token de auth
    │   └── recipes.js             → funciones para consumir la API
    ├── navigation/
    │   └── AppNavigator.js         → stack de navegación
    └── screens/
        ├── RecipeListScreen.js     → listado de recetas
        ├── RecipeDetailScreen.js   → detalle con ingredientes y pasos
        └── AddRecipeScreen.js      → formulario para cargar una receta
```

## Pantallas incluidas

1. **Mis Recetas**: listado con imagen, categoría y tiempo total
2. **Detalle de receta**: ingredientes y pasos de preparación
3. **Nueva receta**: formulario con imagen, ingredientes dinámicos y pasos
