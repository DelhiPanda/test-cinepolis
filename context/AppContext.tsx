/**
 * Contexto Global de la Aplicación (AppContext)
 * 
 * Este contexto proporciona el estado global de la aplicación usando React Context API.
 * Gestiona las películas, salas y funciones programadas, con persistencia en localStorage.
 * 
 * Arquitectura:
 * - Las películas y salas son datos estáticos (importados desde data/)
 * - Las funciones (schedules) se persisten en localStorage
 * - Todas las operaciones CRUD de funciones se realizan a través de este contexto
 */

"use client";

import { createContext, useContext, ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Movie, Room, Schedule } from "@/types";
import { movies as initialMovies } from "@/data/movies";
import { rooms as initialRooms } from "@/data/rooms";

/**
 * Interfaz del contexto que define qué datos y funciones están disponibles
 */
interface AppContextType {
  movies: Movie[]; // Lista de todas las películas disponibles
  rooms: Room[]; // Lista de todas las salas disponibles
  schedules: Schedule[]; // Lista de todas las funciones programadas
  addSchedule: (schedule: Schedule) => void; // Agregar una nueva función
  addSchedules: (schedules: Schedule[]) => void; // Agregar múltiples funciones de una vez
  updateSchedule: (id: string, schedule: Partial<Schedule>) => void; // Actualizar una función existente
  deleteSchedule: (id: string) => void; // Eliminar una función
  deleteSchedules: (ids: string[]) => void; // Eliminar múltiples funciones de una vez
  getSchedulesByMovie: (movieId: string) => Schedule[]; // Obtener funciones de una película
  getSchedulesByRoomAndDate: (roomId: string, date: string) => Schedule[]; // Obtener funciones de una sala en un día
}

// Crear el contexto (valor inicial undefined)
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Provider del contexto que envuelve la aplicación
 * 
 * @param children - Componentes hijos que tendrán acceso al contexto
 */
export function AppProvider({ children }: { children: ReactNode }) {
  // Usar localStorage para persistir las funciones programadas
  // La clave "cinepolis_schedules" identifica los datos en el navegador
  const [schedules, setSchedules] = useLocalStorage<Schedule[]>("cinepolis_schedules", []);

  /**
   * Agregar una nueva función al sistema
   * @param schedule - Función completa a agregar
   */
  const addSchedule = (schedule: Schedule) => {
    setSchedules((prev) => [...prev, schedule]);
  };

  /**
   * Agregar múltiples funciones al sistema de una vez
   * @param newSchedules - Array de funciones a agregar
   */
  const addSchedules = (newSchedules: Schedule[]) => {
    setSchedules((prev) => [...prev, ...newSchedules]);
  };

  /**
   * Actualizar una función existente
   * @param id - ID de la función a actualizar
   * @param schedule - Datos parciales para actualizar (solo los campos que cambian)
   */
  const updateSchedule = (id: string, schedule: Partial<Schedule>) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...schedule } : s))
    );
  };

  /**
   * Eliminar una función del sistema
   * @param id - ID de la función a eliminar
   */
  const deleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  /**
   * Eliminar múltiples funciones del sistema de una vez
   * @param ids - Array de IDs de funciones a eliminar
   */
  const deleteSchedules = (ids: string[]) => {
    const idsSet = new Set(ids);
    setSchedules((prev) => prev.filter((s) => !idsSet.has(s.id)));
  };

  /**
   * Obtener todas las funciones de una película específica
   * @param movieId - ID de la película
   * @returns Array de funciones de esa película
   */
  const getSchedulesByMovie = (movieId: string) => {
    return schedules.filter((s) => s.movieId === movieId);
  };

  /**
   * Obtener todas las funciones de una sala en un día específico, ordenadas por hora
   * @param roomId - ID de la sala
   * @param date - Fecha en formato YYYY-MM-DD
   * @returns Array de funciones ordenadas por hora de inicio
   */
  const getSchedulesByRoomAndDate = (roomId: string, date: string) => {
    return schedules
      .filter((s) => s.roomId === roomId && s.date === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Proporcionar el contexto a todos los componentes hijos
  return (
    <AppContext.Provider
      value={{
        movies: initialMovies, // Datos estáticos de películas
        rooms: initialRooms, // Datos estáticos de salas
        schedules, // Funciones programadas (persistidas)
        addSchedule,
        addSchedules,
        updateSchedule,
        deleteSchedule,
        deleteSchedules,
        getSchedulesByMovie,
        getSchedulesByRoomAndDate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook personalizado para acceder al contexto de la aplicación
 * 
 * @returns AppContextType - Todos los datos y funciones del contexto
 * @throws Error si se usa fuera del AppProvider
 * 
 * @example
 * const { movies, schedules, addSchedule } = useApp();
 */
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

