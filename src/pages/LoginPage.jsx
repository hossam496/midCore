import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const LoginPage = () => {
  const { isAuthenticated, login, user: authUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Automatically redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && authUser) {
      if (authUser.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (authUser.role === 'doctor') navigate('/doctor/dashboard', { replace: true });
      else navigate(from, { replace: true });
    }
  }, [isAuthenticated, authUser, navigate, from]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);

  const formRef = useRef(null);
  const brandingRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(formRef.current, {
        opacity: 0,
        x: -40,
        duration: 0.8,
        ease: "power3.out"
      });
      gsap.from(brandingRef.current, {
        opacity: 0,
        x: 40,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.1
      });
    });
    return () => ctx.revert();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setIsLoading(true);

    try {
      const loggedInUser = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe, // Relay the "Remember Me" checkbox to the backend
      });

      toast.success(`مرحباً بك مجدداً، د. ${loggedInUser.name || ''}`, {
        duration: 4000,
        position: 'top-right',
        style: {
          borderRadius: '1rem',
          background: '#10b981',
          color: '#fff',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 'bold',
        },
      });

      // Navigate based on role returned from backend
      if (loggedInUser.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (loggedInUser.role === 'doctor') navigate('/doctor/dashboard', { replace: true });
      else navigate(from, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.';
      setApiError(message);
      toast.error(message, {
        duration: 5000,
        position: 'top-right',
        style: {
          borderRadius: '1rem',
          background: '#ef4444',
          color: '#fff',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 'bold',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pt-20 overflow-hidden" dir="rtl">

      {/* Right Panel: Login Form */}
      <div ref={formRef} className="flex-1 flex items-center justify-center px-8 md:px-16 lg:px-24 py-12 relative overflow-hidden bg-white">
        {/* Background Decorative Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.03] mix-blend-multiply pointer-events-none"
          style={{ backgroundImage: 'url("/medical-bg.png")' }}
        />

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Header */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 transition-transform duration-300 group-hover:scale-105">
                <span className="text-white font-black text-xl">م</span>
              </div>
              <span className="text-2xl font-bold text-blue-600 tracking-tighter">ميدكور</span>
            </Link>
            <div className="pt-4">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">مرحباً بك مجدداً</h1>
              <p className="text-slate-500 font-medium mt-1.5 text-sm">الرجاء تسجيل الدخول للمتابعة إلى لوحة التحكم الآمنة</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 mr-1">البريد الإلكتروني</label>
                <div className="relative group">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pr-11 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-800 text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-600">كلمة المرور</label>
                  <button type="button" className="text-xs font-bold text-blue-600 hover:underline transition-colors">نسيت كلمة المرور؟</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pr-11 pl-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-800 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2.5 cursor-pointer group w-fit py-1 select-none">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="peer appearance-none w-5 h-5 border-2 border-slate-200 rounded-md checked:bg-blue-600 checked:border-blue-600 transition-all duration-300 cursor-pointer hover:border-slate-300 focus:ring-2 focus:ring-blue-500/10"
                />
                <CheckCircle2 size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-all duration-300 transform scale-50 peer-checked:scale-100" />
              </div>
              <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">تذكرني على هذا الجهاز</span>
            </label>

            {/* API Error Box */}
            {apiError && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-medium animate-pulse">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                <span className="leading-relaxed">{apiError}</span>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <Button
                variant="primary"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 text-sm rounded-2xl shadow-lg shadow-blue-100 group disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري التحقق والدخول...
                  </>
                ) : (
                  <>
                    تسجيل الدخول الآمن
                    <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-slate-500 font-medium">
            ليس لديك حساب بالفعل؟ <Link to="/register" className="text-blue-600 font-bold hover:underline transition-colors">سجل حساباً جديداً</Link>
          </p>
        </div>
      </div>

      {/* Left Panel: Medical Branding Card */}
      <div ref={brandingRef} className="hidden md:flex flex-1 bg-slate-50 items-center justify-center p-12 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 to-indigo-600/5 pointer-events-none" />
        <div className="w-full max-w-md space-y-6 relative z-10">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-900/5 border border-slate-100 relative overflow-hidden group">
            
            {/* Status Indicator */}
            <div className="absolute top-6 left-6 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">نظام محمي</span>
            </div>

            <div className="space-y-6">
              <div className="relative rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner bg-slate-50">
                <img
                  src="/login-branding.png"
                  alt="Branding"
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    // Fail-safe default styling if image is missing
                    e.target.style.display = 'none';
                  }}
                />
                {/* Visual placeholder inside image container */}
                <div className="h-44 bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center">
                  <ShieldCheck size={72} className="text-white/90 animate-bounce" />
                </div>
              </div>

              <div className="space-y-2 text-center">
                <h2 className="text-xl font-bold text-slate-900">أمان طبي عالي المستوى</h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  بيانات المرضى محمية بأحدث بروتوكولات التشفير والامتثال لمعايير HIPAA العالمية.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs">
                  <ShieldCheck size={14} />
                  جلسات مشفرة
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs">
                  <Clock size={14} />
                  حماية متواصلة
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 tracking-[0.15em] uppercase">موثوق به لدى كبرى المراكز الطبية والمستشفيات</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
