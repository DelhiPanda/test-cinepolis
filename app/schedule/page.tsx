"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Navigation } from "@/components/Navigation";
import { Schedule, Movie, Room } from "@/types";
import {
  validateSchedule,
  calculateEndTime,
  getDayName,
  getWeekDates,
  timeToMinutes,
} from "@/utils/scheduleValidation";
import { calculateDayStats, calculateRoomStats } from "@/utils/stats";

export default function SchedulePage() {
  const {
    movies,
    rooms,
    schedules,
    addSchedule,
    addSchedules,
    updateSchedule,
    deleteSchedule,
    deleteSchedules,
    getSchedulesByRoomAndDate,
  } = useApp();

  // Función para obtener el lunes de la semana actual
  const getCurrentWeekMonday = (): string => {
    const today = new Date();
    const monday = new Date(today);
    const day = monday.getDay();
    // Que el lunes sea el día 1
    const diff = monday.getDate() - day + 1;
    monday.setDate(diff);
    console.log(monday);
    // Usar formato local para evitar problemas de zona horaria
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, "0");
    const date = String(monday.getDate()).padStart(2, "0");
    console.log(`${year}-${month}-${date}`);
    return `${year}-${month}-${date}`;
  };

  const [selectedDate, setSelectedDate] = useState(() => getCurrentWeekMonday());

  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedMovie, setSelectedMovie] = useState<string>("");
  const [startTime, setStartTime] = useState("10:00");
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const weekDates = useMemo(() => getWeekDates(new Date(selectedDate)), [selectedDate]);

  const handleAddSchedule = () => {
    if (!selectedRoom || !selectedMovie || !selectedDate) {
      setErrors(["Por favor completa todos los campos"]);
      return;
    }

    const movie = movies.find((m) => m.id === selectedMovie);
    const room = rooms.find((r) => r.id === selectedRoom);

    if (!movie || !room) {
      setErrors(["Película o sala no encontrada"]);
      return;
    }

    const endTime = calculateEndTime(startTime, movie.runtimeMin, room.size);
    const newSchedule: Omit<Schedule, "id"> = {
      movieId: selectedMovie,
      roomId: selectedRoom,
      startTime,
      date: selectedDate,
      endTime,
    };

    // Obtener funciones existentes para validación (excluir la que se está editando)
    const existingSchedules = editingSchedule
      ? schedules.filter((s) => s.id !== editingSchedule.id)
      : schedules;

    const validationErrors = validateSchedule(
      newSchedule,
      movie,
      room,
      existingSchedules
    );

    if (validationErrors.length > 0) {
      setErrors(validationErrors.map((e) => e.message));
      return;
    }

    // Advertencia para PREMIERE: verificar si es la primera función del día
    if (movie.type === "PREMIERE" && !editingSchedule) {
      const premiereSchedulesOnDate = existingSchedules.filter(
        (s) => s.movieId === selectedMovie && s.date === selectedDate
      );
      if (premiereSchedulesOnDate.length === 0) {
        // Es la primera función, mostrar advertencia pero permitir agregar
        const shouldContinue = confirm(
          "Esta es la primera función PREMIERE del día. Recuerda que necesitas programar al menos 2 funciones el día del estreno. ¿Deseas continuar?"
        );
        if (!shouldContinue) {
          return;
        }
      }
    }

    if (editingSchedule) {
      updateSchedule(editingSchedule.id, newSchedule);
      setEditingSchedule(null);
    } else {
      const schedule: Schedule = {
        ...newSchedule,
        id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      addSchedule(schedule);
    }

    // Reset form
    setSelectedMovie("");
    setStartTime("10:00");
    setErrors([]);
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setSelectedDate(schedule.date);
    setSelectedRoom(schedule.roomId);
    setSelectedMovie(schedule.movieId);
    setStartTime(schedule.startTime);
    setErrors([]);
  };

  const handleCancelEdit = () => {
    setEditingSchedule(null);
    setSelectedMovie("");
    setStartTime("10:00");
    setErrors([]);
  };

  const handleDelete = (id: string) => {
    const scheduleToDelete = schedules.find((s) => s.id === id);
    if (!scheduleToDelete) return;

    const movie = movies.find((m) => m.id === scheduleToDelete.movieId);
    
    // Validar PREMIERE: mínimo 2 funciones el día del estreno
    if (movie?.type === "PREMIERE") {
      const premiereSchedulesOnDate = schedules.filter(
        (s) => s.movieId === scheduleToDelete.movieId && s.date === scheduleToDelete.date
      );
      
      if (premiereSchedulesOnDate.length <= 2) {
        setErrors([
          "❌ REGLA 5.3: MÍNIMO DE FUNCIONES PREMIERE. No se puede eliminar esta función porque las películas PREMIERE deben tener MÍNIMO 2 funciones el día del estreno. Actualmente hay " + premiereSchedulesOnDate.length + " función(es) programada(s). Debes mantener al menos 2 funciones para cumplir con la regla de PREMIERE.",
        ]);
        setTimeout(() => setErrors([]), 5000);
        return;
      }
    }

    if (confirm("¿Estás seguro de eliminar esta función?")) {
      deleteSchedule(id);
    }
  };

  const dayStats = useMemo(() => {
    return weekDates.map((date) => calculateDayStats(date, schedules, rooms));
  }, [weekDates, schedules, rooms]);

  const changeWeek = (direction: "prev" | "next") => {
    // Parsear la fecha actual (formato YYYY-MM-DD)
    const [year, month, day] = selectedDate.split("-").map(Number);
    const currentDate = new Date(year, month - 1, day); // month - 1 porque Date usa 0-indexed months
    
    // Agregar o restar 7 días
    const daysToAdd = direction === "next" ? 7 : -7;
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    
    // Asegurar que siempre sea lunes
    const dayOfWeek = currentDate.getDay();
    const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    currentDate.setDate(diff);
    
    // Usar formato local para evitar problemas de zona horaria
    const newYear = currentDate.getFullYear();
    const newMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
    const newDay = String(currentDate.getDate()).padStart(2, "0");
    setSelectedDate(`${newYear}-${newMonth}-${newDay}`);
  };

  const goToCurrentWeek = () => {
    setSelectedDate(getCurrentWeekMonday());
  };

  // Función para generar una hora aleatoria entre 10:00 y 23:59
  const generateRandomTime = (): string => {
    const minHour = 10;
    const maxHour = 23;
    const hour = Math.floor(Math.random() * (maxHour - minHour + 1)) + minHour;
    // Para la hora 23, solo permitir hasta 59 minutos, para otras horas usar intervalos de 15 min
    const minute = hour === 23 
      ? Math.floor(Math.random() * 60) 
      : Math.floor(Math.random() * 4) * 15; // Intervalos de 15 min (0, 15, 30, 45)
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  // Función para limpiar toda la semana
  const handleClearWeek = () => {
    const weekSchedules = schedules.filter((s) => weekDates.includes(s.date));
    if (weekSchedules.length === 0) {
      alert("No hay funciones programadas en esta semana para eliminar.");
      return;
    }
    
    if (confirm(`¿Estás seguro de eliminar todas las ${weekSchedules.length} función(es) de esta semana?`)) {
      // Eliminar todas las funciones de la semana de una vez usando la función batch
      const weekScheduleIds = weekSchedules.map(s => s.id);
      deleteSchedules(weekScheduleIds);
      setErrors([]);
    }
  };

  // Función para generar funciones aleatorias
  const handleGenerateRandom = () => {
    if (!confirm("¿Deseas generar funciones aleatorias para toda la semana? Esto agregará funciones cumpliendo todas las reglas de programación.")) {
      return;
    }

    const newSchedules: Schedule[] = [];
    const maxAttempts = 1000; // Límite de intentos para evitar loops infinitos
    let totalAttempts = 0;

    // Filtrar películas válidas por día
    const getValidMoviesForDay = (date: string): Movie[] => {
      const dayOfWeek = new Date(date).getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6; // Viernes, Sábado, Domingo

      return movies.filter((movie) => {
        // SPECIAL solo en viernes, sábado o domingo
        if (movie.type === "SPECIAL" && !isWeekend) {
          return false;
        }
        return true;
      });
    };

    // Generar funciones para cada día
    for (const date of weekDates) {
      const validMovies = getValidMoviesForDay(date);
      if (validMovies.length === 0) continue;

      // Para cada sala
      for (const room of rooms) {
        // Obtener funciones existentes de esta sala en este día (ordenadas)
        const existingRoomSchedules = [...schedules, ...newSchedules]
          .filter((s) => s.roomId === room.id && s.date === date)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        // Intentar agregar 2-4 funciones por sala por día
        const numShows = Math.floor(Math.random() * 3) + 2; // 2-4 funciones
        
        for (let i = 0; i < numShows && totalAttempts < maxAttempts; i++) {
          totalAttempts++;
          
          // Seleccionar película aleatoria válida para esta sala
          const validMoviesForRoom = validMovies.filter((movie) => {
            // Películas largas no van en salas pequeñas
            if (movie.runtimeMin > 150 && room.size === "SMALL") {
              return false;
            }
            return true;
          });

          if (validMoviesForRoom.length === 0) continue;

          const movie = validMoviesForRoom[Math.floor(Math.random() * validMoviesForRoom.length)];
          
          // Calcular tiempo de limpieza para esta sala
          const cleanupTime = room.size === "LARGE" ? 20 : 15;
          const movieDuration = movie.runtimeMin + cleanupTime;
          
          // Encontrar un horario válido considerando las funciones existentes
          let startTime = "";
          let attempts = 0;
          let valid = false;

          // Intentar encontrar un horario válido
          while (!valid && attempts < 100) {
            attempts++;
            
            // Si hay funciones existentes, intentar encontrar un espacio entre ellas
            if (existingRoomSchedules.length > 0) {
              // Generar hora aleatoria
              startTime = generateRandomTime();
              const [hours, minutes] = startTime.split(":").map(Number);
              const startMinutes = hours * 60 + minutes;
              
              // Verificar si hay espacio disponible en algún punto
              let foundSlot = false;
              
              // Verificar si puede ir antes de la primera función
              const firstStart = timeToMinutes(existingRoomSchedules[0].startTime);
              if (startMinutes + movieDuration <= firstStart && startMinutes >= 10 * 60) {
                foundSlot = true;
              }
              
              // Verificar espacios entre funciones
              for (let j = 0; j < existingRoomSchedules.length - 1; j++) {
                const currentEnd = timeToMinutes(existingRoomSchedules[j].endTime);
                const nextStart = timeToMinutes(existingRoomSchedules[j + 1].startTime);
                
                if (startMinutes >= currentEnd && startMinutes + movieDuration <= nextStart) {
                  foundSlot = true;
                  break;
                }
              }
              
              // Verificar si puede ir después de la última función
              if (!foundSlot && existingRoomSchedules.length > 0) {
                const lastEnd = timeToMinutes(existingRoomSchedules[existingRoomSchedules.length - 1].endTime);
                if (startMinutes >= lastEnd && startMinutes + movieDuration <= 23 * 60 + 59) {
                  foundSlot = true;
                }
              }
              
              if (!foundSlot) {
                // Intentar otra hora
                continue;
              }
            } else {
              // No hay funciones existentes, cualquier hora válida funciona
              startTime = generateRandomTime();
            }

            // Crear función temporal para validar
            const tempSchedule: Omit<Schedule, "id" | "endTime"> = {
              movieId: movie.id,
              roomId: room.id,
              startTime,
              date,
            };

            // Validar con las funciones ya generadas + las existentes
            const allExistingSchedules = [...schedules, ...newSchedules];
            const validationErrors = validateSchedule(
              tempSchedule,
              movie,
              room,
              allExistingSchedules
            );

            if (validationErrors.length === 0) {
              // Verificar regla especial de PREMIERE: primera función antes de las 14:00
              if (movie.type === "PREMIERE") {
                const premiereSchedules = allExistingSchedules.filter(
                  (s) => s.movieId === movie.id && s.date === date
                );
                
                if (premiereSchedules.length === 0) {
                  // Es la primera función, debe ser antes de las 14:00
                  const [hours] = startTime.split(":").map(Number);
                  if (hours >= 14) {
                    // Forzar hora antes de las 14:00
                    const hour = Math.floor(Math.random() * 4) + 10; // 10-13
                    const minute = Math.floor(Math.random() * 4) * 15;
                    startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
                    
                    // Re-validar con la nueva hora
                    const newTempSchedule: Omit<Schedule, "id" | "endTime"> = {
                      movieId: movie.id,
                      roomId: room.id,
                      startTime,
                      date,
                    };
                    const reValidationErrors = validateSchedule(
                      newTempSchedule,
                      movie,
                      room,
                      allExistingSchedules
                    );
                    if (reValidationErrors.length > 0) {
                      continue; // Intentar otra vez
                    }
                  }
                }
              }

              const endTime = calculateEndTime(startTime, movie.runtimeMin, room.size);
              const newSchedule: Schedule = {
                ...tempSchedule,
                id: `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                endTime,
              };

              newSchedules.push(newSchedule);
              // Actualizar la lista de funciones existentes para la próxima iteración
              existingRoomSchedules.push(newSchedule);
              existingRoomSchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
              valid = true;
            }
          }
        }
      }

      // Asegurar mínimo 2 funciones para PREMIERE el día del estreno
      const premiereMovies = validMovies.filter((m) => m.type === "PREMIERE");
      for (const premiereMovie of premiereMovies) {
        const premiereSchedules = [...schedules, ...newSchedules].filter(
          (s) => s.movieId === premiereMovie.id && s.date === date
        );

        if (premiereSchedules.length < 2) {
          // Intentar agregar más funciones PREMIERE
          const validRooms = rooms.filter((room) => {
            if (premiereMovie.runtimeMin > 150 && room.size === "SMALL") {
              return false;
            }
            return true;
          });

          for (let i = premiereSchedules.length; i < 2 && totalAttempts < maxAttempts; i++) {
            totalAttempts++;
            const room = validRooms[Math.floor(Math.random() * validRooms.length)];
            
            // Primera función antes de las 14:00
            const isFirst = i === 0;
            let startTime: string;
            
            if (isFirst) {
              const hour = Math.floor(Math.random() * 4) + 10; // 10-13
              const minute = Math.floor(Math.random() * 4) * 15;
              startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
            } else {
              startTime = generateRandomTime();
            }

            const tempSchedule: Omit<Schedule, "id" | "endTime"> = {
              movieId: premiereMovie.id,
              roomId: room.id,
              startTime,
              date,
            };

            const existingSchedules = [...schedules, ...newSchedules];
            const validationErrors = validateSchedule(
              tempSchedule,
              premiereMovie,
              room,
              existingSchedules
            );

            if (validationErrors.length === 0) {
              const endTime = calculateEndTime(startTime, premiereMovie.runtimeMin, room.size);
              const newSchedule: Schedule = {
                ...tempSchedule,
                id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                endTime,
              };
              newSchedules.push(newSchedule);
            }
          }
        }
      }
    }

    // Agregar todas las funciones generadas de una vez usando la función batch
    if (newSchedules.length > 0) {
      addSchedules(newSchedules);
      alert(`Se generaron ${newSchedules.length} función(es) aleatorias cumpliendo todas las reglas.`);
      setErrors([]);
    } else {
      alert("No se pudieron generar funciones aleatorias. Puede que no haya espacio disponible o las reglas sean muy restrictivas.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center flex-col mb-8">
          <h1 className="text-4xl mb-4 text-center font-bold text-gray-900 dark:text-white">
            Planificador de Funciones
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => changeWeek("prev")}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              ← Semana anterior
            </button>
            <div className="flex flex-col items-center gap-1">
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {new Date(weekDates[0]).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                })}{" "}
                -{" "}
                {new Date(weekDates[6]).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="text-sm text-cinepolis-blue dark:text-cinepolis-yellow font-semibold">
                {(() => {
                  const mondayOfWeek = new Date(weekDates[0]);
                  const month = mondayOfWeek.getMonth();
                  const year = mondayOfWeek.getFullYear();
                  
                  // Encontrar el primer lunes del mes
                  const firstDayOfMonth = new Date(year, month, 1);
                  const dayOfWeek = firstDayOfMonth.getDay();
                  // Si el primer día es domingo (0), el primer lunes es el día 2
                  // Si es lunes (1), el primer lunes es el día 1
                  // Si es otro día, calcular cuántos días faltan para el lunes
                  const daysToFirstMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
                  const firstMonday = new Date(year, month, 1 + daysToFirstMonday);
                  
                  // Calcular la diferencia en días y convertir a semanas
                  const diffTime = mondayOfWeek.getTime() - firstMonday.getTime();
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                  const weekNumber = Math.floor(diffDays / 7) + 1;
                  
                  const monthName = mondayOfWeek.toLocaleDateString("es-ES", { month: "long" });
                  return `Semana ${weekNumber} de ${monthName}`;
                })()}
              </span>
            </div>
            <button
              onClick={() => changeWeek("next")}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Semana siguiente →
            </button>
            <button
              onClick={goToCurrentWeek}
              className="px-4 py-2 bg-cinepolis-blue text-white rounded-lg hover:bg-cinepolis-blue-dark transition-colors font-semibold"
            >
              Semana Actual
            </button>
          </div>
        </div>

        {/* Botones de acciones rápidas */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleGenerateRandom}
            className="px-6 py-3 bg-cinepolis-yellow text-cinepolis-blue rounded-lg hover:bg-cinepolis-yellow-dark transition-colors font-semibold shadow-md flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Generar Funciones Aleatorias
          </button>
          <button
            onClick={handleClearWeek}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold shadow-md flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Limpiar Toda la Semana
          </button>
        </div>

        {/* Reglas de Programación */}
        <div className="bg-cinepolis-yellow/10 border-l-4 border-cinepolis-yellow rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-cinepolis-blue">📋</span>
            <span>Reglas de Programación</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold text-cinepolis-blue mb-2">REGLA 1: Horarios Válidos</h3>
              <p className="text-gray-700 dark:text-gray-300">Las funciones solo pueden programarse entre las <strong>10:00 y 23:59</strong>.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold text-cinepolis-blue mb-2">REGLA 2: Tiempo de Limpieza</h3>
              <p className="text-gray-700 dark:text-gray-300">Salas <strong>LARGE</strong>: 20 min | Salas <strong>MEDIUM/SMALL</strong>: 15 min. La función debe terminar antes de las 23:59.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold text-cinepolis-blue mb-2">REGLA 3: No Empalmes</h3>
              <p className="text-gray-700 dark:text-gray-300">No pueden cruzarse funciones en la misma sala. Verifica que no haya conflictos de horario.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold text-cinepolis-blue mb-2">REGLA 4: Películas SPECIAL</h3>
              <p className="text-gray-700 dark:text-gray-300">Solo pueden programarse los días: <strong>Viernes, Sábado o Domingo</strong>.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold text-cinepolis-blue mb-2">REGLA 5: Películas PREMIERE</h3>
              <p className="text-gray-700 dark:text-gray-300">
                • Requieren <strong>demandScore ≥ 70</strong><br/>
                • Primera función debe ser <strong>antes de las 14:00</strong><br/>
                • Mínimo <strong>2 funciones</strong> el día del estreno
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold text-cinepolis-blue mb-2">REGLA 6: Películas Largas</h3>
              <p className="text-gray-700 dark:text-gray-300">Películas de más de <strong>150 minutos</strong> NO pueden ir en salas <strong>SMALL</strong>. Usa salas MEDIUM o LARGE.</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            {editingSchedule ? "Editar Función" : "Nueva Función"}
          </h2>

          {errors.length > 0 && (
            <div className="mb-4 p-5 bg-red-50 dark:bg-red-900/30 border-2 border-red-500 text-red-800 dark:text-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⚠️</span>
                <h3 className="font-bold text-lg">Errores de Validación</h3>
              </div>
              <p className="mb-3 text-sm font-semibold">No se puede crear la función. Por favor, corrige los siguientes errores:</p>
              <ul className="space-y-2 list-none">
                {errors.map((error, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2 bg-white dark:bg-red-900/50 rounded">
                    <span className="text-red-500 mt-1">•</span>
                    <span className="flex-1 whitespace-pre-line">{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Día
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cinepolis-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {weekDates.map((date) => (
                  <option key={date} value={date}>
                    {getDayName(date)} - {new Date(date).toLocaleDateString("es-ES")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sala
              </label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cinepolis-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Seleccionar sala</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.size}) - {room.seats} asientos
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Película
              </label>
              <select
                value={selectedMovie}
                onChange={(e) => setSelectedMovie(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cinepolis-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Seleccionar película</option>
                {movies.map((movie) => {
                  const typeLabel = movie.type === "REGULAR" ? "Regular" : movie.type === "SPECIAL" ? "Especial" : "Premiere";
                  return (
                    <option key={movie.id} value={movie.id}>
                      {movie.title} - {typeLabel} - {movie.rating} ({movie.runtimeMin} min)
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de inicio
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                min="10:00"
                max="23:59"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cinepolis-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {selectedMovie && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-cinepolis-blue rounded-lg">
              {(() => {
                const movie = movies.find((m) => m.id === selectedMovie);
                if (!movie) return null;
                
                const typeLabel = movie.type === "REGULAR" ? "Regular" : movie.type === "SPECIAL" ? "Especial" : "Premiere";
                const typeColor = movie.type === "REGULAR" ? "bg-gray-500" : movie.type === "SPECIAL" ? "bg-purple-500" : "bg-cinepolis-yellow text-cinepolis-blue";
                const ratingLabel = movie.rating === "A" ? "Para todo público" : movie.rating === "B" ? "Mayores de 12 años" : movie.rating === "B15" ? "Mayores de 15 años" : "Mayores de 18 años";
                
                return (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                      Información de la Película
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Título:</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{movie.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Duración:</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{movie.runtimeMin} minutos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo:</span>
                        <span className={`text-xs px-2 py-1 rounded-full text-white font-semibold ${typeColor}`}>
                          {typeLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Clasificación:</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {movie.rating} - {ratingLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Demanda:</span>
                        <span className={`text-sm font-semibold ${movie.demandScore >= 70 ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"}`}>
                          {movie.demandScore}/100
                        </span>
                      </div>
                    </div>
                    {movie.type === "SPECIAL" && (
                      <div className="mt-2 p-2 bg-purple-100 dark:bg-purple-900/30 rounded text-sm text-purple-800 dark:text-purple-200">
                        ⚠️ <strong>Recordatorio:</strong> Las películas SPECIAL solo pueden programarse los días Viernes, Sábado o Domingo.
                      </div>
                    )}
                    {movie.type === "PREMIERE" && (
                      <div className="mt-2 p-2 bg-cinepolis-yellow/20 dark:bg-cinepolis-yellow/10 rounded text-sm text-gray-800 dark:text-gray-200">
                        ⚠️ <strong>Recordatorio:</strong> Las películas PREMIERE requieren mínimo 2 funciones el día del estreno y la primera función debe ser antes de las 14:00.
                      </div>
                    )}
                    {selectedRoom && (
                      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Hora de fin estimada:</strong>{" "}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {(() => {
                              const room = rooms.find((r) => r.id === selectedRoom);
                              if (room) {
                                return calculateEndTime(
                                  startTime,
                                  movie.runtimeMin,
                                  room.size
                                );
                              }
                              return "-";
                            })()}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleAddSchedule}
              className="px-6 py-2 bg-cinepolis-blue text-white rounded-lg hover:bg-cinepolis-blue-dark transition-colors font-semibold"
            >
              {editingSchedule ? "Actualizar" : "Agregar"} Función
            </button>
            {editingSchedule && (
              <button
                onClick={handleCancelEdit}
                className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Vista por día */}
        <div className="space-y-6">
          {weekDates.map((date) => {
            const daySchedules = schedules
              .filter((s) => s.date === date)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            const stats = dayStats.find((s) => s.date === date);

            return (
              <div
                key={date}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getDayName(date)} - {new Date(date).toLocaleDateString("es-ES")}
                  </h2>
                  {stats && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Uso: {stats.usagePercentage}% | Funciones: {stats.scheduledShows} |
                      Tiempo muerto: {stats.totalDeadTime} min
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {rooms.map((room) => {
                    const roomSchedules = getSchedulesByRoomAndDate(room.id, date);
                    const roomStats = calculateRoomStats(
                      room.id,
                      room.name,
                      date,
                      schedules
                    );

                    return (
                      <div
                        key={room.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                      >
                        <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                          {room.name} ({room.size})
                        </h3> 
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Uso: {roomStats.usagePercentage}% | Tiempo muerto:{" "}
                          {roomStats.totalDeadTime} min
                        </p>

                        <div className="space-y-2">
                          {roomSchedules.length > 0 ? (
                            roomSchedules.map((schedule) => {
                              const movie = movies.find(
                                (m) => m.id === schedule.movieId
                              );
                              if (!movie) return null;
                              
                              const typeLabel = movie.type === "REGULAR" ? "Regular" : movie.type === "SPECIAL" ? "Especial" : "Premiere";
                              const typeColor = movie.type === "REGULAR" ? "bg-gray-500" : movie.type === "SPECIAL" ? "bg-purple-500" : "bg-cinepolis-yellow text-cinepolis-blue";
                              
                              return (
                                <div
                                  key={schedule.id}
                                  className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900 dark:text-white">
                                        {movie.title}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full text-white font-semibold ${typeColor}`}>
                                          {typeLabel}
                                        </span>
                                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                          {movie.rating}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-500">
                                          • {movie.runtimeMin} min
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {schedule.startTime} - {schedule.endTime}
                                    </p>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleEdit(schedule)}
                                        className="px-3 py-1 bg-cinepolis-blue text-white text-sm rounded hover:bg-cinepolis-blue-dark font-semibold transition-colors"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        onClick={() => handleDelete(schedule.id)}
                                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 font-semibold transition-colors"
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                              Sin funciones programadas
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

