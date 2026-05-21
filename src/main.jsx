import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { store } from "./app/store";
import { queryClient } from "./app/queryClient";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "13px",
                background: "#231f1a",
                color: "#faf8f3",
                border: "1px solid #423b31",
                borderRadius: "8px",
              },
              success: { iconTheme: { primary: "#22c55e", secondary: "#faf8f3" } },
              error: { iconTheme: { primary: "#f43f5e", secondary: "#faf8f3" } },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);