import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../common/components/Layout';
import Dashboard from '../admin/pages/Dashboard';
import UsersList from '../admin/pages/Users';
import Reports from '../admin/pages/Reports';
import Settings from '../admin/pages/Settings';
import { LayoutDashboard, Users, BarChart3, Settings as SettingsIcon } from 'lucide-react';

const AdminRoutes = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'التحليلات', path: '/admin/dashboard' },
    { icon: Users, label: 'الكادر', path: '/admin/users' },
    { icon: BarChart3, label: 'التقارير', path: '/admin/reports' },
    { icon: SettingsIcon, label: 'النظام', path: '/admin/settings' },
  ];

  return (
    <Layout menuItems={menuItems} roleName="إداري">
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UsersList />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
};

export default AdminRoutes;
