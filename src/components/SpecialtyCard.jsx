import React from 'react';
import { ArrowLeft } from 'lucide-react';

const SpecialtyCard = ({ title, description, icon: Icon, color, className = '' }) => {
  // Map color names to Tailwind classes
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 border-blue-100",
    green: "bg-green-100 text-green-600 border-green-100",
    purple: "bg-purple-100 text-purple-600 border-purple-100",
    red: "bg-red-100 text-red-600 border-red-100",
    orange: "bg-orange-100 text-orange-600 border-orange-100",
    cyan: "bg-cyan-100 text-cyan-600 border-cyan-100",
  };

  const activeColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`specialty-card group bg-white border border-gray-100 p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/5 ${className}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${activeColor.split(' ')[0]} ${activeColor.split(' ')[1]}`}>
        <Icon size={28} />
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>

      <p className="text-gray-500 leading-relaxed mb-6">
        {description}
      </p>

      <a
        href="#"
        className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:gap-3 transition-all"
      >
        اعرف المزيد
        <ArrowLeft size={16} />
      </a>
    </div>
  );
};

export default SpecialtyCard;
