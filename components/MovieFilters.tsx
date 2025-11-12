"use client";

import { MovieType, Rating } from "@/types";

interface MovieFiltersProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  selectedType: MovieType | "ALL";
  onTypeChange: (type: MovieType | "ALL") => void;
  selectedRating: Rating | "ALL";
  onRatingChange: (rating: Rating | "ALL") => void;
  minDemand: number;
  onMinDemandChange: (value: number) => void;
}

export function MovieFilters({
  searchText,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedRating,
  onRatingChange,
  minDemand,
  onMinDemandChange,
}: MovieFiltersProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border-l-4 border-cinepolis-blue">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
        <span className="text-cinepolis-blue">Filtros</span>
        <span>de Búsqueda</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Búsqueda por texto
          </label>
          <input
            type="text"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar película..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cinepolis-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo
          </label>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value as MovieType | "ALL")}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cinepolis-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="ALL">Todos</option>
            <option value="REGULAR">Regular</option>
            <option value="SPECIAL">Special</option>
            <option value="PREMIERE">Premiere</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Clasificación
          </label>
          <select
            value={selectedRating}
            onChange={(e) => onRatingChange(e.target.value as Rating | "ALL")}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cinepolis-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="ALL">Todas</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="B15">B15</option>
            <option value="C">C</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Demanda mínima: {minDemand}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={minDemand}
            onChange={(e) => onMinDemandChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

