import React, { useState, useEffect, useCallback } from 'react';
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
        className={`flex min-h-[100dvh] flex-1 flex-col overflow-x-hidden transition-[margin] duration-300 ease-out w-full min-w-0 ${
          desktopCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <Header
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          desktopCollapsed={desktopCollapsed}
          onToggleDesktopSidebar={() => setDesktopCollapsed((c) => !c)}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px] min-w-0 flex-1">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
