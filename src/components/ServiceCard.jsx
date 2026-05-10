import React from 'react';
import { ArrowLeft } from 'lucide-react';

const ServiceCard = ({ title, description, icon: Icon, color, className = '' }) => {
  // Map color names to Tailwind classes for icon box and link
  const colorMap = {
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      link: "text-blue-600",
    },
    green: {
      bg: "bg-green-50",
      icon: "text-green-600",
      link: "text-green-600",
    },
    orange: {
      bg: "bg-orange-50",
      icon: "text-orange-600",
      link: "text-orange-600",
    },
    indigo: {
      bg: "bg-indigo-50",
      icon: "text-indigo-600",
      link: "text-indigo-600",
    },
  };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <div className={`group relative bg-white border border-gray-100 p-8 rounded-4xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${className}`}>
      {/* Icon Box */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors duration-300 ${theme.bg} ${theme.icon}`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">
        {title}
      </h3>

      <p className="text-sm text-gray-500 leading-relaxed mb-6">
        {description}
      </p>

      {/* Link */}
      <a
        href="#"
        className={`inline-flex items-center gap-1.5 font-bold text-sm transition-all duration-300 ${theme.link} hover:gap-2.5`}
      >
        اعرف المزيد
        <ArrowLeft size={16} strokeWidth={3} />
      </a>
    </div>
  );
};

export default ServiceCard;
