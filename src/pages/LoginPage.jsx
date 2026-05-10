import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2
} from 'lucide-react';
import gsap from 'gsap';
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
        x: -50,
        duration: 1,
        ease: "power3.out"
      });
      gsap.from(brandingRef.current, {
        opacity: 0,
        x: 50,
        duration: 1,
        ease: "power3.out",
        delay: 0.2
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
      });

      // Navigate based on role returned from backend
      if (loggedInUser.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (loggedInUser.role === 'doctor') navigate('/doctor/dashboard', { replace: true });
      else navigate(from, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.';
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row pt-20 overflow-hidden">

      {/* Left Panel: Login Form */}
      <div ref={formRef} className="flex-1 flex items-center justify-center px-8 md:px-16 lg:px-24 py-12 relative overflow-hidden">
        {/* Background Image Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-multiply pointer-events-none"
          style={{ backgroundImage: 'url("/medical-bg.png")' }}
        />

        <div className="w-full max-w-md space-y-10 relative z-10">
          {/* Header */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                <span className="text-white font-black text-xl">م</span>
              </div>
              <span className="text-2xl font-bold text-blue-600 tracking-tighter">ميدكور</span>
            </Link>
            <div className="pt-4">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">مرحباً بك مجدداً</h1>
              <p className="text-gray-500 font-medium mt-2">الرجاء تسجيل الدخول للمتابعة إلى لوحة التحكم</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">البريد الإلكتروني</label>
                <div className="relative group">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pr-12 pl-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-bold text-gray-700">كلمة المرور</label>
                  <button type="button" className="text-xs font-bold text-blue-600 hover:underline">نسيت كلمة المرور؟</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pr-12 pl-12 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-3 cursor-pointer group w-fit">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded-md checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                />
                <CheckCircle2 size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
              </div>
              <span className="text-sm font-bold text-gray-500 group-hover:text-gray-700 transition-colors">تذكرني</span>
            </label>

            {/* API Error */}
            {apiError && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
                <span className="text-red-500">⚠️</span>
                {apiError}
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <Button
                variant="primary"
                type="submit"
                disabled={isLoading}
                className="w-full py-5 text-lg rounded-2xl shadow-xl shadow-blue-200 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  <>
                    تسجيل الدخول
                    <ArrowRight size={20} className="mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 font-medium">
            ليس لديك حساب؟ <Link to="/register" className="text-blue-600 font-bold hover:underline">سجل الآن</Link>
          </p>
        </div>
      </div>

      {/* Right Panel: Branding Card */}
      <div ref={brandingRef} className="hidden md:flex flex-1 bg-slate-50 items-center justify-center p-12">
        <div className="w-full max-w-lg space-y-8">
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-blue-900/5 border border-gray-100 relative overflow-hidden group">
            {/* Status Indicator */}
            <div className="absolute top-8 left-8 flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">النظام متصل</span>
            </div>

            <div className="space-y-8">
              <div className="relative rounded-[2rem] overflow-hidden border border-gray-50">
                <img
                  src="/login-branding.png"
                  alt="Branding"
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent" />
              </div>

              <div className="space-y-4 text-center">
                <h2 className="text-2xl font-bold text-gray-900">أمان طبي على مستوى المؤسسات</h2>
                <p className="text-gray-500 font-medium leading-relaxed">
                  بياناتك محمية بتشفير رائد في الصناعة وأنظمة مراقبة على مدار الساعة.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 pt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs">
                  <ShieldCheck size={16} />
                  وصول آمن
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs">
                  <Clock size={16} />
                  متاح على مدار الساعة
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs font-bold text-gray-400 tracking-[0.2em]">موثوق به من قبل أكثر من ٥٠٠ مركز طبي</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
