import axios from "axios";

const API = "http://localhost:6969/api/tags";

export const getTags = async (accessToken) => {
  const res = await axios.get(API, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
};
