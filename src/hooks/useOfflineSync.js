// hooks/useOfflineSync.js
import { useEffect } from "react";
import API from "../api/axios";

export default function useOfflineSync() {
  useEffect(() => {
    const sync = async () => {
      const data = JSON.parse(localStorage.getItem("offline")) || [];

      for (let d of data) {
        await API.post("/invoices", d);
      }

      localStorage.removeItem("offline");
    };

    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, []);
}