import React from 'react';
import Messages from '../dashboard/doctor/pages/Messages';

/**
 * Deep-link target for push + PWA: /chat/:conversationId
 * (Realtime delivery uses Pusher private channels; background uses FCM.)
 */
const ChatConversationPage = () => {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f8fafc] pt-20 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pt-24 sm:pb-4 lg:pt-32 lg:pb-10">
      <div className="container mx-auto flex min-h-0 max-w-7xl flex-1 flex-col px-2 sm:px-4 md:px-8">
        <div className="mb-3 hidden shrink-0 px-1 sm:mb-4 sm:block lg:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 lg:text-3xl">المحادثة</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 lg:text-base">
            محادثة مباشرة — التحديثات فورية عبر Pusher.
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg shadow-blue-900/5 sm:rounded-3xl sm:shadow-xl">
          <Messages />
        </div>
      </div>
    </div>
  );
};

export default ChatConversationPage;
