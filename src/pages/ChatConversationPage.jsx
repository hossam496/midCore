import React from 'react';
import Messages from '../dashboard/doctor/pages/Messages';

/**
 * Deep-link target for push + PWA: /chat/:conversationId
 * (Realtime delivery uses Pusher private channels; background uses FCM.)
 */
const ChatConversationPage = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 lg:pt-32 pb-4 lg:pb-10">
      <div className="container mx-auto px-1 sm:px-4 md:px-8 max-w-7xl">
        <div className="mb-4 lg:mb-8 px-4 sm:px-0 hidden sm:block">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">المحادثة</h1>
          <p className="text-sm lg:text-base text-slate-500 mt-1 font-medium">
            محادثة مباشرة — التحديثات فورية عبر Pusher.
          </p>
        </div>
        <div className="bg-white rounded-3xl lg:rounded-[2.5rem] p-1 lg:p-2 border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden h-[calc(100vh-120px)] lg:h-auto">
          <Messages />
        </div>
      </div>
    </div>
  );
};

export default ChatConversationPage;
