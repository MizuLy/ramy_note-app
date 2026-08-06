import axios from "axios";

const API_AUTH = "http://localhost:6969/api/auth";
const API_TAG = "http://localhost:6969/api/tags";
const API_OTP = "http://localhost:6969/api/otp";
const API_NOTE = "http://localhost:6969/api/notes";

const getAuthHeader = (accessToken) => ({
  headers: { Authorization: `Bearer ${accessToken}` },
  withCredentials: true,
});

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

// Profile Setting
export const changeName = (data, accessToken) =>
  axios.patch(`${API_AUTH}/change-name`, data, getAuthHeader(accessToken));
export const changeEmail = (data, accessToken) =>
  axios.patch(`${API_AUTH}/change-email`, data, getAuthHeader(accessToken));
export const changePassword = (data, accessToken) =>
  axios.patch(`${API_AUTH}/change-password`, data, getAuthHeader(accessToken));

// OTP
export const verifyOtp = (data) =>
  axios.post(`${API_OTP}/verify`, data, { withCredentials: true });
export const requestOtp = (data) =>
  axios.post(`${API_OTP}/request`, data, { withCredentials: true });

// Tag
export const getTags = async (accessToken) => {
  const res = await axios.get(API_TAG, getAuthHeader(accessToken));
  return res.data.data;
};
export const createTag = async (data, accessToken) => {
  const res = await axios.post(API_TAG, data, getAuthHeader(accessToken));
  return res.data;
};
export const updateTag = async (id, data, accessToken) => {
  const res = await axios.patch(
    `${API_TAG}/${id}`,
    data,
    getAuthHeader(accessToken),
  );
  return res.data;
};
export const deleteTag = async (id, accessToken) => {
  const res = await axios.delete(
    `${API_TAG}/${id}`,
    getAuthHeader(accessToken),
  );
  return res.data;
};

// Notes
export const getNotes = async (accessToken) => {
  const res = await axios.get(API_NOTE, getAuthHeader(accessToken));
  return res.data;
};
export const getNoteId = async (id, accessToken) => {
  const res = await axios.get(`${API_NOTE}/${id}`, getAuthHeader(accessToken));
  return res.data;
};
export const createNote = async (data, accessToken) => {
  const res = await axios.post(API_NOTE, data, getAuthHeader(accessToken));
  return res.data;
};
export const updateNote = async (id, data, accessToken) => {
  const res = await axios.put(
    `${API_NOTE}/${id}`,
    data,
    getAuthHeader(accessToken),
  );
  return res.data;
};
export const deleteNote = async (id, accessToken) => {
  const res = await axios.delete(
    `${API_NOTE}/${id}`,
    getAuthHeader(accessToken),
  );
  return res.data;
};
export const togglePin = async (id, isPinned, accessToken) => {
  const res = await axios.patch(
    `${API_NOTE}/${id}`,
    { isPinned },
    getAuthHeader(accessToken),
  );
  return res.data;
};
