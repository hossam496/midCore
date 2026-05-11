import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Video,
  Phone,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  FileText,
  Image as ImageIcon,
  FileArchive,
  Download,
  Calendar,
  ClipboardList,
  Activity,
  User,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Check
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
  const [activeView, setActiveView] = useState('list'); // 'list', 'chat', 'details'
  const [showDetails, setShowDetails] = useState(window.innerWidth > 1024);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setShowDetails(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const emojis = ['😊', '👋', '👍', '👎', '❤️', '🚑', '🩺', '💊', '🌡️', '🏥', '📋', '✅', '❌', '📁', '📄', '🖼️', '🤝', '🙌', '✨', '🔥'];

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Fetch Conversations ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchConvs = async () => {
      try {
        const res = await getConversations();
        setConversations(res.data.conversations);

        // Priority 1: Navigation State
        const stateConvId = location.state?.selectedConversationId;
        // Priority 2: Session Storage (Survival on reload)
        const savedConvId = sessionStorage.getItem('medcore_selected_chat');

        const activeId = stateConvId || savedConvId;

        if (activeId) {
          const found = res.data.conversations.find(c => c._id === activeId);
          if (found) {
            setSelectedConv(found);
            setActiveView('chat');
          }
        }
      } catch (err) {
        console.error('Failed to fetch conversations', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConvs();
  }, [location.state]);

  // Persist selected conversation to session storage
  useEffect(() => {
    if (selectedConv?._id) {
      sessionStorage.setItem('medcore_selected_chat', selectedConv._id);
    }
  }, [selectedConv?._id]);

  // ── Fetch Messages for Selected Conversation ──────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!selectedConv?._id) return;
    try {
      const res = await getMessages(selectedConv._id);
      setMessages(res.data.messages);
      // Only scroll to bottom on first load or if messages change
      // For polling, we might want a different logic, but this is simple
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  }, [selectedConv?._id]);

  useEffect(() => {
    if (!selectedConv?._id) return;

    setMessagesLoading(true);
    fetchMessages().finally(() => {
      setMessagesLoading(false);
      setTimeout(scrollToBottom, 100);
    });

    // Replace real-time with polling (every 10 seconds)
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [selectedConv?._id, fetchMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;

    const text = newMessage.trim();
    setNewMessage('');
    setShowEmojiPicker(false);

    try {
      const res = await sendMessageApi(selectedConv._id, text);
      const msg = res.data.message;
      setMessages(prev => [...prev, msg]);

      // Update conversations list
      setConversations(prev => prev.map(c =>
        c._id === selectedConv._id ? { ...c, lastMessage: msg, updatedAt: new Date() } : c
      ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
      
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error('Failed to send message', err);
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
        messageType: fileType,
        fileUrl,
        fileName,
        text: newMessage.trim() || `Sent a ${fileType}`
      });

      const msg = messageRes.data.message;
      setMessages(prev => [...prev, msg]);

      setConversations(prev => prev.map(c =>
        c._id === selectedConv._id ? { ...c, lastMessage: msg, updatedAt: new Date() } : c
      ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));

      setNewMessage('');
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error('Failed to upload file', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getOtherParticipant = (conv) => {
    return conv.participants.find(p => p._id !== user._id);
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    return other?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) return <div className="p-8 text-center font-bold text-slate-500">Loading Conversations...</div>;

  const activeOther = selectedConv ? getOtherParticipant(selectedConv) : null;

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col lg:flex-row gap-4 lg:gap-8 animate-in fade-in duration-500 overflow-hidden relative">
      {/* Left Column: Chat List */}
      <div className={`flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full lg:w-80 lg:flex ${activeView === 'list' ? 'flex w-full' : 'hidden'}`}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Direct Messages</h2>
          <div className="flex gap-2 p-1 bg-slate-50 rounded-xl mb-6">
            <button className="flex-1 py-2 text-[10px] font-bold text-blue-600 bg-white rounded-lg shadow-sm tracking-widest uppercase">Patients</button>
            <button className="flex-1 py-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 tracking-widest uppercase">Specialists</button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-3 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
          {filteredConversations.map((conv) => {
            const other = getOtherParticipant(conv);
            const isActive = selectedConv?._id === conv._id;
            const lastMsg = conv.lastMessage;

            return (
              <button
                key={conv._id}
                onClick={() => {
                  setSelectedConv(conv);
                  setActiveView('chat');
                }}
                className={`w-full flex gap-4 p-4 rounded-2xl transition-all duration-300 relative group
                  ${isActive ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'}
                `}
              >
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold relative z-10 
                    ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}
                  `}>
                    {other?.name.charAt(0)}
                  </div>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm font-bold truncate ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>{other?.name}</h4>
                    <span className="text-[9px] font-bold text-slate-400">
                      {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className={`text-[11px] truncate font-medium ${isActive ? 'text-blue-600/70' : 'text-slate-400'}`}>
                    {lastMsg ? (lastMsg.text || `Sent a ${lastMsg.messageType}`) : 'Start conversation...'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Center Column: Active Chat */}
      <div className={`flex-1 bg-slate-50/30 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex-col overflow-hidden relative h-full lg:flex ${activeView === 'chat' ? 'flex w-full' : 'hidden'}`}>
        {/* Subtle Medical Background Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="medical-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M50 20v60M20 50h60" stroke="#2563eb" strokeWidth="2" />
                <circle cx="50" cy="50" r="10" fill="none" stroke="#2563eb" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#medical-pattern)" />
          </svg>
        </div>
        {selectedConv ? (
          <>
            <div className="p-4 lg:p-6 border-b border-slate-100/50 flex justify-between items-center bg-white/60 backdrop-blur-xl sticky top-0 z-20 shrink-0">
              <div className="flex items-center gap-3 lg:gap-4 overflow-hidden">
                <button
                  onClick={() => setActiveView('list')}
                  className="lg:hidden p-2 -ml-1 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-white flex items-center justify-center font-black text-blue-600 text-base shadow-sm">
                    {activeOther?.name.charAt(0)}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm lg:text-base font-black text-slate-800 truncate tracking-tight">{activeOther?.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">متصل الآن</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (window.innerWidth > 1024) {
                      setShowDetails(!showDetails);
                    } else {
                      setActiveView('details');
                    }
                  }}
                  className={`p-2.5 rounded-xl transition-all shadow-sm ${(showDetails || activeView === 'details') ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                >
                  <User size={18} />
                </button>
                <button className="p-2.5 bg-white border border-slate-100 text-slate-500 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 flex flex-col scroll-smooth z-10 relative custom-scrollbar">
              <div className="flex justify-center mb-4">
                <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-100 px-6 py-2 rounded-2xl uppercase tracking-[0.2em] shadow-sm">Medical Consultation</span>
              </div>

              {messages.map((msg, i) => {
                const isMe = msg?.sender?._id === user?._id || msg?.sender === user?._id;

                return (
                  <div key={msg?._id || i} className={`flex gap-3 lg:gap-4 max-w-[85%] lg:max-w-[75%] ${isMe ? 'ml-auto flex-row-reverse' : ''} message-bubble`}>
                    {!isMe && (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 text-[11px] font-black mt-1 shadow-sm border border-white shrink-0 uppercase">
                        {activeOther?.name?.charAt(0) || 'P'}
                      </div>
                    )}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`p-3.5 lg:p-5 rounded-[1.8rem] shadow-md transition-all hover:shadow-lg ${isMe
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-none shadow-blue-500/20 border border-blue-400/20'
                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-slate-200/50'
                        }`}>
                        {msg.messageType === 'image' && (
                          <div className="mb-3 overflow-hidden rounded-xl border border-white/10 shadow-sm">
                            <img
                              src={getImageUrl(msg.fileUrl)}
                              alt="attachment"
                              className="max-w-full h-auto object-cover hover:scale-105 transition-transform duration-500 cursor-pointer rounded-lg"
                              onClick={() => window.open(getImageUrl(msg.fileUrl), '_blank')}
                            />
                          </div>
                        )}

                        {msg.messageType === 'file' && (
                          <div className={`flex items-center gap-3 p-3 rounded-xl mb-3 ${isMe ? 'bg-white/10 border border-white/10' : 'bg-white border border-slate-100'}`}>
                            <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                              <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${isMe ? 'text-white' : 'text-slate-800'}`}>{msg.fileName || 'Attachment'}</p>
                              <p className={`text-[10px] font-bold opacity-60 ${isMe ? 'text-white' : 'text-slate-400'}`}>Document File</p>
                            </div>
                            <a
                              href={getImageUrl(msg.fileUrl)}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className={`p-2 rounded-lg hover:bg-black/5 transition-colors ${isMe ? 'text-white' : 'text-slate-400'}`}
                            >
                              <Download size={18} />
                            </a>
                          </div>
                        )}

                        <p className="text-xs lg:text-[14px] leading-relaxed font-semibold">
                          {msg.text}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2 mt-2 px-3 ${isMe ? 'justify-end' : ''}`}>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && ' • SENT'}
                        </span>
                        {isMe && <Check size={12} className="text-blue-500" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 lg:p-8 bg-white/80 backdrop-blur-2xl border-t border-slate-100 shrink-0 z-20">
              <form onSubmit={handleSendMessage} className="bg-white rounded-[2rem] p-1.5 lg:p-2.5 flex items-center gap-2 lg:gap-4 shadow-2xl shadow-slate-200/50 border border-slate-100 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                <div className="flex gap-0.5 lg:gap-1 pl-1 lg:pl-2 relative" ref={emojiPickerRef}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-2.5 text-slate-400 hover:text-blue-600 transition-all hover:bg-blue-50 rounded-xl disabled:opacity-50"
                  >
                    {isUploading ? (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Paperclip size={20} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2.5 transition-all rounded-xl ${showEmojiPicker ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                  >
                    <Smile size={20} />
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute bottom-16 left-0 bg-white border border-slate-100 shadow-2xl rounded-2xl p-3 lg:p-4 w-56 lg:w-64 z-50 animate-in slide-in-from-bottom-2 duration-200">
                      <div className="grid grid-cols-5 gap-2">
                        {emojis.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setNewMessage(prev => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="w-10 h-10 flex items-center justify-center text-lg lg:text-xl hover:bg-slate-50 rounded-lg transition-colors scale-125 hover:scale-150 active:scale-110"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="اكتب رسالتك هنا..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-transparent border-none py-2 lg:py-3 text-sm font-bold outline-none text-slate-700 placeholder:text-slate-300"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[1.2rem] shadow-xl shadow-blue-600/30 hover:scale-105 hover:rotate-3 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:rotate-0"
                >
                  <Send size={22} className="rotate-[-10deg] translate-x-0.5" />
                </button>
              </form>
              <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mt-5">All messages are end-to-end encrypted.</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 text-center h-full">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-4xl flex items-center justify-center mb-6">
              <MessageSquare size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Your Communication Center</h3>
            <p className="text-slate-400 max-w-xs mt-2 font-medium text-sm">Select a patient from the list to start a secure medical consultation.</p>
          </div>
        )}
      </div>

      {/* Right Column: Patient Details */}
      <div className={`flex-col gap-6 lg:w-80 h-full overflow-y-auto pr-1 lg:pr-2 custom-scrollbar 
        ${activeView === 'details' ? 'flex w-full' : (showDetails ? 'hidden lg:flex' : 'hidden')}`}
      >
        {selectedConv ? (
          <>
            <div className="lg:hidden flex items-center gap-4 mb-2 shrink-0">
              <button
                onClick={() => setActiveView('chat')}
                className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400"
              >
                <ChevronLeft size={20} />
              </button>
              <h4 className="font-bold text-slate-800">Patient Profile</h4>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 text-center relative overflow-hidden group shrink-0">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-100 transition-opacity">
                <Activity size={32} className="text-blue-600" />
              </div>
              <div className="relative inline-block mb-6">
                <div className="w-28 h-28 rounded-[2.2rem] bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center text-4xl font-black border-4 border-white shadow-2xl">
                  {activeOther?.name.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
              </div>
              <h4 className="text-xl font-black text-slate-800 tracking-tight">{activeOther?.name}</h4>
              <p className="text-[10px] font-black text-blue-600/50 uppercase tracking-[0.2em] mt-2">Patient ID: #MC-{activeOther?._id.slice(-6).toUpperCase()}</p>

              <div className="grid grid-cols-3 gap-2 mt-10 pt-8 border-t border-slate-50">
                <div className="text-center px-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Age</p>
                  <p className="text-sm font-black text-slate-800 mt-1">{activeOther?.dob ? new Date().getFullYear() - new Date(activeOther.dob).getFullYear() : '28'}</p>
                </div>
                <div className="text-center px-2 border-x border-slate-50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Blood</p>
                  <p className="text-sm font-black text-red-500 mt-1">A+</p>
                </div>
                <div className="text-center px-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Height</p>
                  <p className="text-sm font-black text-slate-800 mt-1">168cm</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/10 text-center">
               <ClipboardList className="mx-auto mb-4 text-blue-400 opacity-50" size={24} />
               <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] leading-relaxed">Profile details are managed by the medical administration office.</p>
            </div>
          </>
        ) : (
          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-600/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <Activity className="mb-4 opacity-50" size={32} />
            <h4 className="text-lg font-bold mb-2">Patient Records</h4>
            <p className="text-blue-100 text-sm font-medium mb-6">Select a patient to see their medical documentation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
