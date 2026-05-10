import React from 'react';
import { Search, X } from 'lucide-react';

const FilterSidebar = ({
  filters,
  setFilters,
  onClose,
  specialtiesList = []
}) => {
  // Use dynamic list if available, otherwise fallback
  const specialties = specialtiesList.length > 0 
    ? specialtiesList 
    : ['قلبية', 'أطفال', 'أعصاب', 'عظام'];
    
  const availabilityOptions = ['الكل', 'اليوم', 'غداً', 'هذا الأسبوع'];
  const genders = ['الكل', 'أنثى', 'ذكر'];

  const toggleSpecialty = (specialty) => {
    setFilters(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  return (
    <div className="bg-white md:bg-transparent h-full flex flex-col gap-8 p-6 md:p-0 overflow-y-auto">
      {/* Mobile Header */}
      <div className="flex md:hidden items-center justify-between mb-2">
        <h2 className="text-xl font-bold">تصفية</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
          <X size={24} />
        </button>
      </div>

      {/* Search */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900">البحث عن متخصص</h3>
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="البحث بالاسم..."
            className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
      </div>

      {/* Specialty */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900">التخصص</h3>
        <div className="flex flex-col gap-3">
          {specialties.map(specialty => (
            <label key={specialty} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded-md checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                  checked={filters.specialties.includes(specialty)}
                  onChange={() => toggleSpecialty(specialty)}
                />
                <div className="absolute opacity-0 peer-checked:opacity-100 pointer-events-none text-white font-bold">
                  ✓
                </div>
              </div>
              <span className="text-gray-600 font-medium group-hover:text-blue-600 transition-colors">{specialty}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900">التوافر</h3>
        <div className="flex flex-col gap-3">
          {availabilityOptions.map(option => (
            <label key={option} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="availability"
                className="w-5 h-5 border-2 border-gray-200 text-blue-600 focus:ring-blue-500 cursor-pointer"
                checked={filters.availability === option}
                onChange={() => setFilters(prev => ({ ...prev, availability: option }))}
              />
              <span className="text-gray-600 font-medium group-hover:text-blue-600 transition-colors">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900">الجنس</h3>
        <div className="flex p-1 bg-gray-100 rounded-xl">
          {genders.map(gender => (
            <button
              key={gender}
              onClick={() => setFilters(prev => ({ ...prev, gender }))}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${filters.gender === gender
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {gender}
            </button>
          ))}
        </div>
      </div>

      {/* Reset (Mobile Only) */}
      <button
        className="mt-4 py-3 border-2 border-gray-100 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all md:hidden"
        onClick={() => {
          setFilters({ search: '', specialties: [], availability: 'الكل', gender: 'الكل' });
          onClose();
        }}
      >
        إعادة ضبط الفلاتر
      </button>
    </div>
  );
};

export default FilterSidebar;
