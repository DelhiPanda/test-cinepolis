"use client";

import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Navigation } from "@/components/Navigation";
import { getDayName } from "@/utils/scheduleValidation";

export default function MovieDetail() {
  const params = useParams();
  const router = useRouter();
  const { movies, rooms, getSchedulesByMovie } = useApp();
  const movieId = params.id as string;

  const movie = movies.find((m) => m.id === movieId);

  if (!movie) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-gray-600 dark:text-gray-400">Película no encontrada</p>
        </div>
      </div>
    );
  }

  const schedules = getSchedulesByMovie(movieId);
  const schedulesByDate = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.date]) {
      acc[schedule.date] = [];
    }
    acc[schedule.date].push(schedule);
    return acc;
  }, {} as Record<string, typeof schedules>);

  // Imagen de fondo del header
  const getMovieImage = (movieId: string, title: string) => {
    const images: Record<string, string> = {
      m1: "https://picsum.photos/1920/600?random=10",
      m2: "https://picsum.photos/1920/600?random=20",
      m3: "https://picsum.photos/1920/600?random=30",
      m4: "https://picsum.photos/1920/600?random=40",
      m5: "https://picsum.photos/1920/600?random=50",
    };
    return images[movieId] || `https://via.placeholder.com/1920x600/cccccc/666666?text=${encodeURIComponent(title)}`;
  };

  const trailerUrl = movie.trailerUrl || `https://www.youtube.com/embed/jB0a8ycfS8M`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-4 px-4 py-2 bg-cinepolis-blue text-white rounded-lg hover:bg-cinepolis-blue-dark transition-colors font-semibold flex items-center gap-2"
        >
          ← Volver
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div
            className="h-96 relative flex items-center justify-center"
            style={{
              backgroundImage: `url('${getMovieImage(movie.id, movie.title)}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cinepolis-blue/90 via-cinepolis-blue/80 to-cinepolis-blue/90"></div>
            <div className="relative z-10 text-center px-4">
              <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-2xl">
                {movie.title}
              </h1>
              <div className="flex items-center justify-center gap-4">
                <span
                  className={`px-4 py-2 rounded-lg text-white font-semibold ${
                    movie.rating === "A"
                      ? "bg-green-500"
                      : movie.rating === "B"
                      ? "bg-yellow-500"
                      : movie.rating === "B15"
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                >
                  {movie.rating}
                </span>
                <span
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    movie.type === "PREMIERE"
                      ? "bg-cinepolis-yellow text-cinepolis-blue"
                      : movie.type === "SPECIAL"
                      ? "bg-cinepolis-blue text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {movie.type}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  Información
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Duración:
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {movie.runtimeMin} minutos
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Clasificación:
                    </span>
                    <span
                      className={`px-3 py-1 rounded text-sm text-white ${
                        movie.rating === "A"
                          ? "bg-green-500"
                          : movie.rating === "B"
                          ? "bg-yellow-500"
                          : movie.rating === "B15"
                          ? "bg-orange-500"
                          : "bg-red-500"
                      }`}
                    >
                      {movie.rating}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Tipo:
                    </span>
                    <span
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        movie.type === "PREMIERE"
                          ? "bg-cinepolis-yellow text-cinepolis-blue"
                          : movie.type === "SPECIAL"
                          ? "bg-cinepolis-blue text-white"
                          : "bg-gray-500 text-white"
                      }`}
                    >
                      {movie.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Puntuación de Demanda:
                    </span>
                    <span className="text-cinepolis-blue font-bold text-lg">
                      {movie.demandScore}/100
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  Trailer
                </h2>
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={trailerUrl}
                    title={`Trailer de ${movie.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="border-0"
                  ></iframe>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Horarios y Salas
              </h2>
              {Object.keys(schedulesByDate).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(schedulesByDate)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, dateSchedules]) => (
                      <div
                        key={date}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6"
                      >
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                          {getDayName(date)} - {new Date(date).toLocaleDateString("es-ES")}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {dateSchedules
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((schedule) => {
                              const room = rooms.find((r) => r.id === schedule.roomId);
                              return (
                                <div
                                  key={schedule.id}
                                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-cinepolis-blue hover:shadow-lg transition-shadow"
                                >
                                  <p className="font-semibold text-gray-900 dark:text-white mb-1">
                                    {room?.name}
                                  </p>
                                  <p className="text-cinepolis-blue font-bold text-lg mb-1">
                                    {schedule.startTime} - {schedule.endTime}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-500">
                                    {room?.seats} asientos
                                  </p>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  No hay funciones programadas para esta película
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

