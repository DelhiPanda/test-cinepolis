/**
 * Datos de Salas de Cine
 * 
 * Este archivo contiene la información de las salas disponibles en el complejo.
 * En una aplicación real, estos datos vendrían de una API o base de datos.
 * 
 * Características de cada sala:
 * - SMALL: 80 asientos, 15 min de limpieza, no acepta películas >150 min
 * - MEDIUM: 120 asientos, 15 min de limpieza
 * - LARGE: 200 asientos, 20 min de limpieza
 */

import { Room } from "@/types";

/**
 * Salas disponibles en el complejo
 * 
 * Cada sala tiene:
 * - id: Identificador único
 * - name: Nombre de la sala
 * - size: Tamaño (SMALL, MEDIUM, LARGE)
 * - seats: Número de asientos
 */
export const rooms: Room[] = [
  { id: "S1", name: "Sala 1", size: "LARGE", seats: 200 },
  { id: "S2", name: "Sala 2", size: "MEDIUM", seats: 120 },
  { id: "S3", name: "Sala 3", size: "SMALL", seats: 80 },
];

