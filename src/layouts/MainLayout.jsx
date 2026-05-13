import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PWAInstallBanner from '../components/PWAInstallBanner';

const MainLayout = () => {
  const location = useLocation();
  // Patient chat: /messages and deep links /chat/:id (both reuse Messages; hide site footer)
  const isChatPage =
    location.pathname.includes('/messages') || location.pathname.startsWith('/chat/');

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      <Navbar />
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
      {!isChatPage && <Footer />}
      <PWAInstallBanner />
    </div>
  );
};


export default MainLayout;
