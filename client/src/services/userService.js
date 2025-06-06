import api from './api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

/**
 * Update user profile
 * @param {Object} profileData - The profile data to update
 * @param {string} [profileData.firstName] - User's first name
 * @param {string} [profileData.lastName] - User's last name
 * @param {string} [profileData.email] - User's email
 * @param {string} [profileData.phoneNumber] - User's phone number
 * @param {string} [profileData.bio] - User's bio
 * @param {string} [profileData.jobTitle] - User's job title
 * @param {string} [profileData.department] - User's department
 * @returns {Promise<Object>} - Updated user profile
 */
export const updateUserProfile = async (profileData, id) => {
  console.log(profileData)
  try {
    const response = await api.put(API_ENDPOINTS.USERS.getById(id), profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Upload user avatar
 * @param {File} file - The image file to upload
 * @returns {Promise<Object>} - Upload response with file path
 */
export const uploadAvatar = async (file) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post(API_ENDPOINTS.USERS.AVATAR, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

/**
 * Update user settings
 * @param {Object} settings - The settings to update
 * @param {string} [settings.theme] - User's theme preference
 * @param {boolean} [settings.notifications] - Notification preference
 * @param {boolean} [settings.emailNotifications] - Email notification preference
 * @returns {Promise<Object>} - Updated user settings
 */
export const updateUserSettings = async (settings) => {
  try {
    const response = await api.put(API_ENDPOINTS.USERS.SETTINGS, settings);
    return response.data;
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

export default {
  updateUserProfile,
  uploadAvatar,
  updateUserSettings,
};
