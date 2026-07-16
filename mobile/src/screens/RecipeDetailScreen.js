import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchRecipeDetail } from "../api/recipes";

export default function RecipeDetailScreen({ route }) {
  const { id } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

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
          Por {recipe.author} · {recipe.servings} porciones ·{" "}
          {recipe.prep_time_minutes + recipe.cook_time_minutes} min
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
  meta: { color: "#666", marginTop: 4, marginBottom: 12 },
  description: { fontSize: 15, color: "#333", marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "600", marginTop: 12, marginBottom: 6 },
  listItem: { fontSize: 15, color: "#333", marginBottom: 4 },
});
