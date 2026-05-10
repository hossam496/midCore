import React from 'react';
import { GraduationCap } from 'lucide-react';

const EducationList = ({ education = [] }) => {
  return (
    <div className="education-section">
      <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
        Education
      </h3>
      <div className="space-y-4">
        {education.map((edu, index) => (
          <div 
            key={index} 
            className="education-item bg-gray-50/50 p-6 rounded-2xl border border-gray-100 flex gap-5 items-start transition-all hover:bg-white hover:border-blue-100 hover:shadow-md group"
          >
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-100 group-hover:border-blue-50 transition-colors">
              <GraduationCap size={22} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900 mb-1">
                {edu.degree}
              </h4>
              <p className="text-gray-600 font-medium text-sm">
                {edu.university}
              </p>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-2">
                {edu.year}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EducationList;
