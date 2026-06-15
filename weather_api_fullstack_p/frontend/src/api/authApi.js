import apiClient from './axios';

export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post('/users/register', userData);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.detail || 'Registration failed. Please try again.' 
    };
  }
};
