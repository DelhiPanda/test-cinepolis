/**
 * Custom Hook: useTheme
 * 
 * Hook personalizado para manejar el tema (modo claro/oscuro) de la aplicación.
 * Persiste la preferencia del usuario en localStorage.
 */

"use client";

import { useEffect, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";

type Theme = "light" | "dark";

export function useTheme() {
  const [mounted, setMounted] = useState(false);
  
  // Función para obtener el tema inicial
  const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return "light";
    
    try {
      const stored = localStorage.getItem("cinepolis_theme");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed === "dark" || parsed === "light") {
          return parsed;
        }
      }
    } catch (error) {
      // Si hay error al leer, continuar con preferencia del sistema
    }
    
    // Si no hay tema guardado, usar la preferencia del sistema
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  };

  const [theme, setTheme] = useLocalStorage<Theme>("cinepolis_theme", getInitialTheme());

  // Detectar si el componente ya se montó (para evitar problemas de hidratación)
  useEffect(() => {
    setMounted(true);
    
    // Aplicar el tema inicial inmediatamente
    const root = document.documentElement;
    const initialTheme = getInitialTheme();
    if (initialTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  // Aplicar el tema al documento cuando cambie
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      // Aplicar inmediatamente para feedback visual rápido
      const root = document.documentElement;
      if (newTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      return newTheme;
    });
  };

  return {
    theme,
    toggleTheme,
    mounted,
  };
}

