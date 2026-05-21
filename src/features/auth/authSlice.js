import { createSlice } from "@reduxjs/toolkit";

const token = localStorage.getItem("token");

let user = null;
try {
  const u = localStorage.getItem("user");
  if (u) user = JSON.parse(u);
} catch {}

const initialState = {
  user,
  token,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      console.log(action.payload.token);
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      
      state.user = action.payload.user;
      state.token = action.payload.token;

    },
    logout: (state) => {
      state.user = null;
      state.token = null;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;