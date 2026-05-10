import React from 'react';

const ExperienceTimeline = ({ experiences = [] }) => {
  return (
    <div className="experience-section">
      <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
        Experience
      </h3>
      <div className="relative pl-8 space-y-10">
        {/* Vertical Line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-blue-100" />
        
        {experiences.map((exp, index) => (
          <div key={index} className="experience-item relative">
            {/* Timeline Dot */}
            <div className="absolute -left-[30px] top-1.5 w-5 h-5 rounded-full border-4 border-white bg-blue-600 shadow-sm z-10" />
            
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-gray-900 leading-none">
                {exp.title}
              </h4>
              <p className="text-blue-600 font-semibold text-sm">
                {exp.institution}
              </p>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-2">
                {exp.duration}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExperienceTimeline;
