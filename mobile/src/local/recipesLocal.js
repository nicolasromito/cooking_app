import * as FileSystem from "expo-file-system";
import { getDb } from "../db/database";

const IMAGES_DIR = `${FileSystem.documentDirectory}recipe_images/`;

/**
 * Copia la imagen elegida (que vive en una carpeta temporal del picker) a
 * la carpeta permanente de documentos de la app, para que no se pierda.
 */
async function persistImage(uri) {
  if (!uri) return null;
  await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true }).catch(() => {});
  const filename = uri.split("/").pop();
  const dest = `${IMAGES_DIR}${Date.now()}_${filename}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

/** Lista todas las recetas guardadas localmente. */
export const fetchRecipes = async () => {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT id, title, image_uri, difficulty, servings,
            (prep_time_minutes + cook_time_minutes) AS total_time_minutes
     FROM recipes
     ORDER BY created_at DESC`
  );
  return {
    results: rows.map((r) => ({
      id: r.id,
      title: r.title,
      image: r.image_uri,
      category: null,
      difficulty: r.difficulty,
      servings: r.servings,
      total_time_minutes: r.total_time_minutes,
    })),
  };
};

/** Trae el detalle completo de una receta (ingredientes y pasos incluidos). */
export const fetchRecipeDetail = async (id) => {
  const db = await getDb();
  const recipe = await db.getFirstAsync(`SELECT * FROM recipes WHERE id = ?`, [id]);
  const ingredients = await db.getAllAsync(
    `SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY order_index`,
    [id]
  );
  const steps = await db.getAllAsync(
    `SELECT * FROM steps WHERE recipe_id = ? ORDER BY order_index`,
    [id]
  );

  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    author: "Vos",
    image: recipe.image_uri,
    servings: recipe.servings,
    prep_time_minutes: recipe.prep_time_minutes,
    cook_time_minutes: recipe.cook_time_minutes,
    difficulty: recipe.difficulty,
    ingredients: ingredients.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      order: i.order_index,
    })),
    steps: steps.map((s) => ({
      id: s.id,
      order: s.order_index,
      description: s.description,
    })),
  };
};

/** Crea una receta nueva junto con sus ingredientes y pasos. */
export const createRecipe = async (recipe) => {
  const db = await getDb();
  const imageUri = await persistImage(recipe.imageUri);

  const result = await db.runAsync(
    `INSERT INTO recipes
      (title, description, servings, prep_time_minutes, cook_time_minutes, difficulty, image_uri)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      recipe.title,
      recipe.description ?? "",
      recipe.servings ?? 1,
      recipe.prepTimeMinutes ?? 0,
      recipe.cookTimeMinutes ?? 0,
      recipe.difficulty ?? "easy",
      imageUri,
    ]
  );
  const recipeId = result.lastInsertRowId;

  for (const ing of recipe.ingredients ?? []) {
    await db.runAsync(
      `INSERT INTO ingredients (recipe_id, name, quantity, unit, order_index)
       VALUES (?, ?, ?, ?, ?)`,
      [recipeId, ing.name, ing.quantity ?? "", ing.unit ?? "", ing.order ?? 0]
    );
  }

  for (const step of recipe.steps ?? []) {
    await db.runAsync(
      `INSERT INTO steps (recipe_id, order_index, description) VALUES (?, ?, ?)`,
      [recipeId, step.order ?? 0, step.description]
    );
  }

  return { id: recipeId };
};

/** Borra una receta por su ID (ingredientes y pasos se borran en cascada). */
export const deleteRecipe = async (id) => {
  const db = await getDb();

  // Borramos también el archivo de imagen local, si tenía una.
  const recipe = await db.getFirstAsync(
    `SELECT image_uri FROM recipes WHERE id = ?`,
    [id]
  );
  if (recipe?.image_uri) {
    await FileSystem.deleteAsync(recipe.image_uri, { idempotent: true }).catch(() => {});
  }

  await db.runAsync(`DELETE FROM recipes WHERE id = ?`, [id]);
  return { id };
};