import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
// import { fetchRecipeDetail, deleteRecipe } from "../api/recipes";
//cambio para correr de forma local
import { fetchRecipeDetail, deleteRecipe } from "../local/recipesLocal";

export default function RecipeDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchRecipeDetail(id).then((data) => {
      if (mounted) {
        setRecipe(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  // Configurar el header con botón de eliminar
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={handleDeletePress}
          style={styles.headerButton}
          disabled={deleting}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </Pressable>
      ),
    });
  }, [deleting, id, navigation]);

  const handleDeletePress = () => {
    Alert.alert(
      "Eliminar receta",
      "¿Estás seguro de que querés borrar esta receta? No se puede deshacer.",
      [
        { text: "Cancelar", onPress: () => {}, style: "cancel" },
        {
          text: "Eliminar",
          onPress: handleDelete,
          style: "destructive",
        },
      ]
    );
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRecipe(id);
      Alert.alert("Listo", "La receta fue eliminada correctamente.");
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo eliminar la receta. Intentá de nuevo."
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !recipe) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {recipe.image && (
        <Image source={{ uri: recipe.image }} style={styles.image} />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.meta}>
          Por {recipe.author} · {recipe.servings} porciones
        </Text>
        <Text style={styles.timings}>
          ⏱️ Prep: {recipe.prep_time_minutes} min · Cocción: {recipe.cook_time_minutes} min
        </Text>
        {!!recipe.description && (
          <Text style={styles.description}>{recipe.description}</Text>
        )}

        <Text style={styles.sectionTitle}>Ingredientes</Text>
        {recipe.ingredients.map((ing) => (
          <Text key={ing.id} style={styles.listItem}>
            • {ing.quantity} {ing.unit} {ing.name}
          </Text>
        ))}

        <Text style={styles.sectionTitle}>Preparación</Text>
        {recipe.steps.map((step) => (
          <Text key={step.id} style={styles.listItem}>
            {step.order}. {step.description}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: 220 },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  meta: { color: "#666", marginTop: 4, marginBottom: 4 },
  timings: { color: "#666", marginBottom: 12, fontSize: 14 },
  description: { fontSize: 15, color: "#333", marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "600", marginTop: 12, marginBottom: 6 },
  listItem: { fontSize: 15, color: "#333", marginBottom: 4 },
  headerButton: { paddingRight: 16 },
  deleteIcon: { fontSize: 20 },
});
