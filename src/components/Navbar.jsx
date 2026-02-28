import { NavbarData } from "../data/NavLinks";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      const isDark = savedTheme === "dark";
      document.documentElement.classList.toggle("dark", isDark);
      setDarkMode(isDark);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
      setDarkMode(prefersDark);
    }
  }, []);

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");

    const isDark = document.documentElement.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setDarkMode(isDark);
  };

  const handleNavClick = () => setMenuOpen(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;

    navigate(`/pastes?search=${globalSearch}`);
    setGlobalSearch("");
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-gray-800 dark:bg-gray-900 shadow-md">
      <div className="max-w-[1200px] mx-auto flex justify-between items-center px-5 py-3">

        <Link to="/" className="text-xl font-bold text-white">
          Paste<span className="text-blue-500">App</span>
        </Link>

        {/* ☰ Mobile menu button */}
        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        <nav
          className={`absolute md:static top-16 left-0 w-full md:w-auto 
          bg-gray-800 md:bg-transparent 
          flex flex-col md:flex-row items-center gap-6 py-4 md:py-0
          transition-all duration-300
          ${menuOpen ? "flex" : "hidden md:flex"}`}
        >

          {/* 🔍 GLOBAL SEARCH */}
          <form onSubmit={handleSearch} className="md:block">
            <input
              type="text"
              placeholder="Search..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="px-3 py-1 rounded-md text-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
            />
          </form>

          {NavbarData.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `relative text-lg transition ${
                  isActive
                    ? "text-blue-500 font-semibold after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:bg-blue-500"
                    : "text-white dark:text-gray-300 hover:text-blue-400"
                }`
              }
            >
              {link.title}
            </NavLink>
          ))}

          {/* 🌙 DARK MODE */}
          <button
            onClick={toggleDark}
            className="text-xl text-white dark:text-yellow-400"
            aria-label="Toggle dark mode"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

        </nav>
      </div>
    </header>
  );
};

export default Navbar;