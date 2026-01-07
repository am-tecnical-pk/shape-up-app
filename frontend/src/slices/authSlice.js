import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userInfo: localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.userInfo = action.payload;
      localStorage.setItem('userInfo', JSON.stringify(action.payload));
    },
    // 👇 YEH HAI MAIN FIX
    logout: (state) => {
      state.userInfo = null;
      localStorage.removeItem('userInfo'); // Permanent Storage Clear
      sessionStorage.clear(); // Temporary Session Clear (Zaroori hai!)
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;