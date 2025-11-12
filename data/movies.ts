/**
 * Datos de Películas en Cartelera
 * 
 * Este archivo contiene el catálogo de películas disponibles en el sistema.
 * En una aplicación real, estos datos vendrían de una API o base de datos.
 * 
 * NOTA: Los trailers son URLs genéricas de YouTube para demostración.
 * En producción, se usarían los trailers reales de cada película.
 */

import { Movie } from "@/types";

/**
 * Catálogo de películas disponibles
 * 
 * Cada película tiene:
 * - id: Identificador único
 * - title: Título de la película
 * - runtimeMin: Duración en minutos
 * - rating: Clasificación de edad (A, B, B15, C)
 * - type: Tipo de película (REGULAR, SPECIAL, PREMIERE)
 * - demandScore: Puntuación de demanda (0-100)
 * - trailerUrl: URL del trailer en YouTube (opcional)
 */
export const movies: Movie[] = [
  { 
    id: "m1", 
    title: "Medianoche", 
    runtimeMin: 105, 
    rating: "B15", 
    type: "REGULAR",
    demandScore: 62,
    trailerUrl: "https://www.youtube.com/embed/7wWEvqjsvxE"
  },
  { 
    id: "m2", 
    title: "Zombies vs Robots", 
    runtimeMin: 128, 
    rating: "A", 
    type: "SPECIAL", 
    demandScore: 75,
    trailerUrl: "https://www.youtube.com/embed/8Qn_spdM5Zg"
  },
  { 
    id: "m3", 
    title: "Avenida 28", 
    runtimeMin: 142, 
    rating: "B", 
    type: "PREMIERE", 
    demandScore: 81,
    trailerUrl: "https://www.youtube.com/embed/0WWzgGyAH6Y"
  },
  { 
    id: "m4", 
    title: "Sombras del Norte", 
    runtimeMin: 156, 
    rating: "C", 
    type: "REGULAR", 
    demandScore: 55,
    trailerUrl: "https://www.youtube.com/embed/zHhR3daI3bY"
  },
  { 
    id: "m5", 
    title: "El regreso", 
    runtimeMin: 98, 
    rating: "A", 
    type: "REGULAR", 
    demandScore: 34,
    trailerUrl: "https://www.youtube.com/embed/AzBSsKqvXdI"
  },
];

