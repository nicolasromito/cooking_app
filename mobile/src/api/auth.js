import client from "./client";

export const login = async (username, password) => {
  const response = await client.post("/auth/login/", { username, password });
  return response.data; // { token, username }
};

export const register = async (username, email, password, password2) => {
  const response = await client.post("/auth/register/", {
    username,
    email,
    password,
    password2,
  });
  return response.data; // { token, username }
};
