import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PWAInstallBanner from '../components/PWAInstallBanner';

const MainLayout = () => {
  const location = useLocation();
  const isChatPage = location.pathname.includes('/messages');

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      {!isChatPage && <Footer />}
      <PWAInstallBanner />
    </div>
  );
};


export default MainLayout;
