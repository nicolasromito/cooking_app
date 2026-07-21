import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import RecipeListScreen from "../screens/RecipeListScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import AddRecipeScreen from "../screens/AddRecipeScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="RecipeList">
        <Stack.Screen
          name="RecipeList"
          component={RecipeListScreen}
          options={{ title: "Mis Recetas" }}
        />
        <Stack.Screen
          name="RecipeDetail"
          component={RecipeDetailScreen}
          options={{ title: "Detalle de receta" }}
        />
        <Stack.Screen
          name="AddRecipe"
          component={AddRecipeScreen}
          options={{ title: "Nueva receta" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// import React from "react";
// import { ActivityIndicator, Pressable, Text, View } from "react-native";
// import { NavigationContainer } from "@react-navigation/native";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";

// import { useAuth } from "../context/AuthContext";
// import LoginScreen from "../screens/LoginScreen";
// import RegisterScreen from "../screens/RegisterScreen";
// import RecipeListScreen from "../screens/RecipeListScreen";
// import RecipeDetailScreen from "../screens/RecipeDetailScreen";
// import AddRecipeScreen from "../screens/AddRecipeScreen";

// const Stack = createNativeStackNavigator();

// function AuthStack() {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="Login" component={LoginScreen} />
//       <Stack.Screen name="Register" component={RegisterScreen} />
//     </Stack.Navigator>
//   );
// }

// function AppStack() {
//   const { signOut } = useAuth();

//   return (
//     <Stack.Navigator initialRouteName="RecipeList">
//       <Stack.Screen
//         name="RecipeList"
//         component={RecipeListScreen}
//         options={{
//           title: "Mis Recetas",
//           headerRight: () => (
//             <Pressable onPress={signOut} style={{ paddingHorizontal: 4 }}>
//               <Text style={{ color: "#ff6b35", fontWeight: "600" }}>Salir</Text>
//             </Pressable>
//           ),
//         }}
//       />
//       <Stack.Screen
//         name="RecipeDetail"
//         component={RecipeDetailScreen}
//         options={{ title: "Detalle de receta" }}
//       />
//       <Stack.Screen
//         name="AddRecipe"
//         component={AddRecipeScreen}
//         options={{ title: "Nueva receta" }}
//       />
//     </Stack.Navigator>
//   );
// }

// export default function AppNavigator() {
//   const { username, loading } = useAuth();

//   if (loading) {
//     return (
//       <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       {username ? <AppStack /> : <AuthStack />}
//     </NavigationContainer>
//   );
// }
