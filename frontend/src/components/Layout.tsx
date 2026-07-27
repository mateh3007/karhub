import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "../assets/karhub-logo.png";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { to: "/", label: "Prioridades", end: true },
  { to: "/parts", label: "Peças", end: false },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function linkClass({ isActive }: { isActive: boolean }) {
    return `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-karhub-orange-light text-karhub-orange-dark"
        : "text-karhub-navy hover:bg-gray-100"
    }`;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="KarHub"
              className="h-9 w-9 rounded-lg object-contain"
            />
            <span className="hidden text-base font-semibold text-karhub-navy sm:inline">
              Reposição de Estoque
            </span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={linkClass}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <span className="text-sm text-gray-500">
              {user?.email}{" "}
              <span className="font-medium text-karhub-navy">
                · {user?.role}
              </span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-karhub-orange hover:underline"
            >
              Sair
            </button>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-karhub-navy hover:bg-gray-100 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {menuOpen ? (
                <path d="M6 6l12 12M18 6l-12 12" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-gray-200 px-4 pb-4 md:hidden">
            <nav className="flex flex-col gap-1 pt-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={linkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-sm text-gray-500">
                {user?.email} · {user?.role}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-karhub-orange"
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
