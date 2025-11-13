/**
 * Utilidades de Validación de Funciones
 * 
 * Este módulo contiene todas las reglas de negocio para validar funciones de cine.
 * Las validaciones se aplican antes de crear o actualizar una función.
 * 
 * Reglas implementadas:
 * 1. Horarios válidos: 10:00 - 23:59
 * 2. No empalmes: No pueden cruzarse funciones en la misma sala
 * 3. Tiempo de limpieza: 15 min (chicas/medianas), 20 min (grandes)
 * 4. SPECIAL: Solo viernes-domingo
 * 5. PREMIERE: Mínimo 2 funciones el día del estreno, primera antes de las 14:00, demandScore >= 70
 * 6. Películas largas (>150 min): No van en sala chica
 */

import { Schedule, Movie, Room, MovieType } from "@/types";

/** Error de validación con mensaje y campo opcional */
export interface ValidationError {
  /** Mensaje de error para mostrar al usuario */
  message: string;
  /** Campo del formulario relacionado (opcional) */
  field?: string;
}

/**
 * Valida una función antes de crearla o actualizarla
 * 
 * @param schedule - Función a validar (sin id ni endTime, se calculan)
 * @param movie - Película que se va a proyectar
 * @param room - Sala donde se va a proyectar
 * @param existingSchedules - Funciones ya existentes (para validar empalmes)
 * @returns Array de errores de validación. Si está vacío, la función es válida
 */
