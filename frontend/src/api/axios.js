import axios from "axios";
import { data } from "react-router-dom";

const API_AUTH = `${import.meta.env.VITE_API_URL}/api/auth`;
const API_TAG = `${import.meta.env.VITE_API_URL}/api/tags`;
const API_OTP = `${import.meta.env.VITE_API_URL}/api/otp`;
const API_NOTE = `${import.meta.env.VITE_API_URL}/api/notes`;
const API_FOLDER = `${import.meta.env.VITE_API_URL}/api/folders`;
const API_TODO = `${import.meta.env.VITE_API_URL}/api/todos`;
const API_JOURNAL = `${import.meta.env.VITE_API_URL}/api/journals`;

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
export const changeAvatar = (formData, accessToken) =>
  axios.patch(`${API_AUTH}/change-avatar`, formData, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

// OTP
export const verifyOtp = (data) =>
  axios.post(`${API_OTP}/verify`, data, { withCredentials: true });
export const requestOtp = (data) =>
  axios.post(`${API_OTP}/request`, data, { withCredentials: true });

// Reset/Forgot password
export const forgotPassword = (data) =>
  axios.post(`${API_AUTH}/forgot-password`, data);
export const resetPassword = (data) =>
  axios.post(`${API_AUTH}/reset-password`, data);

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
  try {
    const res = await axios.delete(
      `${API_TAG}/${id}`,
      getAuthHeader(accessToken),
    );
    return res.data;
  } catch (err) {
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      "Failed to delete tag";
    throw new Error(msg);
  }
};

// Notes
export const getNotes = async (accessToken, options = {}) => {
  const params = {};
  if (options.trash) params.trash = "true";
  const res = await axios.get(API_NOTE, {
    ...getAuthHeader(accessToken),
    params,
  });
  return res.data;
};
export const getNoteId = async (id, accessToken, options = {}) => {
  const params = {};
  if (options.trash) params.trash = "true";
  const res = await axios.get(`${API_NOTE}/${id}`, {
    ...getAuthHeader(accessToken),
    params,
  });
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
export const trashNote = deleteNote;
export const restoreNote = async (id, accessToken) => {
  const res = await axios.patch(
    `${API_NOTE}/${id}/restore`,
    {},
    getAuthHeader(accessToken),
  );
  return res.data;
};
export const permanentDeleteNote = async (id, accessToken) => {
  const res = await axios.delete(
    `${API_NOTE}/${id}/permanent`,
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

// FOLDER
export const getFolders = async (accessToken) => {
  const res = await axios.get(API_FOLDER, getAuthHeader(accessToken));
  return res.data;
};
export const getFolderId = async (id, accessToken) => {
  const res = await axios.get(
    `${API_FOLDER}/${id}`,
    getAuthHeader(accessToken),
  );
  return res.data;
};
export const createFolder = async (data, accessToken) => {
  const res = await axios.post(API_FOLDER, data, getAuthHeader(accessToken));
  return res.data;
};
export const updateFolder = async (id, data, accessToken) => {
  const res = await axios.patch(
    `${API_FOLDER}/${id}`,
    data,
    getAuthHeader(accessToken),
  );
  return res.data;
};
export const deleteFolder = async (id, mode, accessToken) => {
  try {
    const res = await axios.delete(`${API_FOLDER}/${id}`, {
      ...getAuthHeader(accessToken),
      data: { mode },
    });
    return res.data;
  } catch (err) {
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      "Failed to delete folder";
    throw new Error(msg);
  }
};

// Todo
// GET ALL TODOS
export const getTodos = async (accessToken) => {
  const res = await axios.get(API_TODO, getAuthHeader(accessToken));
  return res.data;
};
export const createTodo = async (data, accessToken) => {
  const res = await axios.post(
    API_TODO,
    data, // { title, dueDate }
    getAuthHeader(accessToken),
  );
  return res.data;
};
export const updateTodo = async (id, data, accessToken) => {
  const res = await axios.put(
    `${API_TODO}/${id}`,
    data, // { title, dueDate, isDone }
    getAuthHeader(accessToken),
  );
  return res.data;
};
export const toggleTodoDone = async (id, accessToken) => {
  const res = await axios.patch(
    `${API_TODO}/${id}/toggle`,
    {},
    getAuthHeader(accessToken),
  );
  return res.data;
};
export const deleteTodo = async (id, accessToken) => {
  const res = await axios.delete(
    `${API_TODO}/${id}`,
    getAuthHeader(accessToken),
  );
  return res.data;
};

// Journal
export const getJournals = async (accessToken, options = {}) => {
  const params = {};
  if (options.trash) params.trash = "true";
  const res = await axios.get(API_JOURNAL, {
    ...getAuthHeader(accessToken),
    params,
  });
  return res.data;
};

export const getJournalById = async (id, accessToken) => {
  const res = await axios.get(
    `${API_JOURNAL}/${id}`,
    getAuthHeader(accessToken),
  );
  return res.data;
};

export const createJournal = async (data, accessToken) => {
  const res = await axios.post(API_JOURNAL, data, getAuthHeader(accessToken));
  return res.data;
};

export const updateJournal = async (id, data, accessToken) => {
  const res = await axios.put(
    `${API_JOURNAL}/${id}`,
    data,
    getAuthHeader(accessToken),
  );
  return res.data;
};

export const deleteJournal = async (id, accessToken) => {
  const res = await axios.delete(
    `${API_JOURNAL}/${id}`,
    getAuthHeader(accessToken),
  );
  return res.data;
};

export const restoreJournal = async (id, accessToken) => {
  const res = await axios.patch(
    `${API_JOURNAL}/${id}/restore`,
    {},
    getAuthHeader(accessToken),
  );
  return res.data;
};

export const permanentDeleteJournal = async (id, accessToken) => {
  const res = await axios.delete(
    `${API_JOURNAL}/${id}/permanent`,
    getAuthHeader(accessToken),
  );
  return res.data;
};
