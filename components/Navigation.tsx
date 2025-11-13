"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";

export function Navigation() {
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-cinepolis-blue text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold flex items-center gap-2">
            <span className="text-cinepolis-yellow">Cine</span>
            <span>polis</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive("/")
                  ? "bg-cinepolis-yellow text-cinepolis-blue font-semibold"
                  : "hover:bg-cinepolis-blue-dark"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/schedule"
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive("/schedule")
                  ? "bg-cinepolis-yellow text-cinepolis-blue font-semibold"
                  : "hover:bg-cinepolis-blue-dark"
              }`}
            >
              Planificador
            </Link>
            {/* <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors hover:bg-cinepolis-blue-dark focus:outline-none focus:ring-2 focus:ring-cinepolis-yellow"
              aria-label={mounted && theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title={mounted && theme === "dark" ? "Modo claro" : "Modo oscuro"}
            >
              {mounted && theme === "dark" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-cinepolis-yellow"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-cinepolis-yellow"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button> */}
          </div>
        </div>
      </div>
    </nav>
  );
}

