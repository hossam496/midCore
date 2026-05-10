import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import { getDoctors, getSpecialties } from '../api/doctorApi';
import DoctorCard from '../components/DoctorCard';
import FilterSidebar from '../components/FilterSidebar';

const FindSpecialist = () => {
  const [doctors, setDoctors] = useState([]);      // Filtered data
  const [specialtiesList, setSpecialtiesList] = useState([]); // Dynamic list from DB
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState('التقييم');
  const [filters, setFilters] = useState({
    search: '',
    specialties: [],
    availability: 'الكل',
    gender: 'الكل'
  });

  const gridRef = useRef(null);

  // Fetch dynamic specialties from DB
  useEffect(() => {
    const fetchSpecs = async () => {
      try {
        const res = await getSpecialties();
        if (res.data.success) {
          setSpecialtiesList(res.data.specialties);
        }
      } catch (err) {
        console.error('Failed to fetch specialties:', err);
      }
    };
    fetchSpecs();
  }, []);

  // Fetch doctors from backend whenever filters or sort changes
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError(null);

        // Prepare query params
        const params = {
          search: filters.search,
          specialties: filters.specialties.join(','),
          availability: filters.availability,
          gender: filters.gender,
          sortBy: sortBy
        };

        const res = await getDoctors(params);
        
        // Safety check to ensure data exists and is an array
        if (res.data && res.data.success && Array.isArray(res.data.doctors)) {
          // Flatten the data: backend returns { user: { name, ... }, specialty, ... }
          const flattened = res.data.doctors.map(doc => ({
            id: doc._id,
            name: doc.user?.name || 'طبيب',
            email: doc.user?.email,
            specialty: doc.specialty,
            specialties: doc.specialties || [],
            experience: doc.experience,
            rating: doc.rating,
            availability: doc.availability,
            gender: doc.user?.gender,
            image: doc.image,
            bio: doc.bio
          }));

          setDoctors(flattened);
          
          // Animation on data change
          gsap.fromTo(".doctor-card",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power2.out", delay: 0.1 }
          );
        } else {
          setDoctors([]);
          if (res.data && !res.data.success) {
            throw new Error(res.data.message || 'Failed to fetch doctors');
          }
        }
      } catch (err) {
        setError('فشل تحميل المتخصصين. يرجى المحاولة مرة أخرى لاحقاً.');
        console.error('Fetch Doctors Error:', err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search to avoid too many requests
    const timeoutId = setTimeout(() => {
      fetchDoctors();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50/50 pt-24 pb-12">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">

        <div className="flex items-center justify-between mb-8 md:hidden">
          <h1 className="text-2xl font-bold text-gray-900">المتخصصون</h1>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl font-bold text-gray-700 shadow-sm"
          >
            <SlidersHorizontal size={18} />
            تصفية
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-10">

          {/* Sidebar - Desktop */}
          <aside className="hidden md:block w-1/4 sticky top-24 h-fit">
            <FilterSidebar filters={filters} setFilters={setFilters} specialtiesList={specialtiesList} />
          </aside>

          {/* Sidebar Overlay - Mobile */}
          {isSidebarOpen && (
            <div className="fixed inset-0 z-[100] md:hidden">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setIsSidebarOpen(false)}
              />
              <div className="absolute right-0 top-0 bottom-0 w-4/5 max-w-xs shadow-2xl">
                <FilterSidebar
                  filters={filters}
                  setFilters={setFilters}
                  specialtiesList={specialtiesList}
                  onClose={() => setIsSidebarOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="hidden md:block text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                  ابحث عن طبيب
                </h1>
                <p className="text-gray-500 font-medium">
                  عرض <span className="text-blue-600 font-bold">{doctors.length}</span> طبيب متاح
                </p>
              </div>

              {/* Sort Dropdown */}
              <div className="relative group">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1 pr-4">
                  ترتيب حسب
                </div>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-blue-200 transition-all">
                  <span className="font-bold text-gray-700 min-w-[100px]">{sortBy}</span>
                  <ChevronDown size={18} className="text-gray-400" />

                  {/* Custom Dropdown Menu */}
                  <div className="absolute top-full left-0 mt-2 w-full min-w-[150px] bg-white border border-gray-100 rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                    {['التقييم', 'الخبرة', 'التوافر'].map(option => (
                      <button
                        key={option}
                        onClick={() => setSortBy(option)}
                        className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-blue-50 hover:text-blue-600 transition-all ${sortBy === option ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
                          }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Doctors Grid */}
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-[200px] bg-white rounded-3xl border border-gray-100" />
                ))}
              </div>
            ) : error ? (
              <div className="p-12 bg-white rounded-[2rem] border border-red-100 text-center">
                <p className="text-red-500 font-bold mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : doctors.length > 0 ? (
              <div
                ref={gridRef}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {doctors.map(doctor => (
                  <DoctorCard key={doctor.id} {...doctor} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <SlidersHorizontal size={32} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">لم يتم العثور على أطباء</h3>
                <p className="text-gray-500">حاول تعديل فلاتر البحث للعثور على نتائج أكثر.</p>
                <button
                  onClick={() => setFilters({ search: '', specialties: [], availability: 'Any', gender: 'Any' })}
                  className="mt-6 font-bold text-blue-600 hover:underline"
                >
                  مسح كافة الفلاتر
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default FindSpecialist;
