import { useEffect } from "react";
import API from "../api/axios";

export default function useOfflineSync() {
  useEffect(() => {
    const sync = async () => {
      const data = JSON.parse(localStorage.getItem("offline")) || [];
      if (data.length === 0) return;

      const remaining = [];

      for (let d of data) {
        try {
          await API.post("/invoices", d);
        } catch {
          remaining.push(d);
        }
      }

      if (remaining.length === 0) {
        localStorage.removeItem("offline");
      } else {
        localStorage.setItem("offline", JSON.stringify(remaining));
      }
    };

    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, []);
}