import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Send,
  Clock,
  ChevronDown
} from 'lucide-react';
import gsap from 'gsap';
import Button from '../components/Button';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: 'استفسار عام',
    message: ''
  });

  const infoRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(infoRef.current, {
        opacity: 0,
        x: -50,
        duration: 1,
        ease: "power3.out"
      });
      gsap.from(formRef.current, {
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Submitted:', formData);
    // Add success logic here
    alert('شكراً لرسالتك! سيتواصل معك فريقنا قريباً.');
    setFormData({ firstName: '', lastName: '', email: '', department: 'استفسار عام', message: '' });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-10 max-w-7xl">

        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            نحن هنا للمساعدة
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed font-medium">
            لديك سؤال أو بحاجة إلى مساعدة؟ تواصل مع فريق الرعاية الطبية المتعاطف لدينا. نحن مكرسون لتقديم الدعم الذي تحتاجه.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* Left Column: Contact Information */}
          <div ref={infoRef} className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-sm space-y-10">
              <div className="space-y-8">
                {/* Phone */}
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">الهاتف</p>
                    <p className="text-lg font-bold text-gray-900">+1 (555) 000-1234</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">البريد الإلكتروني</p>
                    <p className="text-lg font-bold text-gray-900">support@medcore.com</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">العنوان</p>
                    <p className="text-lg font-bold text-gray-900">123 الشارع الرئيسي، الرياض</p>
                  </div>
                </div>
              </div>

              {/* Map Preview */}
              <div className="pt-6 border-t border-gray-50">
                <div className="relative rounded-3xl overflow-hidden shadow-md group">
                  <img
                    src="/map-preview.png"
                    alt="Map Location"
                    className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-transparent transition-colors" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-bold text-blue-600 shadow-sm">
                    افتح في خرائط جوجل
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info / Office Hours */}
            <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <Clock size={20} />
                <h3 className="text-xl font-bold">ساعات العمل</h3>
              </div>
              <div className="space-y-2 opacity-90 font-medium">
                <div className="flex justify-between">
                  <span>الإثنين - الجمعة</span>
                  <span>٨:٠٠ صباحاً - ٨:٠٠ مساءً</span>
                </div>
                <div className="flex justify-between">
                  <span>السبت</span>
                  <span>٩:٠٠ صباحاً - ٥:٠٠ مساءً</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                  <span>الطوارئ</span>
                  <span className="font-bold underline">متاح على مدار الساعة</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div ref={formRef} className="lg:col-span-7">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm">
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">أرسل رسالة</h2>
                <p className="text-gray-500 font-medium italic">عادة ما نرد في غضون ٢-٤ ساعات عمل.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 mr-1">الاسم الأول</label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      placeholder="محمد"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900 font-medium"
                    />
                  </div>
                  {/* Last Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 mr-1">اسم العائلة</label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      placeholder="خالد"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900 font-medium"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="mail@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900 font-medium"
                  />
                </div>

                {/* Department Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-1">القسم</label>
                  <div className="relative group">
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900 font-medium appearance-none cursor-pointer"
                    >
                      <option>استفسار عام</option>
                      <option>أمراض القلب</option>
                      <option>طب الأطفال</option>
                      <option>طب الأعصاب</option>
                      <option>الفواتير والتأمين</option>
                    </select>
                    <ChevronDown size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                  </div>
                </div>

                {/* Message Textarea */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 mr-1">رسالتك</label>
                  <textarea
                    name="message"
                    required
                    rows="5"
                    placeholder="أخبرنا كيف يمكننا المساعدة..."
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900 font-medium resize-none"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    variant="primary"
                    type="submit"
                    className="w-full py-5 text-lg rounded-2xl shadow-xl shadow-blue-200 group"
                  >
                    إرسال الرسالة
                    <Send size={20} className="mr-2 transition-transform duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1 rotate-180" />
                  </Button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;
