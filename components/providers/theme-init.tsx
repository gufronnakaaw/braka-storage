"use client";

import { useEffect } from "react";

export function ThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem("braka-theme");
    if (saved === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, []);

  return null;
}
