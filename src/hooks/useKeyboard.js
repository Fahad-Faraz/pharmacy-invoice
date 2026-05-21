// hooks/useKeyboard.js
import { useEffect } from "react";

export default function useKeyboard(callback) {
  useEffect(() => {
    const handle = (e) => {
      if (e.key === "Enter") callback();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
}