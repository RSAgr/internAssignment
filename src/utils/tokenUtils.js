// Token expiration utilities
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return false; // Not a JWT, assume it's valid
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has expiration time
    if (!payload.exp) return false; // No expiration, assume it's valid
    
    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    return Date.now() >= payload.exp * 1000;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return false; // If we can't parse it, assume it's not a JWT and is valid
  }
};

export const getTokenTimeRemaining = (token) => {
  if (!token) return 0;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return null;
    
    const timeRemaining = (payload.exp * 1000) - Date.now();
    return Math.max(0, timeRemaining);
  } catch (error) {
    console.error('Error getting token time remaining:', error);
    return null;
  }
};
