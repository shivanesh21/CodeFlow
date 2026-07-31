import API from "./api";

// Get user profile
export const getUserProfile = async () => {
  const response = await API.get("/users/profile");
  return response.data;
};

// Update user profile
export const updateUserProfile = async (userData) => {
  const response = await API.put("/users/profile", userData);
  return response.data;
};

// Change password
export const changePassword = async (passwordData) => {
  const response = await API.put("/users/change-password", passwordData);
  return response.data;
};
