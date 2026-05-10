import React, { useRef } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, menuItems, roleName }) => {
  const sidebarRef = useRef(null);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Sidebar ref={sidebarRef} menuItems={menuItems} roleName={roleName} />
      <main className="flex-1 ml-64 min-h-screen flex flex-col overflow-hidden">
        <Header />
        <div className="p-8 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
