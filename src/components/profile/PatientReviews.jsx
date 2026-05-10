import React from 'react';
import { Star, MessageSquare } from 'lucide-react';

const PatientReviews = ({ reviews = [] }) => {
  return (
    <div className="patient-reviews-section mt-12 pt-12 border-t border-gray-100">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <MessageSquare size={20} />
          </div>
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">Patient Reviews</h3>
        </div>
        <button className="text-blue-600 font-bold text-sm hover:underline">
          View All Reviews
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review, index) => (
          <div 
            key={index} 
            className="review-card bg-blue-50/40 p-6 rounded-[2rem] border border-blue-50/50 flex flex-col justify-between transition-all hover:bg-white hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 group"
          >
            <div>
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={14} 
                    className={`${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} 
                  />
                ))}
              </div>
              <p className="text-gray-600 text-sm italic leading-relaxed mb-6">
                "{review.comment}"
              </p>
            </div>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-blue-100/30">
              <span className="font-bold text-gray-900 text-sm">{review.patientName}</span>
              <span className="text-gray-400 text-xs font-medium">{review.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientReviews;