export function validateSchedule(
  schedule: Omit<Schedule, "id" | "endTime">,
  movie: Movie,
  room: Room,
  existingSchedules: Schedule[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // ============================================
  // REGLA 1: Validar horario válido (10:00 - 23:59)
  // ============================================
  const [hours, minutes] = schedule.startTime.split(":").map(Number);
  const startMinutes = hours * 60 + minutes; // Convertir a minutos desde medianoche
  const minTime = 10 * 60; // 10:00 en minutos
  const maxTime = 23 * 60 + 59; // 23:59 en minutos

  if (startMinutes < minTime || startMinutes > maxTime) {
    errors.push({
      message: `❌ REGLA 1: Horario inválido. La hora de inicio debe estar entre 10:00 y 23:59. Hora ingresada: ${schedule.startTime}`,
      field: "startTime",
    });
  }

  // ============================================
  // REGLA 2: Calcular tiempo de limpieza y validar que termine antes de 23:59
  // ============================================
  // Tiempo de limpieza según tamaño de sala:
  // - LARGE: 20 minutos
  // - MEDIUM/SMALL: 15 minutos
  const cleanupTime = room.size === "LARGE" ? 20 : 15;
  const totalDuration = movie.runtimeMin + cleanupTime; // Duración total = película + limpieza
  const endMinutes = startMinutes + totalDuration;

  if (endMinutes > maxTime) {
    const calculatedEndTime = minutesToTime(endMinutes);
    const latestStartTime = minutesToTime(maxTime - totalDuration);
    errors.push({
      message: `❌ REGLA 2: La función terminaría a las ${calculatedEndTime}, después del horario permitido (23:59). Considerando la duración de la película (${movie.runtimeMin} min) y el tiempo de limpieza (${cleanupTime} min), la hora de inicio más tardía permitida es ${latestStartTime}.`,
      field: "startTime",
    });
  }

  // ============================================
  // REGLA 3: Validar no empalmes (no pueden cruzarse funciones en la misma sala)
  // ============================================
  // Verificar si esta función se cruza con alguna existente en la misma sala y día
  // IMPORTANTE: El endTime de las funciones ya incluye el tiempo de limpieza,
  // por lo que una función puede empezar exactamente cuando termina otra (endTime = startTime)
  const scheduleEndTime = minutesToTime(endMinutes);
  const conflictingSchedule = existingSchedules.find((s) => {
    // Solo verificar funciones en la misma sala y día
    if (s.roomId !== schedule.roomId || s.date !== schedule.date) {
      return false;
    }
    const sStart = timeToMinutes(s.startTime);
    const sEnd = timeToMinutes(s.endTime);
    
    // Detectar empalme: la nueva función se cruza con una existente
    // Casos de empalme:
    // 1. La nueva función empieza durante una existente (antes de que termine)
    // 2. La nueva función termina durante una existente (después de que empiece)
    // 3. La nueva función envuelve completamente una existente
    // NOTA: Si startMinutes === sEnd, está permitido porque el endTime ya incluye limpieza
    // Si endMinutes === sStart, está permitido por la misma razón
    return (
      (startMinutes < sEnd && endMinutes > sStart)
    );
  });

  if (conflictingSchedule) {
    errors.push({
      message: `❌ REGLA 3: CONFLICTO DE HORARIO. La función se empalma con otra función existente en la misma sala. Función en conflicto: de ${conflictingSchedule.startTime} a ${conflictingSchedule.endTime}. Tu función propuesta: ${schedule.startTime} - ${scheduleEndTime}. Verifica los horarios disponibles en esta sala y elige un horario que no se cruce.`,
      field: "startTime",
    });
  }

  // ============================================
  // REGLA 4: SPECIAL - Solo viernes, sábado o domingo
  // ============================================
  if (movie.type === "SPECIAL") {
    const dayOfWeek = new Date(schedule.date).getDay();
    // getDay() retorna: 0=Domingo, 1=Lunes, ..., 5=Viernes, 6=Sábado
    if (dayOfWeek !== 5 && dayOfWeek !== 6 && dayOfWeek !== 0) {
      const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const selectedDay = dayNames[dayOfWeek];
      errors.push({
        message: `❌ REGLA 4: RESTRICCIÓN DE DÍA. Las películas de tipo SPECIAL solo pueden programarse los días: Viernes, Sábado o Domingo. El día seleccionado es ${selectedDay}. Por favor, selecciona un día válido.`,
        field: "date",
      });
    }
  }

  // ============================================
  // REGLA 5: PREMIERE - Validaciones especiales
  // ============================================
  if (movie.type === "PREMIERE") {
    // Obtener todas las funciones PREMIERE del mismo día
    const premiereSchedules = existingSchedules.filter(
      (s) => s.movieId === movie.id && s.date === schedule.date
    );
    
    // 5.1: Alta demanda (demandScore >= 70)
    if (movie.demandScore < 70) {
      errors.push({
        message: `❌ REGLA 5.1: DEMANDA INSUFICIENTE. Las películas PREMIERE requieren un demandScore mínimo de 70. La película "${movie.title}" tiene un demandScore de ${movie.demandScore}. Solo las películas con alta demanda pueden ser PREMIERE.`,
        field: "movieId",
      });
    }

    // 5.2: Primera función antes de las 14:00
    const allPremiereSchedules = [...premiereSchedules];
    if (allPremiereSchedules.length > 0) {
      allPremiereSchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    
    const currentStartMinutes = timeToMinutes(schedule.startTime);
    // Verificar si esta será la primera función del día
    const isFirstShow = allPremiereSchedules.length === 0 || 
      currentStartMinutes < timeToMinutes(allPremiereSchedules[0].startTime);
    
    if (isFirstShow && currentStartMinutes >= 14 * 60) {
      errors.push({
        message: `❌ REGLA 5.2: HORARIO DE PRIMERA FUNCIÓN. La primera función PREMIERE del día debe comenzar ANTES de las 14:00. Hora ingresada: ${schedule.startTime}. Por favor, programa la primera función entre 10:00 y 13:59.`,
        field: "startTime",
      });
    }

    // 5.3: Mínimo 2 funciones el día del estreno
    // NOTA: Esta validación se verifica al ELIMINAR funciones (en schedule/page.tsx),
    // no al agregar, para permitir agregar la primera función
  }

  // ============================================
  // REGLA 6: Películas largas (>150 min) no van en sala chica
  // ============================================
  if (movie.runtimeMin > 150 && room.size === "SMALL") {
    errors.push({
      message: `❌ REGLA 6: RESTRICCIÓN DE SALA. Las películas con duración mayor a 150 minutos NO pueden programarse en salas pequeñas (SMALL). La película "${movie.title}" tiene una duración de ${movie.runtimeMin} minutos. Por favor, selecciona una sala MEDIUM o LARGE.`,
      field: "roomId",
    });
  }

  return errors;
}

/**
 * Calcula la hora de fin de una función
 * 
 * @param startTime - Hora de inicio en formato HH:mm
 * @param runtimeMin - Duración de la película en minutos
 * @param roomSize - Tamaño de la sala (LARGE, MEDIUM, SMALL)
 * @returns Hora de fin en formato HH:mm
 */
export function calculateEndTime(startTime: string, runtimeMin: number, roomSize: string): string {
  const cleanupTime = roomSize === "LARGE" ? 20 : 15; // Tiempo de limpieza según sala
  const totalMinutes = runtimeMin + cleanupTime; // Duración total
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + totalMinutes;
  return minutesToTime(endMinutes);
}

/**
 * Convierte una hora en formato HH:mm a minutos desde medianoche
 * 
 * @param time - Hora en formato HH:mm (ej: "14:30")
 * @returns Minutos desde medianoche (ej: 870 para 14:30)
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convierte minutos desde medianoche a formato HH:mm
 * 
 * @param minutes - Minutos desde medianoche (ej: 870)
 * @returns Hora en formato HH:mm (ej: "14:30")
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Obtiene el nombre del día de la semana en español
 * 
 * @param date - Fecha en formato YYYY-MM-DD
 * @returns Nombre del día (ej: "Lunes", "Martes")
 */
export function getDayName(date: string): string {
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return days[new Date(date).getDay()];
}

/**
 * Obtiene las fechas de una semana completa (lunes a domingo) a partir de una fecha
 * 
 * @param startDate - Fecha de referencia (se ajusta al lunes de esa semana)
 * @returns Array de 7 fechas en formato YYYY-MM-DD, desde lunes hasta domingo
 */
export function getWeekDates(startDate: Date): string[] {
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  
  // Ajustar al lunes de la semana
  // getDay() retorna: 0=Domingo, 1=Lunes, ..., 6=Sábado
  const day = currentDate.getDay();
  // Calcular diferencia para llegar al lunes
  // Si es domingo (0), retroceder 6 días; si no, retroceder (day - 1) días
  const diff = currentDate.getDate() - day + 1;
  currentDate.setDate(diff);
  
  // Generar los 7 días de la semana
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() + i);
    dates.push(date.toISOString().split("T")[0]); // Formato YYYY-MM-DD
  }
  
  return dates;
}

