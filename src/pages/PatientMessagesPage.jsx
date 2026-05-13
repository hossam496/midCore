import React from 'react';
import Messages from '../dashboard/doctor/pages/Messages';

const PatientMessagesPage = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 lg:pt-32 pb-4 lg:pb-10 flex min-h-0 flex-1 flex-col">
      <div className="container mx-auto px-1 sm:px-4 md:px-8 max-w-7xl flex min-h-0 flex-1 flex-col">
        <div className="mb-4 lg:mb-8 px-4 sm:px-0 hidden sm:block">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">رسائلك</h1>
          <p className="text-sm lg:text-base text-slate-500 mt-1 font-medium">
            تحدث مع أطبائك وابق على اطلاع دائم باستشاراتك الطبية.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-blue-900/5 h-[calc(100dvh-7.5rem)] min-h-[280px] sm:h-[calc(100dvh-8rem)] lg:h-[min(calc(100dvh-9rem),calc(100vh-8rem))] lg:max-h-[calc(100dvh-8rem)]">
          <Messages />
        </div>
      </div>
    </div>
  );
};

export default PatientMessagesPage;
