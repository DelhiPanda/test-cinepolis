"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { MovieCard } from "@/components/MovieCard";
import { MovieFilters } from "@/components/MovieFilters";
import { Navigation } from "@/components/Navigation";
import { MovieType, Rating } from "@/types";
import { calculateDayStats } from "@/utils/stats";
import { getWeekDates } from "@/utils/scheduleValidation";

export default function Dashboard() {
  const { movies, schedules, rooms } = useApp();
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState<MovieType | "ALL">("ALL");
  const [selectedRating, setSelectedRating] = useState<Rating | "ALL">("ALL");
  const [minDemand, setMinDemand] = useState(0);

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesSearch =
        movie.title.toLowerCase().includes(searchText.toLowerCase());
      const matchesType = selectedType === "ALL" || movie.type === selectedType;
      const matchesRating =
        selectedRating === "ALL" || movie.rating === selectedRating;
      const matchesDemand = movie.demandScore >= minDemand;

      return matchesSearch && matchesType && matchesRating && matchesDemand;
    });
  }, [movies, searchText, selectedType, selectedRating, minDemand]);

  // Obtener próximas funciones (desde día y hora actual)
  const weekDates = getWeekDates(new Date());
  const upcomingSchedules = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    
    return schedules
      .filter((s) => {
        // Si es un día futuro, incluir todas las funciones
        if (s.date > today) {
          return true;
        }
        // Si es el día actual, solo incluir funciones que empiecen después de la hora actual
        if (s.date === today) {
          return s.startTime >= currentTime;
        }
        // Excluir funciones de días pasados
        return false;
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      })
      .slice(0, 10);
  }, [schedules, weekDates]);

  const stats = useMemo(() => {
    return weekDates.map((date) => calculateDayStats(date, schedules, rooms));
  }, [weekDates, schedules, rooms]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div
        className="relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://picsum.photos/1920/600?random=100')",
          minHeight: "450px",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cinepolis-blue/90 via-cinepolis-blue/70 to-cinepolis-blue/90"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Dashboard de Películas
            </h1>
            <p className="text-2xl text-white/90 mb-6 drop-shadow-md">
              Gestiona tu catálogo y visualiza las próximas funciones
            </p>
            <div className="flex gap-4">
              <div className="bg-cinepolis-yellow/20 backdrop-blur-sm border border-cinepolis-yellow/30 rounded-lg px-6 py-3">
                <p className="text-white font-semibold">
                  <span className="text-cinepolis-yellow">{movies.length}</span> Películas en cartelera
                </p>
              </div>
              <div className="bg-cinepolis-yellow/20 backdrop-blur-sm border border-cinepolis-yellow/30 rounded-lg px-6 py-3">
                <p className="text-white font-semibold">
                  <span className="text-cinepolis-yellow">{schedules.length}</span> Funciones programadas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <MovieFilters
          searchText={searchText}
          onSearchChange={setSearchText}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedRating={selectedRating}
          onRatingChange={setSelectedRating}
          minDemand={minDemand}
          onMinDemandChange={setMinDemand}
        />

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Catálogo de Películas ({filteredMovies.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Próximas Funciones
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            {upcomingSchedules.length > 0 ? (
              <div className="space-y-4">
                {upcomingSchedules.map((schedule) => {
                  const movie = movies.find((m) => m.id === schedule.movieId);
                  const room = rooms.find((r) => r.id === schedule.roomId);
                  if (!movie || !room) return null;
                  return (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-cinepolis-blue hover:shadow-md transition-shadow"
                    >
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                          {movie.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-semibold text-cinepolis-blue">{room.name}</span> • {schedule.date} • <span className="font-semibold">{schedule.startTime} - {schedule.endTime}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                No hay funciones programadas para los próximos días
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Resumen Semanal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.filter((stat) => {
              // Filtrar días pasados
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const statDate = new Date(stat.date);
              statDate.setHours(0, 0, 0, 0);
              return statDate >= today;
            }).map((stat) => {
              // Obtener todas las funciones de este día
              const daySchedules = schedules
                .filter((s) => s.date === stat.date)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              
              return (
                <div
                  key={stat.date}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-t-4 border-cinepolis-blue hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">
                    {new Date(stat.date).toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h3>
                  <div className="space-y-2 text-sm mb-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      Uso: <span className="font-bold text-cinepolis-blue text-base">{stat.usagePercentage}%</span>
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Tiempo muerto: <span className="font-bold">{stat.totalDeadTime} min</span>
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Funciones: <span className="font-bold text-cinepolis-blue">{stat.scheduledShows}</span>
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Capacidad estimada: <span className="font-bold">{stat.estimatedCapacity}</span>
                    </p>
                  </div>
                  
                  {/* Lista de horarios del día */}
                  {daySchedules.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                        Horarios del día:
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {daySchedules.map((schedule) => {
                          const movie = movies.find((m) => m.id === schedule.movieId);
                          const room = rooms.find((r) => r.id === schedule.roomId);
                          if (!movie || !room) return null;
                          
                          return (
                            <div
                              key={schedule.id}
                              className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs"
                            >
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {movie.title}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400">
                                <span className="text-cinepolis-blue font-medium">{room.name}</span> • {schedule.startTime} - {schedule.endTime}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
