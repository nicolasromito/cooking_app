import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { fetchRecipes } from "../api/recipes";

export default function RecipeListScreen({ navigation }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadRecipes = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchRecipes();
      setRecipes(data.results ?? data);
    } catch (err) {
      setError("No se pudieron cargar las recetas. Verificá tu conexión.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Se ejecuta cada vez que la pantalla vuelve a tener foco (ej: al volver
  // de "Nueva receta"), no solo la primera vez que se monta.
  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [loadRecipes])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecipes();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={recipes}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("RecipeDetail", { id: item.id })}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <Text>🍽️</Text>
              </View>
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>
                {item.category ?? "Sin categoría"} · {item.total_time_minutes} min
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Todavía no hay recetas cargadas.</Text>
        }
      />
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("AddRecipe")}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16 },
  card: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    overflow: "hidden",
  },
  image: { width: 80, height: 80 },
  imagePlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: "#eee" },
  cardInfo: { flex: 1, padding: 10, justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "600" },
  subtitle: { fontSize: 13, color: "#666", marginTop: 4 },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
  error: { color: "crimson", textAlign: "center", marginTop: 8 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ff6b35",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 28, lineHeight: 30 },
});