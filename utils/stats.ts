/**
 * Utilidades de Cálculo de Estadísticas
 * 
 * Este módulo calcula estadísticas de uso de salas y días:
 * - Porcentaje de uso (tiempo ocupado vs disponible)
 * - Tiempo muerto (tiempo sin funciones programadas)
 * - Número de funciones programadas
 * - Capacidad estimada (suma de asientos)
 */

import { Schedule, Room } from "@/types";

/** Estadísticas de un día específico (todas las salas combinadas) */
export interface DayStats {
  /** Fecha en formato YYYY-MM-DD */
  date: string;
  /** Porcentaje de uso (0-100) */
  usagePercentage: number;
  /** Tiempo muerto total en minutos */
  totalDeadTime: number;
  /** Número total de funciones */
  scheduledShows: number;
  /** Capacidad estimada (suma de asientos de todas las funciones) */
  estimatedCapacity: number;
}

/** Estadísticas de una sala específica en un día */
export interface RoomStats {
  /** ID de la sala */
  roomId: string;
  /** Nombre de la sala */
  roomName: string;
  /** Porcentaje de uso (0-100) */
  usagePercentage: number;
  /** Tiempo muerto en minutos */
  totalDeadTime: number;
  /** Número de funciones programadas */
  scheduledShows: number;
}

// Constantes para el horario de operación del cine
const DAY_START = 10 * 60; // 10:00 en minutos desde medianoche
const DAY_END = 23 * 60 + 59; // 23:59 en minutos desde medianoche
const TOTAL_AVAILABLE_MINUTES = DAY_END - DAY_START; // Minutos disponibles en el día (839 minutos)

/**
 * Calcula las estadísticas de un día específico (todas las salas combinadas)
 * 
 * @param date - Fecha en formato YYYY-MM-DD
 * @param schedules - Array de todas las funciones programadas
 * @param rooms - Array de todas las salas disponibles
 * @returns Estadísticas del día
 */
export function calculateDayStats(
  date: string,
  schedules: Schedule[],
  rooms: Room[]
): DayStats {
  // Filtrar funciones del día específico
  const daySchedules = schedules.filter((s) => s.date === date);
  
  // Agrupar funciones por sala
  const daySchedulesByRoom = rooms.map((room) => ({
    room,
    schedules: daySchedules.filter((s) => s.roomId === room.id),
  }));

  // Contadores acumulativos
  let totalUsedMinutes = 0; // Tiempo total usado por todas las funciones
  let totalDeadTime = 0; // Tiempo muerto total (sin funciones)
  let totalShows = daySchedules.length; // Total de funciones programadas
  let totalCapacity = 0; // Capacidad total (suma de asientos)

  // Calcular estadísticas por sala
  daySchedulesByRoom.forEach(({ room, schedules: roomSchedules }) => {
    // Si la sala no tiene funciones, todo el día es tiempo muerto
    if (roomSchedules.length === 0) {
      totalDeadTime += TOTAL_AVAILABLE_MINUTES;
      return;
    }

    // Ordenar funciones por hora de inicio para calcular tiempo muerto correctamente
    const sorted = [...roomSchedules].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    // Calcular tiempo usado: sumar duración de cada función
    sorted.forEach((schedule) => {
      const start = timeToMinutes(schedule.startTime);
      const end = timeToMinutes(schedule.endTime);
      totalUsedMinutes += end - start; // Duración de la función
      totalCapacity += room.seats; // Sumar capacidad de la sala
    });

    // Calcular tiempo muerto: espacios entre funciones
    let lastEnd = DAY_START; // Empezar desde el inicio del día
    sorted.forEach((schedule) => {
      const start = timeToMinutes(schedule.startTime);
      // Si hay espacio entre la función anterior y esta, es tiempo muerto
      if (start > lastEnd) {
        totalDeadTime += start - lastEnd;
      }
      lastEnd = timeToMinutes(schedule.endTime);
    });

    // Tiempo muerto al final del día (desde la última función hasta las 23:59)
    const lastScheduleEnd = timeToMinutes(
      sorted[sorted.length - 1].endTime
    );
    if (lastScheduleEnd < DAY_END) {
      totalDeadTime += DAY_END - lastScheduleEnd;
    }
  });

  // Calcular porcentaje de uso
  // Total disponible = minutos disponibles por día × número de salas
  const totalAvailableMinutes = TOTAL_AVAILABLE_MINUTES * rooms.length;
  const usagePercentage =
    totalAvailableMinutes > 0
      ? (totalUsedMinutes / totalAvailableMinutes) * 100
      : 0;

  return {
    date,
    usagePercentage: Math.round(usagePercentage * 100) / 100, // Redondear a 2 decimales
    totalDeadTime,
    scheduledShows: totalShows,
    estimatedCapacity: totalCapacity,
  };
}

/**
 * Calcula las estadísticas de una sala específica en un día
 * 
 * @param roomId - ID de la sala
 * @param roomName - Nombre de la sala
 * @param date - Fecha en formato YYYY-MM-DD
 * @param schedules - Array de todas las funciones programadas
 * @returns Estadísticas de la sala
 */
export function calculateRoomStats(
  roomId: string,
  roomName: string,
  date: string,
  schedules: Schedule[]
): RoomStats {
  // Filtrar y ordenar funciones de esta sala en este día
  const roomSchedules = schedules
    .filter((s) => s.roomId === roomId && s.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  let usedMinutes = 0; // Tiempo usado por funciones
  let deadTime = 0; // Tiempo muerto

  // Si no hay funciones, todo el día es tiempo muerto
  if (roomSchedules.length === 0) {
    deadTime = TOTAL_AVAILABLE_MINUTES;
  } else {
    // Calcular tiempo usado: sumar duración de cada función
    roomSchedules.forEach((schedule) => {
      const start = timeToMinutes(schedule.startTime);
      const end = timeToMinutes(schedule.endTime);
      usedMinutes += end - start;
    });

    // Calcular tiempo muerto: espacios entre funciones
    let lastEnd = DAY_START;
    roomSchedules.forEach((schedule) => {
      const start = timeToMinutes(schedule.startTime);
      if (start > lastEnd) {
        deadTime += start - lastEnd;
      }
      lastEnd = timeToMinutes(schedule.endTime);
    });

    // Tiempo muerto al final del día
    const lastScheduleEnd = timeToMinutes(
      roomSchedules[roomSchedules.length - 1].endTime
    );
    if (lastScheduleEnd < DAY_END) {
      deadTime += DAY_END - lastScheduleEnd;
    }
  }

  // Calcular porcentaje de uso
  const usagePercentage =
    TOTAL_AVAILABLE_MINUTES > 0
      ? (usedMinutes / TOTAL_AVAILABLE_MINUTES) * 100
      : 0;

  return {
    roomId,
    roomName,
    usagePercentage: Math.round(usagePercentage * 100) / 100, // Redondear a 2 decimales
    totalDeadTime: deadTime,
    scheduledShows: roomSchedules.length,
  };
}

/**
 * Convierte una hora en formato HH:mm a minutos desde medianoche
 * Función auxiliar para cálculos de tiempo
 * 
 * @param time - Hora en formato HH:mm
 * @returns Minutos desde medianoche
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

