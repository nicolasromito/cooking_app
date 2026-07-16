import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Cambiar por la URL real del backend Django.
// En desarrollo con Expo, usar la IP de tu máquina en la red local
// (no "localhost", porque el dispositivo/emulador no la resuelve igual).
// export const BASE_URL = "http://192.168.0.10:8000/api";
export const BASE_URL = "http://10.0.2.2:8000/api";
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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
