import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

const Hero = () => {
  const { isAuthenticated, user } = useAuth();

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'doctor') return '/doctor/dashboard';
    return '/patient-details';
  };

  return (
    <section className="relative min-h-screen pt-24 pb-12 flex items-center overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 -z-10 w-1/2 h-full bg-linear-to-r from-blue-50/50 to-transparent" />
      <div className="absolute bottom-0 right-0 -z-10 w-full h-1/2 bg-linear-to-t from-blue-50/30 to-transparent" />

      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left Column: Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col gap-8 text-center lg:text-right"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold tracking-wide"
              >
                حل الرعاية الصحية الموثوق
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1]">
                رعاية متخصصة، <br />
                <span className="text-blue-600">على بعد نقرة واحدة</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto lg:mr-0 lg:ml-auto leading-relaxed">
                اختبر التميز الطبي مع ميدكور. نحن نوفر وصولاً سهلاً لأفضل المتخصصين في الرعاية الصحية مع سهولة حجز المواعيد لك ولعائلتك.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              {isAuthenticated ? (
                <Link to={getDashboardLink()} className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    className="w-full sm:w-auto text-lg h-14 px-8"
                    icon={Calendar}
                  >
                    الانتقال إلى لوحة التحكم
                  </Button>
                </Link>
              ) : (
                <Link to="/register" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    className="w-full sm:w-auto text-lg h-14 px-8"
                    icon={Calendar}
                  >
                    ابدأ الآن
                  </Button>
                </Link>
              )}
              <Button
                variant="secondary"
                className="w-full sm:w-auto text-lg h-14 px-8"
                icon={Info}
              >
                اكتشف المزيد
              </Button>
            </div>

            {/* Quick Stats or Trust Elements */}
            <div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
              <div className="text-center lg:text-right">
                <p className="text-2xl font-bold text-gray-900">+٥٠٠</p>
                <p className="text-sm text-gray-500 font-medium">أطباء خبراء</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center lg:text-right">
                <p className="text-2xl font-bold text-gray-900">٢٤/٧</p>
                <p className="text-sm text-gray-500 font-medium">رعاية طوارئ</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center lg:text-right">
                <p className="text-2xl font-bold text-gray-900">+١٠ آلاف</p>
                <p className="text-sm text-gray-500 font-medium">مرضى سعداء</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Image Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            {/* Background Decorative Element */}
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl -z-10 opacity-60" />
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 opacity-60" />

            <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl shadow-blue-200/50 border border-blue-50 overflow-hidden group">
              <div className="relative overflow-hidden rounded-[2rem]">
                <img
                  src="/hero-doctors.png"
                  alt="Professional Doctors"
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Floating Card Overlay (Aesthetic touch) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute bottom-6 right-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">استشارة عبر الإنترنت</p>
                    <p className="text-xs text-gray-500">متاح الآن</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
