/**
 * Authentication utility functions
 * Handles token storage and retrieval from localStorage
 */

const TOKEN_KEY = 'geotruth_token';
const USER_KEY = 'geotruth_user';

/**
 * Save auth token and user data to localStorage
 */
export const setAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

/**
 * Get the stored auth token
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get the stored user data
 */
export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

/**
 * Check if user is currently authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Remove auth data from localStorage (logout)
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
