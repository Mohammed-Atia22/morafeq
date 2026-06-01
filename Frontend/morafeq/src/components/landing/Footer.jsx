const FOOTER_LINKS = [
  { label: "عن مرافق", href: "#" },
  { label: "شروط الاستخدام", href: "#" },
  { label: "سياسة الخصوصية", href: "#" },
  { label: "تواصل معنا", href: "#" },
];

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 flex-row-reverse">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-row-reverse">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">م</span>
            </div>
            <span className="text-white font-black text-lg">مرافق</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-xs text-gray-500">
            © 2026 مرافق – جميع الحقوق محفوظة. منصة السكن الطلابي الأولى في مصر
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;