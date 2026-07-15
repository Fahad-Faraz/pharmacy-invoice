import { createSlice } from "@reduxjs/toolkit";

const token = localStorage.getItem("token");

let user = null;
try {
  const u = localStorage.getItem("user");
  if (u) user = JSON.parse(u);
} catch {}

const authSlice = createSlice({
  name: "auth",
  initialState: { user, token },
  reducers: {
    setAuth: (state, action) => {
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