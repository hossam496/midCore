import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
  ArrowRight,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { getConversations, getMessages, sendMessageApi, uploadChatFile } from '../../../api/chatApi';
import getImageUrl from '../../../utils/imageUrl';
import { useAuth } from '../../../context/AuthContext';
import gsap from 'gsap';

const Messages = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeView, setActiveView] = useState('list'); // 'list', 'chat'
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // ── Fetch Conversations ─────────────────────────────────────────────────────
  const fetchConvs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getConversations();
      setConversations(res.data.conversations || []);

      const stateConvId = location.state?.selectedConversationId || sessionStorage.getItem('medcore_selected_chat');
      if (stateConvId) {
        const found = res.data.conversations.find(c => c._id === stateConvId);
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
  }, [location.state]);

  useEffect(() => {
    fetchConvs();
  }, [fetchConvs]);

  // ── Fetch Messages with Retry Logic ───────────────────────────────────────
  const fetchMessages = useCallback(async (isInitial = false) => {
    if (!selectedConv?._id) return;
    try {
      if (isInitial) setMessagesLoading(true);
      const res = await getMessages(selectedConv._id);
      setMessages(res.data.messages || []);
      if (isInitial) setTimeout(() => scrollToBottom('auto'), 100);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch messages', err);
      if (isInitial) setError('فشل في تحميل الرسائل. جاري إعادة المحاولة...');
    } finally {
      if (isInitial) setMessagesLoading(false);
    }
  }, [selectedConv?._id]);

  useEffect(() => {
    if (!selectedConv?._id) return;
    sessionStorage.setItem('medcore_selected_chat', selectedConv._id);
    fetchMessages(true);

    const interval = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(interval);
  }, [selectedConv?._id, fetchMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;

    const text = newMessage.trim();
    setNewMessage('');

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
      setNewMessage(text); // Restore text on failure
      alert('فشل في إرسال الرسالة. يرجى التحقق من الاتصال.');
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
      alert('فشل في رفع الملف.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getOtherParticipant = (conv) => {
    return conv?.participants?.find(p => p._id !== user?._id);
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    return other?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeOther = selectedConv ? getOtherParticipant(selectedConv) : null;

  if (loading && conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f0f2f5]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#00a884]" />
          <p className="text-slate-500 font-medium">جاري تحميل المحادثات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] bg-[#f0f2f5] overflow-hidden rounded-xl shadow-2xl border border-slate-200 lg:mx-4" dir="rtl">
      {/* ── Left Side: Conversation List ───────────────────────────────────── */}
      <div className={`w-full lg:w-[400px] border-l border-slate-300 flex flex-col bg-white ${activeView === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 bg-[#f0f2f5] flex justify-between items-center shrink-0">
          <div className="w-10 h-10 rounded-full bg-slate-300 overflow-hidden flex items-center justify-center text-slate-600">
            {user?.profileImage ? <img src={getImageUrl(user.profileImage)} alt="me" /> : <User size={24} />}
          </div>
          <div className="flex gap-4 text-slate-500">
            <MessageSquare size={20} className="cursor-pointer" />
            <MoreVertical size={20} className="cursor-pointer" />
          </div>
        </div>

        {/* Search */}
        <div className="p-2 bg-white shrink-0">
          <div className="relative bg-[#f0f2f5] rounded-lg flex items-center px-3 py-1.5">
            <Search size={18} className="text-slate-500 ml-3" />
            <input
              type="text"
              placeholder="البحث أو بدء دردشة جديدة"
              className="bg-transparent border-none outline-none text-sm w-full font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-10 text-center text-slate-400">لا توجد محادثات</div>
          ) : (
            filteredConversations.map(conv => {
              const other = getOtherParticipant(conv);
              const isActive = selectedConv?._id === conv._id;
              return (
                <div
                  key={conv._id}
                  onClick={() => {
                    setSelectedConv(conv);
                    setActiveView('chat');
                  }}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-[#f5f6f6] transition-colors border-b border-slate-100 ${isActive ? 'bg-[#f0f2f5]' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-slate-400 overflow-hidden">
                    {other?.profileImage ? <img src={getImageUrl(other.profileImage)} className="w-full h-full object-cover" /> : <User size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-slate-800 truncate">{other?.name}</h4>
                      <span className="text-[10px] text-slate-500">
                        {conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                      {conv.lastMessage?.sender === user._id && <CheckCheck size={14} className="text-blue-400 shrink-0" />}
                      {conv.lastMessage?.text || 'ابدأ المحادثة...'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Side: Active Chat ────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col bg-[#efeae2] relative ${activeView === 'list' ? 'hidden lg:flex' : 'flex'}`}>
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="p-3 bg-[#f0f2f5] flex justify-between items-center shrink-0 z-10 border-r border-slate-200">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveView('list')} className="lg:hidden p-1">
                  <ArrowRight size={24} className="text-slate-600" />
                </button>
                <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-500 overflow-hidden shrink-0">
                  {activeOther?.profileImage ? <img src={getImageUrl(activeOther.profileImage)} className="w-full h-full object-cover" /> : <User size={24} />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm lg:text-base truncate">{activeOther?.name}</h3>
                  <p className="text-[10px] text-[#00a884] font-bold">متصل الآن</p>
                </div>
              </div>
              <div className="flex gap-4 text-slate-500 px-2">
                <Search size={20} className="cursor-pointer" />
                <MoreVertical size={20} className="cursor-pointer" />
              </div>
            </div>

            {/* Chat Area */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 relative"
              style={{ 
                backgroundColor: '#efeae2',
                backgroundImage: `url("https://w0.peakpx.com/wallpaper/580/630/wallpaper-whatsapp-background.jpg")`,
                backgroundSize: '400px',
                backgroundRepeat: 'repeat'
              }}
            >
              {messagesLoading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#00a884]" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                  <div className="bg-white/80 p-4 rounded-2xl text-center max-w-xs">
                    <p className="text-sm font-bold text-slate-600">لا توجد رسائل بعد. ابدأ المحادثة الآن!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                  const prevMsg = messages[idx - 1];
                  const isSameSender = prevMsg && (prevMsg.sender?._id === (msg.sender?._id || msg.sender) || prevMsg.sender === (msg.sender?._id || msg.sender));
                  
                  return (
                    <div key={msg._id || idx} className={`flex ${isMe ? 'justify-start' : 'justify-end'} ${isSameSender ? 'mt-0.5' : 'mt-3'}`}>
                      <div 
                        className={`max-w-[85%] lg:max-w-[65%] px-3 py-1.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative
                          ${isMe 
                            ? 'bg-[#d9fdd3] rounded-l-lg rounded-br-lg' 
                            : 'bg-white rounded-r-lg rounded-bl-lg'
                          }
                        `}
                      >
                        {/* Bubble Tail (only for first message in group) */}
                        {!isSameSender && (
                          <div className={`absolute top-0 w-3 h-4 ${isMe ? '-right-2' : '-left-2'}`}>
                            <svg viewBox="0 0 8 13" preserveAspectRatio="none" className={isMe ? 'text-[#d9fdd3]' : 'text-white'} style={{ transform: isMe ? 'scaleX(-1)' : 'none' }}>
                              <path fill="currentColor" d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"></path>
                            </svg>
                          </div>
                        )}

                        {msg.messageType === 'image' && (
                          <div className="mb-2 overflow-hidden rounded-lg bg-slate-100 min-h-[100px] flex items-center justify-center">
                            <img 
                              src={getImageUrl(msg.fileUrl)} 
                              alt="img" 
                              className="max-w-full h-auto cursor-pointer object-cover hover:opacity-90 transition-opacity" 
                              onClick={() => setSelectedImage(getImageUrl(msg.fileUrl))}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/400x300/e2e8f0/64748b?text=Image+Unavailable";
                              }}
                            />
                          </div>
                        )}

                        <div className="flex flex-col">
                          <p className="text-[13px] text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[9px] text-slate-500">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && <CheckCheck size={14} className="text-[#53bdeb]" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-2 bg-[#f0f2f5] shrink-0 z-10 flex items-center gap-2">
              <div className="flex gap-2 text-slate-600 px-2">
                <Smile size={24} className="cursor-pointer hover:text-slate-800 transition-colors" />
                <Paperclip 
                  size={24} 
                  className="cursor-pointer hover:text-slate-800 transition-colors" 
                  onClick={() => fileInputRef.current?.click()}
                />
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
              </div>

              <form onSubmit={handleSendMessage} className="flex-1">
                <input
                  type="text"
                  placeholder="اكتب رسالة"
                  className="w-full bg-white rounded-lg px-4 py-2 text-sm outline-none border-none"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
              </form>

              <div className="px-2">
                {newMessage.trim() ? (
                  <button onClick={handleSendMessage} className="text-[#00a884] hover:scale-110 transition-transform">
                    <Send size={24} />
                  </button>
                ) : (
                  <Mic size={24} className="text-slate-600 cursor-pointer" />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-[#f0f2f5]">
            <div className="w-64 h-64 opacity-10 mb-8">
              <img src="https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png" alt="intro" className="grayscale" />
            </div>
            <h2 className="text-2xl font-light text-slate-600 mb-2">واتساب ويب</h2>
            <p className="text-slate-500 text-sm max-w-md">استخدم ميد-كور للتواصل السريع مع أطبائك. رسائلك محمية ومشفرة تماماً.</p>
            <div className="mt-10 flex items-center gap-2 text-slate-400 text-xs">
              <MessageSquare size={14} />
              <span>مشفر تماماً بين الطرفين</span>
            </div>
          </div>
        )}
      </div>
 
      {/* ── Image Lightbox Modal ────────────────────────────────────────────── */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-slate-300 transition-colors z-[110]"
            onClick={() => setSelectedImage(null)}
          >
            <ChevronLeft size={40} className="rotate-180" />
          </button>
          
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img 
              src={selectedImage} 
              alt="Full view" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
            />
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
              <a 
                href={selectedImage} 
                download="medcore-image" 
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full backdrop-blur-md transition-all flex items-center gap-2 border border-white/20"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={20} />
                <span>حفظ الصورة</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
