import Link from "next/link";
import { Movie } from "@/types";

interface MovieCardProps {
  movie: Movie;
}

export function MovieCard({ movie }: MovieCardProps) {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "A":
        return "bg-green-500";
      case "B":
        return "bg-yellow-500";
      case "B15":
        return "bg-orange-500";
      case "C":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "PREMIERE":
        return "bg-cinepolis-yellow text-cinepolis-blue";
      case "SPECIAL":
        return "bg-cinepolis-blue";
      default:
        return "bg-gray-500";
    }
  };

  // Mapeo de imágenes para cada película
  const getMovieImage = (movieId: string, title: string) => {
    const images: Record<string, string> = {
      m1: "https://picsum.photos/400/600?random=1",
      m2: "https://picsum.photos/400/600?random=2", 
      m3: "https://picsum.photos/400/600?random=3",
      m4: "https://picsum.photos/400/600?random=4",
      m5: "https://picsum.photos/400/600?random=5",
    };
    return images[movieId] || `https://via.placeholder.com/400x600/cccccc/666666?text=${encodeURIComponent(title)}`;
  };

  return (
    <Link href={`/movie/${movie.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105">
        <div className="h-64 relative overflow-hidden">
          <img
            src={getMovieImage(movie.id, movie.title)}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white mb-2 drop-shadow-lg">
              {movie.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-1 rounded text-xs text-white font-semibold ${getRatingColor(movie.rating)}`}>
                {movie.rating}
              </span>
              <span className={`px-2 py-1 rounded text-xs text-white font-semibold ${getTypeColor(movie.type)}`}>
                {movie.type}
              </span>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p className="flex items-center gap-2">
              <span className="font-semibold">Duración:</span>
              <span>{movie.runtimeMin} min</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold">Demanda:</span>
              <span className="text-cinepolis-blue font-bold">{movie.demandScore}/100</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

