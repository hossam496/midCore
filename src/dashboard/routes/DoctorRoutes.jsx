import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../common/components/Layout';
import Dashboard from '../doctor/pages/Dashboard';
import Patients from '../doctor/pages/Patients';
import Schedule from '../doctor/pages/Schedule';
import Messages from '../doctor/pages/Messages';
import Profile from '../doctor/pages/Profile';
import PatientProfile from '../doctor/pages/PatientProfile';
import { Home, Users, Calendar, MessageSquare, User as UserIcon } from 'lucide-react';

const DoctorRoutes = () => {
  const menuItems = [
    { icon: Home, label: 'لوحة التحكم', path: '/doctor/dashboard' },
    { icon: Users, label: 'المرضى', path: '/doctor/patients' },
    { icon: Calendar, label: 'المواعيد', path: '/doctor/schedule' },
    { icon: MessageSquare, label: 'الرسائل', path: '/doctor/messages', badge: true },
    { icon: UserIcon, label: 'الملف الشخصي', path: '/doctor/profile' },
  ];

  return (
    <Layout menuItems={menuItems} roleName="طبيب">
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/:id" element={<PatientProfile />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="messages" element={<Messages />} />
        <Route path="chat/:conversationId" element={<Messages />} />
        <Route path="profile" element={<Profile />} />
      </Routes>
    </Layout>
  );
};

export default DoctorRoutes;
