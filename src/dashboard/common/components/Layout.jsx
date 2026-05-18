import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, menuItems, roleName }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('mc_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('mc_sidebar_collapsed', desktopCollapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [desktopCollapsed]);

  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);

  const location = useLocation();
  const isChatPage = location.pathname.includes('/messages') || location.pathname.includes('/chat/');

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 flex font-sans text-slate-900">
      <Sidebar
        menuItems={menuItems}
        roleName={roleName}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
        desktopCollapsed={desktopCollapsed}
        onToggleDesktopCollapse={() => setDesktopCollapsed((c) => !c)}
      />

      <main
        className={`flex flex-1 flex-col overflow-x-hidden transition-[margin] duration-300 ease-out w-full min-w-0 ${
          isChatPage ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'
        } ${
          desktopCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <Header
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          desktopCollapsed={desktopCollapsed}
          onToggleDesktopSidebar={() => setDesktopCollapsed((c) => !c)}
        />
        <div className={`relative z-0 flex min-h-0 flex-1 flex-col overflow-x-hidden ${
          isChatPage ? 'overflow-hidden p-0 sm:p-3 lg:p-4' : 'overflow-y-auto p-4 sm:p-6 lg:p-8'
        }`}>
          <div className={`mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col ${
            isChatPage ? 'max-w-full h-full' : 'max-w-[1600px]'
          }`}>{children}</div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
