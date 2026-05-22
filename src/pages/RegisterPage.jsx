import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Calendar,
  Users,
  ChevronDown,
  Shield,
  Activity,
  Droplet,
  Scale
} from 'lucide-react';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

// Moved outside to prevent focus loss on re-render
const InputField = ({
  icon: Icon,
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  touched,
  errors,
  showPassword,
  setShowPassword,
  getStatusClasses
}) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-gray-800 mr-1">{label}</label>
    <div className="relative group">
      <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${errors[name] && touched[name] ? 'text-red-500' : 'text-gray-400 group-focus-within:text-blue-500'}`}>
        <Icon size={20} />
      </div>
      <input
        type={type === "password" && showPassword ? "text" : type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full pr-12 pl-12 py-4 border-2 rounded-2xl focus:outline-none transition-all duration-300 font-medium ${getStatusClasses(name)}`}
      />
      {name === "password" && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
      {touched[name] && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {errors[name] ? (
            <AlertCircle size={20} className="text-red-500" />
          ) : (
            <CheckCircle2 size={20} className="text-green-500" />
          )}
        </div>
      )}
    </div>
    {touched[name] && (
      <p className={`text-xs font-bold mr-2 transition-all ${errors[name] ? 'text-red-500' : 'text-green-600'}`}>
        {errors[name] ? errors[name] : "يبدو جيداً!"}
      </p>
    )}
  </div>
);

const RegisterPage = () => {
  const { isAuthenticated, register, user: authUser } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Automatically redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && authUser) {
      if (authUser.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (authUser.role === 'doctor') navigate('/doctor/dashboard', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [isAuthenticated, authUser, navigate]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: '',
    dob: '',
    bloodType: '',
    weight: '',
    height: '',
    role: 'user'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(formRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: "power3.out"
      });
    }, formRef);
    return () => ctx.revert();
  }, []);

  const validateField = (name, value) => {
    let error = "";
    if (name === "fullName" && value.length < 3) error = "Name must be at least 3 characters";
    if (name === "email" && !/\S+@\S+\.\S+/.test(value)) error = "Please enter a valid email";
    if (name === "phone" && !/^\d{10,15}$/.test(value)) error = "Invalid phone number";
    if (name === "password" && value.length < 8) error = "Password must be at least 8 characters";
    if (name === "confirmPassword" && value !== formData.password) error = "Passwords do not match";

    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);

    if (name === "password" && touched.confirmPassword) {
      validateField("confirmPassword", formData.confirmPassword);
    }
  };

  const getStatusClasses = (name) => {
    if (!touched[name]) return "border-gray-200 bg-gray-50/50";
    return errors[name]
      ? "border-red-500 bg-red-50/30"
      : "border-green-500 bg-green-50/30";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const hasErrors = Object.values(errors).some((x) => x !== '');
    if (hasErrors) return;

    setIsLoading(true);
    try {
      const registeredUser = await register({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        gender: formData.gender,
        dob: formData.dob,
        bloodType: formData.bloodType,
        weight: formData.weight,
        height: formData.height,
      });

      // Navigate based on role returned from backend
      if (registeredUser.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (registeredUser.role === 'doctor') navigate('/doctor/dashboard', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 flex items-center justify-center relative overflow-hidden">
      {/* Dynamic Background Image Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-multiply"
        style={{ backgroundImage: 'url("/medical-bg.png")' }}
      />

      {/* Decorative gradient overlays for depth */}
      <div className="absolute top-0 left-0 w-full h-80 bg-linear-to-br from-blue-600/10 to-transparent -skew-y-6 transform origin-top-left" />
      <div className="absolute bottom-0 right-0 w-full h-80 bg-linear-to-tl from-blue-600/10 to-transparent skew-y-6 transform origin-bottom-right" />

      <div ref={formRef} className="w-full max-w-xl px-4 relative z-10">
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-xl shadow-blue-200">
            <span className="text-white font-black text-3xl">M</span>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">إنشاء حساب</h1>
          <p className="text-gray-500 font-medium">انضم إلى ميدكور واستمتع برعاية صحية ممتازة</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-blue-900/10 border border-gray-200/50">
          <form onSubmit={handleSubmit} className="space-y-7">

            <div className="space-y-5">
              <InputField
                icon={User}
                label="الاسم الكامل"
                name="fullName"
                placeholder="مثال: حسام محمد"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                touched={touched}
                errors={errors}
                getStatusClasses={getStatusClasses}
              />
              <InputField
                icon={Mail}
                label="البريد الإلكتروني"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                touched={touched}
                errors={errors}
                getStatusClasses={getStatusClasses}
              />
              <InputField
                icon={Phone}
                label="رقم الهاتف"
                name="phone"
                placeholder="012 3456 7890"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                touched={touched}
                errors={errors}
                getStatusClasses={getStatusClasses}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  icon={Lock}
                  label="كلمة المرور"
                  name="password"
                  type="password"
                  placeholder="٨ أحرف على الأقل"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  touched={touched}
                  errors={errors}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  getStatusClasses={getStatusClasses}
                />
                <InputField
                  icon={Lock}
                  label="تأكيد كلمة المرور"
                  name="confirmPassword"
                  type="password"
                  placeholder="أعد إدخال كلمة المرور"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  touched={touched}
                  errors={errors}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  getStatusClasses={getStatusClasses}
                />
              </div>
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-gray-400 font-bold tracking-widest">تفاصيل الحساب</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800 mr-1">الجنس</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Users size={20} />
                  </div>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full pr-12 pl-10 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option value="">اختر</option>
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                    <option value="other">آخر</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800 mr-1">تاريخ الميلاد</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Calendar size={20} />
                  </div>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full pr-12 pl-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800 mr-1">فصيلة الدم</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Droplet size={20} />
                  </div>
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                    className="w-full pr-12 pl-10 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option value="">اختر فصيلة الدم</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800 mr-1">الوزن (كجم)</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Scale size={20} />
                  </div>
                  <input
                    type="number"
                    name="weight"
                    placeholder="e.g. 75"
                    min="0"
                    value={formData.weight}
                    onChange={handleChange}
                    className="w-full pr-12 pl-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800 mr-1">الطول (سم)</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Scale size={20} />
                  </div>
                  <input
                    type="number"
                    name="height"
                    placeholder="e.g. 175"
                    min="0"
                    value={formData.height}
                    onChange={handleChange}
                    className="w-full pr-12 pl-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-800 mr-1">نوع الحساب</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'user', label: 'مريض', icon: User },
                  { id: 'doctor', label: 'طبيب', icon: Activity },
                ].map((role) => (
                  <label
                    key={role.id}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.role === role.id
                      ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-600/10'
                      : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                      }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.id}
                      checked={formData.role === role.id}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <role.icon size={24} />
                    <span className="text-xs font-bold uppercase tracking-wider">{role.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* API Error */}
            {apiError && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
                <span>⚠️</span>
                {apiError}
              </div>
            )}

            <div className="pt-4">
              <Button
                variant="primary"
                type="submit"
                disabled={isLoading}
                className="w-full py-5 text-lg rounded-2xl shadow-xl shadow-blue-200 group active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري إنشاء الحساب...
                  </span>
                ) : (
                  <>
                    إنشاء حساب
                    <ArrowRight size={20} className="mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-sm text-gray-500 font-medium">
              لديك حساب بالفعل؟ <Link to="/login" className="text-blue-600 font-bold hover:underline">تسجيل الدخول</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
