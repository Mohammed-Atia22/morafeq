import { useState } from "react";

//useLocation
import { Link } from "react-router-dom";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
//   const location = useLocation();

  const navLinks = [
    { label: "للملاك", href: "#owners" },
    { label: "مجتمع الطلاب", href: "#community" },
    { label: "كيف يعمل", href: "#how-it-works" },
    { label: "استعراض العقارات", href: "#listings" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 flex-row-reverse">

          {/* Logo (right side for RTL) */}
          <Link to="/" className="flex items-center gap-2 flex-row-reverse">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-black text-sm">م</span>
            </div>
            <span className="font-black text-xl text-primary-700 tracking-tight">مرافق</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 flex-row-reverse">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-primary-600 hover:bg-blue-50 rounded-lg transition-all duration-150"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3 flex-row-reverse">
            <Link
              to="/login"
              className="px-5 py-2 text-sm font-bold text-gray-700 hover:text-primary-600 transition-colors"
            >
              تسجيل الدخول
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-blue-500/25 transition-all duration-150 active:scale-95"
            >
              إنشاء حساب مجاني
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="القائمة"
          >
            <div className="w-5 h-0.5 bg-gray-700 mb-1 transition-all" style={{ transform: menuOpen ? 'rotate(45deg) translate(3px, 6px)' : 'none' }} />
            <div className="w-5 h-0.5 bg-gray-700 mb-1 transition-all" style={{ opacity: menuOpen ? 0 : 1 }} />
            <div className="w-5 h-0.5 bg-gray-700 transition-all" style={{ transform: menuOpen ? 'rotate(-45deg) translate(3px, -6px)' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-2 animate-fade-in">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-right px-4 py-3 text-sm font-semibold text-gray-700 hover:text-primary-600 hover:bg-blue-50 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-3 flex flex-col gap-2">
            <Link to="/login" className="text-right px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl">
              تسجيل الدخول
            </Link>
            <Link to="/register" className="text-center px-4 py-3 text-sm font-bold text-white bg-primary-600 rounded-xl">
              إنشاء حساب مجاني
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;