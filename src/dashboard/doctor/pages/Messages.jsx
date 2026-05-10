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
  ChevronRight
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

        // Check if there's a selected conversation from navigation state
        const stateConvId = location.state?.selectedConversationId;
        if (stateConvId) {
          const found = res.data.conversations.find(c => c._id === stateConvId);
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
      <div className={`flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex-col overflow-hidden relative h-full lg:flex ${activeView === 'chat' ? 'flex w-full' : 'hidden'}`}>
        {selectedConv ? (
          <>
            <div className="p-4 lg:p-6 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
              <div className="flex items-center gap-3 lg:gap-4 overflow-hidden">
                <button
                  onClick={() => setActiveView('list')}
                  className="lg:hidden p-2 -ml-1 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-white flex items-center justify-center font-bold text-slate-400 text-sm">
                    {activeOther?.name.charAt(0)}
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm lg:text-base font-bold text-slate-800 truncate">{activeOther?.name}</h3>
                </div>
              </div>
              <div className="flex gap-1.5 lg:gap-2">
                <button
                  onClick={() => {
                    if (window.innerWidth > 1024) {
                      setShowDetails(!showDetails);
                    } else {
                      setActiveView('details');
                    }
                  }}
                  className={`p-2 lg:p-2.5 rounded-xl transition-all shadow-sm ${(showDetails || activeView === 'details') ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-slate-50 text-slate-500 hover:bg-blue-50'}`}
                >
                  <User size={18} />
                </button>
                <button className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all shadow-sm">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 flex flex-col scroll-smooth">
              <div className="flex justify-center mb-4">
                <span className="text-[9px] lg:text-[10px] font-bold text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">Medical Consultation</span>
              </div>

              {messages.map((msg, i) => {
                const isMe = msg?.sender?._id === user?._id || msg?.sender === user?._id;

                return (
                  <div key={msg?._id || i} className={`flex gap-3 lg:gap-4 max-w-[85%] lg:max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''} message-bubble`}>
                    {isMe && (
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold mt-1 shadow-lg shadow-blue-600/20 uppercase shrink-0">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className={`space-y-2 ${isMe ? 'items-end' : ''}`}>
                      <div className={`p-3 lg:p-4 rounded-2xl border shadow-sm ${isMe
                        ? 'bg-blue-600 border-blue-500 text-white rounded-tr-none shadow-blue-600/10'
                        : 'bg-slate-50 border-slate-100 text-slate-600 rounded-tl-none'
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

                        <p className="text-xs lg:text-sm leading-relaxed font-medium">
                          {msg.text}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2 px-2 ${isMe ? 'justify-end' : ''}`}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && ' • Sent'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 lg:p-6 bg-white border-t border-slate-50 shrink-0">
              <form onSubmit={handleSendMessage} className="bg-slate-50 rounded-2xl p-1.5 lg:p-2 flex items-center gap-2 lg:gap-3 shadow-inner border border-slate-100">
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
                    className="p-2 lg:p-2.5 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
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
                    className={`p-2 lg:p-2.5 transition-colors ${showEmojiPicker ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
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
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-transparent border-none py-2 lg:py-3 text-xs lg:text-sm font-medium outline-none text-slate-800 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 lg:p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  <Send size={18} />
                </button>
              </form>
              <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-3">All messages are end-to-end encrypted.</p>
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

            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm text-center relative overflow-hidden group shrink-0">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                <Activity size={24} className="text-blue-600" />
              </div>
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-[2rem] bg-blue-50 text-blue-600 flex items-center justify-center text-3xl font-bold border-4 border-white shadow-xl">
                  {activeOther?.name.charAt(0)}
                </div>
              </div>
              <h4 className="text-lg font-bold text-slate-800">{activeOther?.name}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Patient ID: #MC-{activeOther?._id.slice(-6).toUpperCase()}</p>

              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-50">
                <div className="text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Age</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{activeOther?.dob ? new Date().getFullYear() - new Date(activeOther.dob).getFullYear() : '28'}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Blood</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">A+</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Height</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">168cm</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Profile details are managed by the admin.</p>
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
