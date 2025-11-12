/**
 * Custom Hook: useLocalStorage
 * 
 * Hook personalizado que sincroniza el estado de React con localStorage.
 * Permite persistir datos en el navegador del usuario.
 * 
 * @template T - Tipo genérico del valor a almacenar
 * @param key - Clave única para identificar el valor en localStorage
 * @param initialValue - Valor inicial si no existe en localStorage
 * @returns [storedValue, setValue] - Similar a useState, pero con persistencia
 * 
 * @example
 * const [schedules, setSchedules] = useLocalStorage<Schedule[]>("cinepolis_schedules", []);
 */
import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Inicializar el estado desde localStorage o usar el valor inicial
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Verificar que estamos en el cliente (no en SSR)
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      // Intentar obtener el valor del localStorage
      const item = window.localStorage.getItem(key);
      // Si existe, parsearlo; si no, usar el valor inicial
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Si hay error al leer (ej: JSON inválido), usar valor inicial
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  // Función para actualizar el valor (similar a setState)
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir función actualizadora (como setState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Actualizar el estado
      setStoredValue(valueToStore);
      // Guardar en localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // Si hay error al guardar (ej: localStorage lleno), solo loguear
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  return [storedValue, setValue] as const;
}

