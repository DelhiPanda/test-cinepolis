/**
 * Tipos y Interfaces para el Sistema de Gestión de Cinepolis
 * 
 * Este archivo define todos los tipos TypeScript utilizados en la aplicación,
 * incluyendo tipos de películas, salas, funciones y estadísticas.
 */

/**
 * Tipo de película según su categoría
 * - REGULAR: Película regular sin restricciones especiales
 * - SPECIAL: Solo se puede programar viernes, sábado o domingo
 * - PREMIERE: Requiere mínimo 2 funciones el día del estreno, primera función antes de las 14:00
 */
export type MovieType = "REGULAR" | "SPECIAL" | "PREMIERE";

/**
 * Clasificación de edad de la película
 * - A: Para todo público
 * - B: Mayores de 12 años
 * - B15: Mayores de 15 años
 * - C: Mayores de 18 años
 */
export type Rating = "A" | "B" | "B15" | "C";

/**
 * Tamaño de la sala de cine
 * - SMALL: Sala chica (80 asientos) - 15 min de limpieza, no acepta películas >150 min
 * - MEDIUM: Sala mediana (120 asientos) - 15 min de limpieza
 * - LARGE: Sala grande (200 asientos) - 20 min de limpieza
 */
export type RoomSize = "SMALL" | "MEDIUM" | "LARGE";

/**
 * Información de una película en cartelera
 */
export interface Movie {
  id: string; // Identificador único de la película
  title: string; // Título de la película
  runtimeMin: number; // Duración en minutos
  rating: Rating; // Clasificación de edad
  type: MovieType; // Tipo de película (REGULAR, SPECIAL, PREMIERE)
  demandScore: number; // Puntuación de demanda (0-100). PREMIERE requiere >= 70
  trailerUrl?: string; // URL del trailer en YouTube (opcional)
}

/**
 * Información de una sala de cine
 */
export interface Room {
  id: string; // Identificador único de la sala
  name: string; // Nombre de la sala (ej: "Sala 1")
  size: RoomSize; // Tamaño de la sala
  seats: number; // Número de asientos disponibles
}

/**
 * Función programada (una película en una sala a una hora específica)
 */
export interface Schedule {
  id: string; // Identificador único de la función
  movieId: string; // ID de la película que se proyectará
  roomId: string; // ID de la sala donde se proyectará
  startTime: string; // Hora de inicio en formato HH:mm (ej: "14:30")
  date: string; // Fecha en formato YYYY-MM-DD (ej: "2024-01-15")
  endTime: string; // Hora de fin calculada: startTime + runtime + tiempo de limpieza
}

/**
 * Estadísticas de un día específico
 * Calculadas a partir de todas las funciones programadas ese día
 */
export interface DayStats {
  date: string; // Fecha en formato YYYY-MM-DD
  usagePercentage: number; // Porcentaje de uso de todas las salas (0-100)
  totalDeadTime: number; // Tiempo muerto total en minutos (tiempo sin funciones)
  scheduledShows: number; // Número total de funciones programadas
  estimatedCapacity: number; // Capacidad estimada (suma de asientos de todas las funciones)
}

/**
 * Estadísticas de una sala específica en un día
 */
export interface RoomStats {
  roomId: string; // ID de la sala
  roomName: string; // Nombre de la sala
  usagePercentage: number; // Porcentaje de uso de la sala (0-100)
  totalDeadTime: number; // Tiempo muerto en minutos
  scheduledShows: number; // Número de funciones programadas en esa sala
}

