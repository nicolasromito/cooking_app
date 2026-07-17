import client from "./client";

/** Obtiene la lista de recetas públicas (paginada). */
export const fetchRecipes = async (page = 1) => {
  const response = await client.get("/recipes/", { params: { page } });
  return response.data;
};

/** Obtiene el detalle completo de una receta (ingredientes y pasos). */
export const fetchRecipeDetail = async (id) => {
  const response = await client.get(`/recipes/${id}/`);
  return response.data;
};

/**
 * Crea una nueva receta.
 * `recipe` debe incluir: title, description, servings, category,
 * ingredients: [{ name, quantity, unit, order }],
 * steps: [{ order, description }],
 * y opcionalmente una imagen local (uri) para subir como multipart.
 */
export const createRecipe = async (recipe) => {
  const formData = new FormData();
  formData.append("title", recipe.title);
  formData.append("description", recipe.description ?? "");
  formData.append("servings", String(recipe.servings ?? 1));
  formData.append("prep_time_minutes", String(recipe.prepTimeMinutes ?? 0));
  formData.append("cook_time_minutes", String(recipe.cookTimeMinutes ?? 0));
  formData.append("difficulty", recipe.difficulty ?? "easy");
  // Importante: con multipart/form-data, DRF interpreta un booleano ausente
  // como False (igual que un checkbox HTML sin marcar), así que hay que
  // mandarlo siempre explícito.
  formData.append("is_public", recipe.isPublic === false ? "false" : "true");
  formData.append("ingredients", JSON.stringify(recipe.ingredients ?? []));
  formData.append("steps", JSON.stringify(recipe.steps ?? []));

  if (recipe.category) {
    formData.append("category", recipe.category);
  }

  if (recipe.imageUri) {
    const filename = recipe.imageUri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename ?? "");
    const type = match ? `image/${match[1]}` : "image";
    formData.append("image", { uri: recipe.imageUri, name: filename, type });
  }

  const response = await client.post("/recipes/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const fetchCategories = async () => {
  const response = await client.get("/categories/");
  return response.data;
};