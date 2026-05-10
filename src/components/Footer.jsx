import React from 'react';

const Footer = () => {
  const navLinks = [
    { name: 'سياسة الخصوصية', href: '#' },
    { name: 'شروط الخدمة', href: '#' },
    { name: 'دعم الطوارئ', href: '#' },
    { name: 'الوظائف', href: '#' },
    { name: 'اتصل بنا', href: '#' },
  ];

  return (
    <footer className="bg-slate-50 border-t border-gray-100">
      <div className="container mx-auto max-w-7xl px-4 md:px-10 py-12 md:py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4">

          {/* Left Section: Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">م</span>
            </div>
            <span className="text-xl font-bold text-blue-900 tracking-tight">
              ميدكور
            </span>
          </div>

          {/* Center Section: Navigation Links */}
          <nav className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-300 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100" />
              </a>
            ))}
          </nav>

          {/* Right Section: Copyright */}
          <div className="text-center md:text-right">
            <p className="text-xs text-gray-400 font-medium">
              &copy; 2026 ميدكور. التميز السريري ورعاية المرضى.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
