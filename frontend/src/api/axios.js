import axios from "axios";

const API_AUTH = "http://localhost:6969/api/auth";
const API_TAG = "http://localhost:6969/api/tags";

// Auth
export const refresh = (data) =>
  axios.post(`${API_AUTH}/refresh`, {}, { withCredentials: true });
export const login = (data) =>
  axios.post(`${API_AUTH}/login`, data, { withCredentials: true });
export const register = (data) =>
  axios.post(`${API_AUTH}/register`, data, { withCredentials: true });
export const logout = (data) =>
  axios.post(`${API_AUTH}/logout`, {}, { withCredentials: true });
export const currentUser = async (accessToken) => {
  const res = await axios.get(`${API_AUTH}/current-user`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data.user;
};

// Tag
export const getTags = async (accessToken) => {
  const res = await axios.get(API_TAG, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data.data;
};
