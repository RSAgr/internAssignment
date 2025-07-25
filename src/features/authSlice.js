import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { isTokenExpired } from '../utils/tokenUtils';

// Helper functions for localStorage
const loadAuthFromStorage = () => {
  try {
    const serializedAuth = localStorage.getItem('auth');
    if (serializedAuth === null) {
      return { user: null, token: null };
    }
    
    const authData = JSON.parse(serializedAuth);
    
    // Check if token is expired
    if (authData.token && isTokenExpired(authData.token)) {
      // Token is expired, clear storage and return null
      localStorage.removeItem('auth');
      return { user: null, token: null };
    }
    
    return authData;
  } catch {
    return { user: null, token: null };
  }
};

const saveAuthToStorage = (user, token) => {
  try {
    const authData = { user, token };
    localStorage.setItem('auth', JSON.stringify(authData));
  } catch (err) {
    console.error('Could not save auth to localStorage:', err);
  }
};

const removeAuthFromStorage = () => {
  try {
    localStorage.removeItem('auth');
  } catch (err) {
    console.error('Could not remove auth from localStorage:', err);
  }
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ username, password }, thunkAPI) => {
    try {
      const res = await axios.post('https://dummyjson.com/auth/login', {
        username,
        password,
      });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  }
);

// Load initial state from localStorage
const initialAuthState = loadAuthFromStorage();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialAuthState.user,
    token: initialAuthState.token,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      removeAuthFromStorage();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.token = action.payload.accessToken;
        // Save to localStorage
        saveAuthToStorage(action.payload, action.payload.accessToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message || 'Login failed';
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
