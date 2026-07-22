import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";


export const BASE_URL = "https://cooking-app-fct9.onrender.com/api";
// Backend local en la red WiFi
// export const BASE_URL = "http://172.21.224.1:8000/api";
//ip especial para android studio 
// export const BASE_URL = "http://10.0.2.2:8000/api";
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // un poco más alto: el free tier de Render puede tardar en "despertar"
});

// Adjunta el token de autenticación (si existe) a cada request.
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default client;
