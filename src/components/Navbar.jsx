import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, User as UserIcon, ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'الخدمات', href: '/#services' },
    { name: 'الأطباء', href: '/specialists' },
    { name: 'اتصل بنا', href: '/contact' },
    ...(isAuthenticated ? [
      user?.role === 'admin' ? { name: 'لوحة الإدارة', href: '/admin/dashboard' } :
        user?.role === 'doctor' ? { name: 'لوحة التحكم', href: '/doctor/dashboard' } :
          { name: 'حجوزاتي', href: '/patient-details' },
      { name: 'الرسائل', href: user?.role === 'doctor' ? '/doctor/messages' : '/messages' }
    ] : []),
  ];

  const isHome = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled || !isHome ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
      }`}>
      <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
        {/* Logo */}
        <Link to="/">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl">م</span>
            </div>
            <span className="text-2xl font-bold text-blue-600 tracking-tight">ميدكور</span>
          </motion.div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden xl:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={`relative font-bold text-sm transition-colors group ${location.pathname === link.href ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
            >
              {link.name}
              <span className={`absolute -bottom-1 right-0 h-0.5 bg-blue-600 transition-all duration-300 ${location.pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="hidden xl:flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">


              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${user?.role === 'admin' ? 'bg-red-50 border-red-100 text-red-700' :
                user?.role === 'doctor' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                  'bg-slate-50 border-slate-100 text-slate-700'
                }`}>
                <UserIcon size={18} />
                <div className="flex flex-col -space-y-1 text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
                    {user?.role === 'admin' ? 'مدير' : user?.role === 'doctor' ? 'طبيب' : 'مريض'}
                  </span>
                  <span className="text-sm font-bold">{user?.name ? user.name.split(' ')[0] : ''}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 font-bold text-sm hover:text-red-600 transition-colors"
              >
                <LogOut size={18} />
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="text">دخول</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" className="px-8">تسجيل</Button>
              </Link>
            </>
          )}
        </div>


        {/* Mobile Menu Button */}
        <div className="xl:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-700 hover:text-blue-600 transition-colors"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl py-6 px-4 xl:hidden flex flex-col gap-6"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-lg font-bold text-gray-800 flex justify-between items-center group"
              >
                {link.name}
                <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
              {isAuthenticated ? (
                <Button
                  variant="primary"
                  className="w-full bg-red-500 hover:bg-red-600 border-none"
                  onClick={handleLogout}
                >
                  تسجيل الخروج
                </Button>
              ) : (
                <>
                  <Link to="/login" className="w-full">
                    <Button variant="secondary" className="w-full">دخول</Button>
                  </Link>
                  <Link to="/register" className="w-full">
                    <Button variant="primary" className="w-full">تسجيل</Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
