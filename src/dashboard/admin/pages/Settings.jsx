import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../../api/settingsApi';
import { 
  Shield, 
  Settings as SettingsIcon, 
  Users, 
  Globe, 
  Lock, 
  Eye, 
  FileText,
  Database,
  Save,
  CheckCircle2,
  ChevronRight,
  Plus
} from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    facilityName: '',
    departmentCode: '',
    physicalAddress: '',
    mfaEnabled: true,
    smsVerification: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await getSettings();
        setSettings(res.data.settings);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const toggleMFA = () => setSettings(prev => ({ ...prev, mfaEnabled: !prev.mfaEnabled }));
  const toggleSMS = () => setSettings(prev => ({ ...prev, smsVerification: !prev.smsVerification }));

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Loading Configuration...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">System Configuration</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage hospital profile, security protocols, and role-based access control.</p>
        </div>
        {showSuccess && (
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold border border-emerald-100">
              <CheckCircle2 size={14} />
              Global settings updated successfully.
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Hospital Profile */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Hospital Profile</h2>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-emerald-100">Verified</span>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Facility Name</label>
              <input 
                type="text" 
                name="facilityName"
                value={settings.facilityName}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:bg-white outline-none transition-all"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Department Code</label>
              <input 
                type="text" 
                name="departmentCode"
                value={settings.departmentCode}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
            <input 
              type="text" 
              name="physicalAddress"
              value={settings.physicalAddress}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:bg-white outline-none transition-all"
            />
          </div>

          <button className="flex items-center gap-2 text-blue-600 text-xs font-bold hover:underline">
            <Plus size={14} /> Update Legal Documentation
          </button>
        </div>

        {/* Security Guard */}
        <div className="lg:col-span-5 bg-blue-600 p-8 rounded-3xl shadow-xl shadow-blue-600/20 text-white space-y-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          
          <div className="relative">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Shield size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Security Guard</h2>
            <p className="text-blue-100 text-sm font-medium">Multi-factor authentication is currently enabled.</p>
          </div>

          <div className="space-y-6 relative">
            <div className="flex justify-between items-center p-4 bg-white/10 rounded-2xl border border-white/10 group/item hover:bg-white/15 transition-colors">
              <span className="text-sm font-bold">Authenticator App</span>
              <button 
                onClick={toggleMFA}
                className={`w-12 h-6 rounded-full relative transition-colors ${settings.mfaEnabled ? 'bg-emerald-500' : 'bg-white/20'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.mfaEnabled ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/10 rounded-2xl border border-white/10 group/item hover:bg-white/15 transition-colors">
              <span className="text-sm font-bold">SMS Verification</span>
              <button 
                onClick={toggleSMS}
                className={`w-12 h-6 rounded-full relative transition-colors ${settings.smsVerification ? 'bg-emerald-500' : 'bg-white/20'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.smsVerification ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* User Role Permissions */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2">Categories</p>
            {[
              { label: 'Role Permissions', icon: Users, active: true },
              { label: 'API Integrations', icon: Globe },
              { label: 'Privacy Controls', icon: Lock },
              { label: 'Audit Logs', icon: Database },
            ].map((cat, i) => (
              <button 
                key={i} 
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-xs transition-all
                  ${cat.active ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50'}
                `}
              >
                <cat.icon size={16} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-9 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-xl font-bold text-slate-800">User Role Permissions</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Define what each user category can access and edit.</p>
            </div>
            <button className="text-blue-600 text-xs font-bold hover:underline">Add Custom Role</button>
          </div>

          <div className="space-y-6">
            {[
              { role: 'Administrator', desc: 'Full system access, billing control, and user management.', tags: ['BILLING', 'USERS', 'CLINICAL'], color: 'bg-purple-50 text-purple-600' },
              { role: 'Doctor / Practitioner', desc: 'Patient records, prescriptions, and diagnostic tools.', tags: ['CLINICAL', 'RECORDS'], color: 'bg-blue-50 text-blue-600' },
              { role: 'Nurse / Assistant', desc: 'Vitals logging, patient intake, and scheduling.', tags: ['CLINICAL', 'INTAKE'], color: 'bg-emerald-50 text-emerald-600' },
            ].map((role, i) => (
              <div key={i} className="flex items-center justify-between p-6 bg-slate-50/50 border border-slate-50 rounded-2xl group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-100 transition-all cursor-pointer">
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role.color}`}>
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{role.role}</h3>
                    <p className="text-[11px] font-medium text-slate-500 mt-1 max-w-md">{role.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex gap-2">
                    {role.tags.map((tag, j) => (
                      <span key={j} className="px-2 py-1 bg-white border border-slate-100 rounded text-[8px] font-bold text-slate-400 uppercase tracking-widest">{tag}</span>
                    ))}
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Update settings for global application</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
