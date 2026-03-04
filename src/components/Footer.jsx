import { Link } from "react-router-dom";
import { Github, Linkedin, Globe } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-white mt-auto">

      <div className="max-w-[1200px] mx-auto px-5 py-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3">

        {/* 🧩 BRAND */}
        <div>
          <h2 className="text-xl font-bold">
            Paste<span className="text-blue-500">App</span>
          </h2>

          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            A smart paste manager with analytics, pinning, search & dark mode.
          </p>

          {/* 🏷 TECH STACK */}
          <div className="flex flex-wrap gap-2 mt-3 text-xs">
            <span className="bg-gray-700 px-2 py-1 rounded">React</span>
            <span className="bg-gray-700 px-2 py-1 rounded">Redux</span>
            <span className="bg-gray-700 px-2 py-1 rounded">Tailwind</span>
            <span className="bg-gray-700 px-2 py-1 rounded">Vite</span>
          </div>
        </div>

        {/* 🔗 QUICK LINKS */}
        <div>
          <h3 className="font-semibold mb-3">Quick Links</h3>

          <div className="flex flex-col gap-2 text-gray-400 text-sm">
            <Link
              to="/"
              className="hover:text-blue-400 transition"
            >
              Home
            </Link>

            <Link
              to="/pastes"
              className="hover:text-blue-400 transition"
            >
              All Pastes
            </Link>
          </div>
        </div>

        {/* 🌐 SOCIALS */}
        <div>
          <h3 className="font-semibold mb-3">Connect</h3>

          <div className="flex gap-4 text-gray-400">

            <a
              href="https://github.com/naitik2043"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              <Github size={20} />
            </a>

            <a
              href="https://linkedin.com/in/naitik2043"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              <Linkedin size={20} />
            </a>

            <a
              href="https://naitikgupta.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              <Globe size={20} />
            </a>

          </div>

          <p className="text-gray-500 text-xs mt-3">
            Built by <span className="text-gray-300 font-medium">Naitik Gupta</span>
          </p>
        </div>

      </div>

      {/* 🧾 BOTTOM BAR */}
      <div className="border-t border-gray-700 text-gray-400 text-sm">

        <div className="max-w-[1200px] mx-auto px-5 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">

          <p>© {new Date().getFullYear()} PasteApp. All rights reserved.</p>

          <p className="text-center">
            Made with ❤️ using React, Redux & Tailwind
          </p>

        </div>

      </div>
    </footer>
  );
};

export default Footer;