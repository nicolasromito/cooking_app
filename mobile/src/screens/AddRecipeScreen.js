import React, { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { createRecipe } from "../api/recipes";

export default function AddRecipeScreen({ navigation }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState("4");
  const [imageUri, setImageUri] = useState(null);
  const [ingredients, setIngredients] = useState([
    { name: "", quantity: "", unit: "" },
  ]);
  const [steps, setSteps] = useState([{ description: "" }]);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso necesario", "Habilitá el acceso a tus fotos para agregar una imagen.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const updateIngredient = (index, field, value) => {
    const next = [...ingredients];
    next[index] = { ...next[index], [field]: value };
    setIngredients(next);
  };

  const updateStep = (index, value) => {
    const next = [...steps];
    next[index] = { description: value };
    setSteps(next);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Falta el título", "Ponele un nombre a tu receta.");
      return;
    }
    setSaving(true);
    try {
      await createRecipe({
        title,
        description,
        servings: Number(servings) || 1,
        imageUri,
        ingredients: ingredients
          .filter((i) => i.name.trim())
          .map((i, idx) => ({ ...i, order: idx + 1 })),
        steps: steps
          .filter((s) => s.description.trim())
          .map((s, idx) => ({ order: idx + 1, description: s.description })),
      });
      Alert.alert("¡Listo!", "Tu receta se guardó correctamente.");
      navigation.goBack();
    } catch (err) {
      console.log("Status:", err.response?.status);
      console.log("Data:", err.response?.data);

      // Alert.alert(
      //   "Error",
      //   JSON.stringify(err.response?.data ?? err.message)
      Alert.alert("Error", "No se pudo guardar la receta. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Ej: Milanesas napolitanas"
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="Una breve descripción de tu receta"
      />

      <Text style={styles.label}>Porciones</Text>
      <TextInput
        style={styles.input}
        value={servings}
        onChangeText={setServings}
        keyboardType="numeric"
      />

      <Pressable style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <Text style={styles.imagePickerText}>Agregar foto</Text>
        )}
      </Pressable>

      <Text style={styles.sectionTitle}>Ingredientes</Text>
      {ingredients.map((ing, index) => (
        <View key={index} style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex2]}
            placeholder="Ingrediente"
            value={ing.name}
            onChangeText={(v) => updateIngredient(index, "name", v)}
          />
          <TextInput
            style={[styles.input, styles.flex1]}
            placeholder="Cant."
            value={ing.quantity}
            onChangeText={(v) => updateIngredient(index, "quantity", v)}
          />
          <TextInput
            style={[styles.input, styles.flex1]}
            placeholder="Unidad"
            value={ing.unit}
            onChangeText={(v) => updateIngredient(index, "unit", v)}
          />
        </View>
      ))}
      <Pressable
        style={styles.addButton}
        onPress={() => setIngredients([...ingredients, { name: "", quantity: "", unit: "" }])}
      >
        <Text style={styles.addButtonText}>+ Agregar ingrediente</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Preparación</Text>
      {steps.map((step, index) => (
        <TextInput
          key={index}
          style={[styles.input, styles.multiline]}
          placeholder={`Paso ${index + 1}`}
          value={step.description}
          onChangeText={(v) => updateStep(index, v)}
          multiline
        />
      ))}
      <Pressable
        style={styles.addButton}
        onPress={() => setSteps([...steps, { description: "" }])}
      >
        <Text style={styles.addButtonText}>+ Agregar paso</Text>
      </Pressable>

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Guardando..." : "Guardar receta"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
  multiline: { minHeight: 60, textAlignVertical: "top", marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginTop: 20, marginBottom: 8 },
  row: { flexDirection: "row", gap: 8, marginBottom: 8 },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  imagePicker: {
    marginTop: 12,
    height: 150,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imagePickerText: { color: "#999" },
  previewImage: { width: "100%", height: "100%" },
  addButton: { paddingVertical: 8 },
  addButtonText: { color: "#ff6b35", fontWeight: "600" },
  saveButton: {
    marginTop: 24,
    backgroundColor: "#ff6b35",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
