import React, { useState, useEffect, useRef } from 'react';
import { User, Activity, Clock, FileText, Image as ImageIcon, Save, CheckCircle2, MapPin, Globe, GraduationCap, Briefcase, Plus, X, Upload } from 'lucide-react';
import { getMyDoctorProfile, updateMyDoctorProfile, uploadDoctorImage } from '../../../api/doctorApi';
import getImageUrl from '../../../utils/imageUrl';
import { useAuth } from '../../../context/AuthContext';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { updateUser } = useAuth();

  const [formData, setFormData] = useState({
    specialty: '',
    specialties: [],
    location: '',
    experience: '',
    languages: [],
    availability: '',
    bio: '',
    image: '',
    name: '',
    education: [],
    experienceList: [],
    availableSlots: { morning: [], afternoon: [] },
  });

  const fileInputRef = useRef(null);

  const [tagInputs, setTagInputs] = useState({ specialties: '', languages: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyDoctorProfile();
        const doctor = res.data.doctor;
        setFormData({
          specialty: doctor.specialty || '',
          specialties: doctor.specialties || [],
          location: doctor.location || '',
          experience: doctor.experience || '',
          languages: doctor.languages || [],
          availability: doctor.availability || '',
          bio: doctor.bio || '',
          image: doctor.image || '',
          name: doctor.user?.name || '',
          education: doctor.education || [],
          experienceList: doctor.experienceList || [],
          availableSlots: doctor.availableSlots || { morning: [], afternoon: [] },
          workingHours: doctor.workingHours || {},
          slotDuration: doctor.slotDuration || 30,
          bufferTime: doctor.bufferTime || 10,
          maxAppointmentsPerDay: doctor.maxAppointmentsPerDay || 20,
        });
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (index, field, key, value) => {
    const newArray = [...formData[field]];
    newArray[index][key] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field, defaultObj) => {
    setFormData({ ...formData, [field]: [...formData[field], defaultObj] });
  };

  const removeArrayItem = (index, field) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  const handleTagInput = (e, field) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = tagInputs[field].trim();
      if (value && !formData[field].includes(value)) {
        setFormData({ ...formData, [field]: [...formData[field], value] });
      }
      setTagInputs({ ...tagInputs, [field]: '' });
    }
  };

  const removeTag = (index, field) => {
    setFormData({ ...formData, [field]: formData[field].filter((_, i) => i !== index) });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('الصورة كبيرة جداً! الحد الأقصى هو 2 ميجابايت لضمان الحفظ في قاعدة البيانات.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFormData((prev) => ({ ...prev, image: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      // Clean empty array items
      const cleanedData = {
        ...formData,
        education: formData.education.filter(e => e.degree || e.year),
        experienceList: formData.experienceList.filter(e => e.position || e.hospital)
      };
      await updateMyDoctorProfile(cleanedData);
      updateUser({ image: formData.image, name: formData.name });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Loading Profile...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Profile Settings</h1>
        <p className="text-slate-500 mt-1 font-medium">Update your public profile details and professional portfolio.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-10">

          {/* Header section: Image & Basics */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3 flex flex-col items-center space-y-4">
              <div className="relative group">
                <div className="w-48 h-48 rounded-3xl bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center relative">
                  {formData.image ? (
                    <img src={getImageUrl(formData.image)} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={64} className="text-slate-300" />
                  )}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <Upload size={18} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center mt-2">JPG, PNG or WEBP. Max 2MB.</p>
            </div>

            <div className="w-full md:w-2/3 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                    <User size={16} className="text-blue-500" /> Full Name
                  </label>
                  <input
                    type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Dr. Julian Vance"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                    <Activity size={16} className="text-blue-500" /> Primary Specialty
                  </label>
                  <input
                    type="text" name="specialty" value={formData.specialty} onChange={handleChange} placeholder="e.g. Cardiology"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-blue-500" /> Years of Experience
                  </label>
                  <input
                    type="text" name="experience" value={formData.experience} onChange={handleChange} placeholder="e.g. 15"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-blue-500" /> Location
                  </label>
                  <input
                    type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. New York, NY"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-blue-500" /> Availability
                  </label>
                  <input
                    type="text" name="availability" value={formData.availability} onChange={handleChange} placeholder="e.g. Mon-Fri, 9AM-5PM"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 my-8"></div>

          {/* Tags section: Specialties & Languages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                <Activity size={16} className="text-blue-500" /> Additional Specialties & Expertise
              </label>
              <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 min-h-[50px] flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                {formData.specialties.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg flex items-center gap-1 shadow-sm">
                    {tag} <X size={12} className="cursor-pointer hover:text-rose-500" onClick={() => removeTag(i, 'specialties')} />
                  </span>
                ))}
                <input
                  type="text" value={tagInputs.specialties} onChange={e => setTagInputs({ ...tagInputs, specialties: e.target.value })} onKeyDown={e => handleTagInput(e, 'specialties')}
                  placeholder="Type and press enter..." className="flex-1 min-w-[120px] bg-transparent outline-none text-sm font-medium px-2"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                <Globe size={16} className="text-blue-500" /> Spoken Languages
              </label>
              <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 min-h-[50px] flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                {formData.languages.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg flex items-center gap-1 shadow-sm">
                    {tag} <X size={12} className="cursor-pointer hover:text-rose-500" onClick={() => removeTag(i, 'languages')} />
                  </span>
                ))}
                <input
                  type="text" value={tagInputs.languages} onChange={e => setTagInputs({ ...tagInputs, languages: e.target.value })} onKeyDown={e => handleTagInput(e, 'languages')}
                  placeholder="Type and press enter..." className="flex-1 min-w-[120px] bg-transparent outline-none text-sm font-medium px-2"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
              <FileText size={16} className="text-blue-500" /> Professional Bio
            </label>
            <textarea
              name="bio" value={formData.bio} onChange={handleChange} rows="4"
              placeholder="Write a brief professional summary about your expertise and background..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all"
            ></textarea>
          </div>

          <div className="border-t border-slate-100 my-8"></div>

          {/* Dynamic Lists: Experience & Education */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Experience List */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Briefcase size={16} className="text-blue-500" /> Experience Timeline
                </label>
                <button type="button" onClick={() => addArrayItem('experienceList', { position: '', hospital: '' })} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                  <Plus size={14} /> Add Item
                </button>
              </div>
              <div className="space-y-3">
                {formData.experienceList.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex-1 space-y-2">
                      <input type="text" placeholder="Position / Role" value={item.position} onChange={e => handleArrayChange(index, 'experienceList', 'position', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-medium outline-none focus:border-blue-500" />
                      <input type="text" placeholder="Hospital / Clinic" value={item.hospital} onChange={e => handleArrayChange(index, 'experienceList', 'hospital', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-medium outline-none focus:border-blue-500" />
                    </div>
                    <button type="button" onClick={() => removeArrayItem(index, 'experienceList')} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {formData.experienceList.length === 0 && <p className="text-xs text-slate-400 font-medium py-2">No experience added yet.</p>}
              </div>
            </div>

            {/* Education List */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <GraduationCap size={16} className="text-blue-500" /> Education & Qualifications
                </label>
                <button type="button" onClick={() => addArrayItem('education', { degree: '', year: '' })} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                  <Plus size={14} /> Add Item
                </button>
              </div>
              <div className="space-y-3">
                {formData.education.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex-1 space-y-2">
                      <input type="text" placeholder="Degree / Certificate" value={item.degree} onChange={e => handleArrayChange(index, 'education', 'degree', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-medium outline-none focus:border-blue-500" />
                      <input type="text" placeholder="Year" value={item.year} onChange={e => handleArrayChange(index, 'education', 'year', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-medium outline-none focus:border-blue-500" />
                    </div>
                    <button type="button" onClick={() => removeArrayItem(index, 'education')} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {formData.education.length === 0 && <p className="text-xs text-slate-400 font-medium py-2">No education added yet.</p>}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 my-8"></div>

          {/* Time Slots Management */}
          <div className="space-y-8">
            <div className="mb-4">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Clock size={16} className="text-blue-500" /> إعدادات الجدولة الذكية
              </label>
              <p className="text-xs text-slate-500 mt-1 font-medium">قم بتحديد ساعات العمل ومدة الكشف لتوليد المواعيد تلقائياً.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">مدة الكشف (دقيقة)</label>
                <input
                  type="number" name="slotDuration" value={formData.slotDuration || 30}
                  onChange={handleChange}
                  className="w-full bg-white border border-blue-100 rounded-xl py-3 px-4 text-sm font-black focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">وقت الراحة (دقيقة)</label>
                <input
                  type="number" name="bufferTime" value={formData.bufferTime || 10}
                  onChange={handleChange}
                  className="w-full bg-white border border-blue-100 rounded-xl py-3 px-4 text-sm font-black focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">أقصى عدد مواعيد/يوم</label>
                <input
                  type="number" name="maxAppointmentsPerDay" value={formData.maxAppointmentsPerDay || 20}
                  onChange={handleChange}
                  className="w-full bg-white border border-blue-100 rounded-xl py-3 px-4 text-sm font-black focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 block">ساعات العمل الأسبوعية</label>
              <div className="grid grid-cols-1 gap-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <div key={day} className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm group">
                    <div className="w-32 flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.workingHours?.[day]?.isActive || false}
                        onChange={(e) => {
                          const updated = { ...formData.workingHours };
                          if (!updated[day]) updated[day] = { isActive: false, start: '09:00', end: '17:00' };
                          updated[day].isActive = e.target.checked;
                          setFormData({ ...formData, workingHours: updated });
                        }}
                        className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-black text-slate-700 capitalize">
                        {day === 'Monday' ? 'الإثنين' : day === 'Tuesday' ? 'الثلاثاء' : day === 'Wednesday' ? 'الأربعاء' : day === 'Thursday' ? 'الخميس' : day === 'Friday' ? 'الجمعة' : day === 'Saturday' ? 'السبت' : 'الأحد'}
                      </span>
                    </div>

                    <div className={`flex flex-1 items-center gap-4 transition-opacity ${formData.workingHours?.[day]?.isActive ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                      <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">من</label>
                        <input
                          type="time"
                          value={formData.workingHours?.[day]?.start || '09:00'}
                          onChange={(e) => {
                            const updated = { ...formData.workingHours };
                            updated[day].start = e.target.value;
                            setFormData({ ...formData, workingHours: updated });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-2 px-3 text-xs font-bold outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">إلى</label>
                        <input
                          type="time"
                          value={formData.workingHours?.[day]?.end || '17:00'}
                          onChange={(e) => {
                            const updated = { ...formData.workingHours };
                            updated[day].end = e.target.value;
                            setFormData({ ...formData, workingHours: updated });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-2 px-3 text-xs font-bold outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {!formData.workingHours?.[day]?.isActive && (
                      <div className="flex-1 flex items-center justify-end">
                        <span className="text-xs font-bold text-slate-400 italic">مغلق / إجازة</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>


          <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
            <div>
              {success && (
                <span className="flex items-center gap-2 text-sm font-bold text-emerald-500 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                  <CheckCircle2 size={18} /> Profile updated successfully
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-70 disabled:hover:scale-100 hover:scale-105"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Profile;
