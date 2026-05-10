import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Calendar, ArrowRight } from 'lucide-react';
import { BASE_URL } from '../api/axiosInstance';

const DoctorCard = ({ id, name, role, specialty, rating, experience, availability, image, featured }) => {
  return (
    <div className="doctor-card group bg-white border border-gray-100 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:border-blue-100">
      {/* Top Section */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex gap-4">
          <div className="relative">
            <img 
              src={image?.startsWith('http') ? image : `${BASE_URL}${image}`} 
              alt={name} 
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-50"
            />
            {featured && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                <Star size={10} className="text-white fill-current" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {name}
            </h3>
            <p className="text-sm font-medium text-gray-500">{role}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star size={14} className="text-yellow-400 fill-current" />
              <span className="text-sm font-bold text-gray-700">{rating}</span>
            </div>
          </div>
        </div>
        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
          {specialty}
        </span>
      </div>

      {/* Middle Section */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center gap-3 text-gray-600">
          <Clock size={16} className="text-blue-500" />
          <span className="text-sm font-medium">{experience} Experience</span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <Calendar size={16} className="text-blue-500" />
          <span className="text-sm font-medium">Next available: <span className="text-gray-900 font-bold">{availability}</span></span>
        </div>
      </div>

      {/* Bottom Section */}
      <Link 
        to={`/specialists/${id}`}
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold transition-all duration-300 ${
          featured 
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200' 
            : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
        }`}
      >
        View Profile
        <ArrowRight size={18} />
      </Link>
    </div>
  );
};

export default DoctorCard;
