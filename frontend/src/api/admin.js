import axios from "axios";

const API_ADMIN = "VITE_API_URL/api/admin/dashboard";

export const getDashboardStats = async (accessToken) => {
  const res = await axios.get(`${API_ADMIN}/dashboard-stats`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data.data;
};

export const getAllUsers = async (accessToken) => {
  const res = await axios.get(`${API_ADMIN}/all-users`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data.data;
};

export const changeRole = async (userId, role, accessToken) => {
  const res = await axios.patch(
    `${API_ADMIN}/change-user/${userId}/role`,
    { role },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return res.data;
};

export const removeUser = async (userId, accessToken) => {
  const res = await axios.delete(`${API_ADMIN}/remove-user/${userId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
};

export const getAllNotes = async (accessToken) => {
  const res = await axios.get(`${API_ADMIN}/all-notes`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data.data;
};
