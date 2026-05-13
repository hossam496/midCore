import React from 'react';
import Messages from '../dashboard/doctor/pages/Messages';

const PatientMessagesPage = () => {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f8fafc] pt-[72px] lg:pt-[88px]">
      <div className="mx-auto flex w-full max-w-[1600px] min-h-0 flex-1 flex-col px-2 sm:px-4 lg:px-6 py-2 lg:py-4">
        <div className="mb-2 hidden shrink-0 px-2 sm:block lg:mb-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-800 lg:text-2xl">رسائلك</h1>
          <p className="mt-1 text-xs font-medium text-slate-500 lg:text-sm">
            تحدث مع أطبائك وابق على اطلاع دائم باستشاراتك الطبية.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Messages />
        </div>
      </div>
    </div>
  );
};

export default PatientMessagesPage;
