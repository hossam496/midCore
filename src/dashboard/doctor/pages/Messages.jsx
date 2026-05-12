import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import {
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  FileText,
  Download,
  User,
  MessageSquare,
  ChevronLeft,
  Check,
  CheckCheck,
  Mic,
  Camera,
  ArrowRight,
  Image as ImageIcon,
  Loader2,
  Phone,
  Video,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getConversations, getMessages, sendMessageApi, uploadChatFile } from '../../../api/chatApi';
import getImageUrl from '../../../utils/imageUrl';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import toast from 'react-hot-toast';

const Messages = () => {
  const { user } = useAuth();
  const { channel, emitTyping, typingStatus } = useSocket();
  const location = useLocation();
  const routeParams = useParams();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activeView, setActiveView] = useState('list'); // 'list', 'chat'
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // ── Fetch Conversations ─────────────────────────────────────────────────────
  const fetchConvs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getConversations();
      setConversations(res.data.conversations || []);

      const queryConvId = searchParams.get('c');
      const pathConvId = routeParams.conversationId;
      const stateConvId =
        location.state?.selectedConversationId ||
        pathConvId ||
        queryConvId ||
        sessionStorage.getItem('medcore_selected_chat');
      if (stateConvId) {
        const found = res.data.conversations.find((c) => c._id === stateConvId);
        if (found) {
          setSelectedConv(found);
          setActiveView('chat');
        }
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
      setError('تعذر تحميل المحادثات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [location.state, location.search, searchParams, routeParams.conversationId]);

  useEffect(() => {
    fetchConvs();
  }, [fetchConvs]);

  // ── Fetch Messages ─────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      setMessagesLoading(true);
      const res = await getMessages(convId);
      const msgs = res.data.messages || [];
      console.log(`✅ Received ${msgs.length} messages`);
      setMessages(msgs);
      setTimeout(() => scrollToBottom('auto'), 100);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to fetch messages:', err);
      setError('فشل في تحميل الرسائل.');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConv?._id) {
      console.log('🔄 Fetching messages for:', selectedConv._id);
      sessionStorage.setItem('medcore_selected_chat', selectedConv._id);
      
      // OPTIMISTIC UPDATE: Clear unread count locally for this user
      setConversations(prev => prev.map(c => {
        if (c._id === selectedConv._id) {
          return {
            ...c,
            unreadCount: { ...c.unreadCount, [user._id]: 0 }
          };
        }
        return c;
      }));

      fetchMessages(selectedConv._id);
    }
  }, [selectedConv?._id, fetchMessages, user._id]);

  // ── Pusher Event Listeners ──────────────────────────────────────────────────
  useEffect(() => {
    if (!channel) return;

    const handleNewMessage = (msg) => {
      // If message belongs to current chat, add it
      if (selectedConv && msg.conversation === selectedConv._id) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => scrollToBottom('smooth'), 50);
      }

      // Update conversations list
      setConversations(prev => prev.map(c => {
        if (c._id === msg.conversation) {
          const isSelected = selectedConv && selectedConv._id === c._id;
          const newUnread = isSelected ? 0 : (c.unreadCount?.[user._id] || 0) + 1;
          return { 
            ...c, 
            lastMessage: msg, 
            updatedAt: new Date(),
            unreadCount: { ...c.unreadCount, [user._id]: newUnread }
          };
        }
        return c;
      }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    };

    const handleMessagesSeen = ({ conversationId, seenBy }) => {
      if (selectedConv?._id === conversationId) {
        setMessages(prev => prev.map(m => ({
          ...m,
          seenBy: m.seenBy.includes(seenBy) ? m.seenBy : [...m.seenBy, seenBy]
        })));
      }
      
      setConversations(prev => prev.map(c => {
        if (c._id === conversationId) {
          const newUnreadCount = { ...c.unreadCount };
          newUnreadCount[seenBy] = 0;
          return { ...c, unreadCount: newUnreadCount };
        }
        return c;
      }));
    };

    channel.bind('new-message', handleNewMessage);
    channel.bind('message-seen', handleMessagesSeen);

    return () => {
      try {
        if (channel) {
          channel.unbind('new-message', handleNewMessage);
          channel.unbind('message-seen', handleMessagesSeen);
        }
      } catch (error) {
        // Silent catch
      }
    };
  }, [channel, selectedConv, user._id]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;

    const text = newMessage.trim();
    setNewMessage('');
    handleStopTyping();

    try {
      const res = await sendMessageApi(selectedConv._id, text);
      const msg = res.data.message;
      setMessages(prev => [...prev, msg]);
      setTimeout(() => scrollToBottom('smooth'), 50);
      
      setConversations(prev => prev.map(c =>
        c._id === selectedConv._id ? { ...c, lastMessage: msg, updatedAt: new Date() } : c
      ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    } catch (err) {
      console.error('Failed to send message', err);
      setNewMessage(text);
      toast.error('فشل في إرسال الرسالة.');
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (selectedConv) {
      const other = getOtherParticipant(selectedConv);
      if (other) {
        emitTyping(selectedConv._id, other._id, true);
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          emitTyping(selectedConv._id, other._id, false);
        }, 3000);
      }
    }
  };

  const handleStopTyping = () => {
    if (selectedConv) {
      const other = getOtherParticipant(selectedConv);
      if (other) {
        emitTyping(selectedConv._id, other._id, false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedConv) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const res = await uploadChatFile(formData);
      const { fileUrl, fileName, fileType } = res.data;

      const messageRes = await sendMessageApi(selectedConv._id, {
        messageType: fileType === 'image' ? 'image' : 'file',
        fileUrl,
        fileName,
        text: `أرسل ${fileType === 'image' ? 'صورة' : 'ملفاً'}`
      });

      const msg = messageRes.data.message;
      setMessages(prev => [...prev, msg]);
      setTimeout(() => scrollToBottom('smooth'), 50);
    } catch (err) {
      console.error('Failed to upload file', err);
      toast.error('فشل في رفع الملف.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getOtherParticipant = (conv) => {
    return conv?.participants?.find((p) => String(p._id) !== String(user?._id));
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    return other?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeOther = selectedConv ? getOtherParticipant(selectedConv) : null;
  const isOtherOnline = !!activeOther?.isOnline;

  if (loading && conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-slate-500 font-medium animate-pulse">جاري تحميل المحادثات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg sm:rounded-3xl sm:shadow-2xl lg:shadow-2xl h-[calc(100dvh-7.5rem)] min-h-[320px] sm:h-[calc(100dvh-8rem)] lg:h-[calc(100vh-7rem)]" dir="rtl">
      {/* ── Left Side: Conversation List ───────────────────────────────────── */}
      <div className={`w-full lg:w-[400px] border-l border-slate-100 flex flex-col bg-white ${activeView === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-6 border-b border-slate-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-blue-50 overflow-hidden flex items-center justify-center text-blue-600 border border-blue-100 relative shadow-inner">
              {user?.profileImage ? <img src={getImageUrl(user.profileImage)} alt="me" className="w-full h-full object-cover" /> : <User size={24} />}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h2 className="font-bold text-slate-800">محادثاتي</h2>
              <p className="text-[10px] text-slate-400 font-medium">ابدأ التواصل الآن</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4 shrink-0">
          <div className="relative group">
            <Search size={18} className="text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="البحث في المحادثات..."
              className="bg-slate-50 border border-slate-100 outline-none text-sm w-full font-medium py-3 pr-11 pl-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center gap-3">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <MessageSquare size={32} />
               </div>
               <p className="text-slate-400 text-sm font-medium">لا توجد محادثات تطابق بحثك</p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const other = getOtherParticipant(conv);
              const isActive = selectedConv?._id === conv._id;
              const isUserOnlineNow = !!other?.isOnline;
              const unread = conv.unreadCount?.[user._id] || 0;
              const isTyping = typingStatus[conv._id];

              return (
                <motion.div
                  key={conv._id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedConv(conv);
                    setActiveView('chat');
                  }}
                  className={`flex items-center gap-4 p-4 cursor-pointer rounded-2xl transition-all duration-200 relative group
                    ${isActive ? 'bg-blue-50 shadow-sm border border-blue-100/50' : 'hover:bg-slate-50 border border-transparent'}
                  `}
                >
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200">
                      {other?.profileImage ? <img src={getImageUrl(other.profileImage)} className="w-full h-full object-cover" /> : <User size={28} />}
                    </div>
                    {isUserOnlineNow && (
                      <span className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-500 border-4 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className={`font-bold truncate ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
                        {other?.name || 'مستخدم مدكور'}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                       <p className={`text-xs truncate flex items-center gap-1 ${unread > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                          {isTyping ? (
                            <span className="text-green-500 animate-pulse font-bold">يكتب الآن...</span>
                          ) : (
                            <>
                              {conv.lastMessage?.sender === user._id && (
                                <CheckCheck size={14} className={conv.lastMessage?.seenBy?.length > 1 ? 'text-blue-400' : 'text-slate-300'} />
                              )}
                               {conv.lastMessage?.messageType === 'image' ? (
                                 <span className="flex items-center gap-1 italic">
                                   <Camera size={12} className="text-blue-400" />
                                   أرسل صورة
                                 </span>
                               ) : (
                                 conv.lastMessage?.text || 'ابدأ المحادثة الآن'
                               )}
                            </>
                          )}
                       </p>
                       <AnimatePresence>
                        {unread > 0 && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="bg-blue-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-lg shadow-blue-200"
                          >
                            {unread}
                          </motion.span>
                        )}
                       </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Side: Active Chat ────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col bg-[#F8FAFC] relative ${activeView === 'list' ? 'hidden lg:flex' : 'flex'}`}>
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white/80 backdrop-blur-md flex justify-between items-center shrink-0 z-10 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveView('list')} className="lg:hidden p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <ArrowRight size={20} className="text-slate-600" />
                </button>
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                    {activeOther?.profileImage ? <img src={getImageUrl(activeOther.profileImage)} className="w-full h-full object-cover" /> : <User size={24} />}
                  </div>
                  {isOtherOnline && (
                    <span className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-500 border-4 border-white rounded-full"></span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm lg:text-base truncate leading-none">{activeOther?.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    {typingStatus[selectedConv._id] ? (
                      <span className="text-[10px] text-green-500 font-bold animate-pulse">يكتب الآن...</span>
                    ) : (
                      <span className={`text-[10px] font-bold ${isOtherOnline ? 'text-green-500' : 'text-slate-400'}`}>
                        {isOtherOnline ? 'متصل الآن' : 'غير متصل'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 text-slate-400">
                <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all">
                  <Phone size={20} />
                </button>
                <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all">
                  <Video size={20} />
                </button>
                <button className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 relative scroll-smooth"
              style={{ 
                backgroundColor: '#f8fafc',
                backgroundImage: `radial-gradient(#e2e8f0 1px, transparent 0)`,
                backgroundSize: '32px 32px'
              }}
            >
              <div className="flex justify-center mb-8">
                 <span className="px-4 py-1 bg-white/50 backdrop-blur-sm border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
                   بداية المحادثة الآمنة
                 </span>
              </div>

              {messagesLoading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-60">
                   <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-blue-500 border border-slate-100">
                      <MessageSquare size={32} />
                   </div>
                   <p className="text-sm font-bold text-slate-500">ابدأ المحادثة مع {activeOther?.name}</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                  const prevMsg = messages[idx - 1];
                  const isSameSender = prevMsg && (prevMsg.sender?._id === (msg.sender?._id || msg.sender) || prevMsg.sender === (msg.sender?._id || msg.sender));
                  const isSeen = msg.seenBy?.length > 1;

                  return (
                    <motion.div 
                      key={msg._id || idx}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${isMe ? 'justify-start flex-row-reverse' : 'justify-start'} ${isSameSender ? 'mt-1' : 'mt-6'}`}
                    >
                       {!isSameSender && (
                          <div className={`w-8 h-8 rounded-xl shrink-0 mt-auto ${isMe ? 'mr-2' : 'ml-2'} overflow-hidden border border-white shadow-sm bg-slate-100`}>
                             <img 
                                src={isMe ? getImageUrl(user.profileImage) : getImageUrl(activeOther?.profileImage)} 
                                className="w-full h-full object-cover"
                                alt="avatar"
                             />
                          </div>
                       )}
                       {isSameSender && <div className="w-8 h-8 shrink-0 ml-2" />}

                      <div 
                        className={`max-w-[75%] lg:max-w-[60%] px-4 py-3 relative shadow-sm
                          ${isMe 
                            ? 'bg-blue-600 text-white rounded-3xl rounded-tr-none' 
                            : 'bg-white text-slate-800 rounded-3xl rounded-tl-none border border-slate-100'
                          }
                        `}
                      >
                        {msg.messageType === 'image' && (
                          <div className="mb-2 overflow-hidden rounded-2xl bg-slate-50 min-h-[150px] flex items-center justify-center border border-black/5">
                            <img 
                              src={getImageUrl(msg.fileUrl)} 
                              alt="img" 
                              className="max-w-full h-auto cursor-pointer object-cover hover:opacity-90 transition-opacity" 
                              onClick={() => setSelectedImage(getImageUrl(msg.fileUrl))}
                            />
                          </div>
                        )}

                        <div className="flex flex-col">
                          <p className="text-[14px] leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
                          <div className={`flex items-center justify-end gap-1.5 mt-2 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                            <span className="text-[9px] font-bold">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              isSeen ? <CheckCheck size={14} className="text-white" /> : <Check size={14} />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="sticky bottom-0 z-20 shrink-0 border-t border-slate-100 bg-white/95 p-3 backdrop-blur-md supports-[padding:max(0px)]:pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-4">
              <div className="max-w-5xl mx-auto flex items-end gap-3 bg-slate-50 p-2 rounded-[2rem] border border-slate-200 focus-within:border-blue-400 focus-within:bg-white transition-all shadow-inner">
                <div className="flex gap-1 shrink-0 pb-1">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-full transition-all"
                  >
                    <Paperclip size={20} />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                </div>

                <form onSubmit={handleSendMessage} className="flex-1 min-w-0">
                  <textarea
                    rows={1}
                    placeholder="اكتب رسالتك هنا..."
                    className="w-full bg-transparent border-none outline-none py-3 px-2 text-sm font-medium resize-none max-h-32 text-slate-800 placeholder:text-slate-400"
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                </form>

                <div className="shrink-0 flex gap-1 pb-1 pr-1">
                   <button className="p-2.5 text-slate-400 hover:text-blue-600 transition-colors">
                      <Smile size={20} />
                   </button>
                   <AnimatePresence mode="wait">
                    {newMessage.trim() ? (
                      <motion.button 
                        key="send"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        onClick={handleSendMessage} 
                        className="bg-blue-600 text-white p-3 rounded-full shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Send size={18} className="mr-0.5" />
                      </motion.button>
                    ) : (
                      <motion.button 
                        key="mic"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="bg-slate-200 text-slate-500 p-3 rounded-full hover:bg-slate-300 transition-all"
                      >
                        <Mic size={18} />
                      </motion.button>
                    )}
                   </AnimatePresence>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-slate-50">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="max-w-md flex flex-col items-center"
            >
               <div className="w-32 h-32 bg-blue-50 rounded-[3rem] flex items-center justify-center text-blue-600 mb-8 shadow-xl shadow-blue-100/50 border border-blue-100">
                  <MessageSquare size={54} />
               </div>
               <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">مرحباً بك في المحادثات</h2>
               <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">
                 اختر أحد المرضى أو الأطباء من القائمة الجانبية لبدء المحادثة الفورية. 
                 رسائلك مشفرة تماماً لضمان خصوصيتك الطبية.
               </p>
               <div className="flex items-center gap-6 text-slate-400">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                     <span className="text-[10px] font-bold uppercase tracking-widest">تحديثات فورية</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                     <span className="text-[10px] font-bold uppercase tracking-widest">تشفير تام</span>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </div>
 
      {/* ── Image Lightbox Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-[110] bg-white/10 p-2 rounded-2xl"
              onClick={() => setSelectedImage(null)}
            >
              <ArrowRight size={32} />
            </button>
            
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="relative max-w-5xl w-full h-full flex items-center justify-center" 
               onClick={e => e.stopPropagation()}
            >
              <img 
                src={selectedImage} 
                alt="Full view" 
                className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-2xl" 
              />
              
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                <a 
                  href={selectedImage} 
                  download="medcore-image" 
                  className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-2xl backdrop-blur-xl transition-all flex items-center gap-3 border border-white/10 font-bold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download size={20} />
                  <span>تحميل الصورة</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messages;
