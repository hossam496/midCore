import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useParams } from 'react-router-dom';
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
  Circle,
  Pencil,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getConversations, getMessages, sendMessageApi, uploadChatFile, updateMessageApi, deleteMessageApi } from '../../../api/chatApi';
import getImageUrl from '../../../utils/imageUrl';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import toast from 'react-hot-toast';

const Messages = () => {
  const { user } = useAuth();
  const { channel, emitTyping, typingStatus } = useSocket();
  const location = useLocation();
  const routeParams = useParams();

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
  const [messageSheet, setMessageSheet] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectedConvRef = useRef(null);
  const convsFetchInFlight = useRef(false);
  const longPressTimerRef = useRef(null);
  const longPressMsgIdRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const el = chatContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: behavior === 'auto' ? 'auto' : 'smooth' });
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);

  const pathConvId = routeParams.conversationId ?? '';
  const queryString = location.search ?? '';
  const navSelectedConvId =
    location.state && location.state.selectedConversationId != null
      ? String(location.state.selectedConversationId)
      : '';

  // ── Fetch Conversations ─────────────────────────────────────────────────────
  const fetchConvs = useCallback(async () => {
    if (convsFetchInFlight.current) return;
    convsFetchInFlight.current = true;
    try {
      setLoading(true);
      const res = await getConversations();
      setConversations(res.data.conversations || []);

      const queryConvId = new URLSearchParams(queryString).get('c');
      const stateConvId =
        navSelectedConvId ||
        pathConvId ||
        queryConvId ||
        sessionStorage.getItem('medcore_selected_chat');
      if (stateConvId) {
        const found = res.data.conversations.find((c) => String(c._id) === String(stateConvId));
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
      convsFetchInFlight.current = false;
      setLoading(false);
    }
  }, [pathConvId, queryString, navSelectedConvId]);

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
  }, [scrollToBottom]);

  const getMessageSenderId = useCallback((msg) => {
    if (!msg?.sender) return '';
    return String(msg.sender._id ?? msg.sender);
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressMsgIdRef.current = null;
  }, []);

  const buildMessageInteractionProps = useCallback(
    (msg) => {
      if (msg.pending) return {};
      const mine = getMessageSenderId(msg) === String(user?._id ?? '');
      if (!mine || msg.isDeleted) return {};

      const startTimer = (msgId) => {
        clearLongPressTimer();
        longPressMsgIdRef.current = msgId;
        longPressTimerRef.current = setTimeout(() => {
          longPressTimerRef.current = null;
          if (longPressMsgIdRef.current === msgId) {
            setMessageSheet(msg);
          }
        }, 520);
      };

      return {
        onTouchStart: () => startTimer(msg._id),
        onTouchEnd: clearLongPressTimer,
        onTouchCancel: clearLongPressTimer,
        onTouchMove: clearLongPressTimer,
        onPointerDown: (e) => {
          if (e.pointerType === 'touch') return;
          startTimer(msg._id);
        },
        onPointerUp: clearLongPressTimer,
        onPointerCancel: clearLongPressTimer,
        onPointerLeave: clearLongPressTimer,
        onContextMenu: (e) => {
          e.preventDefault();
          setMessageSheet(msg);
        },
      };
    },
    [user?._id, getMessageSenderId, clearLongPressTimer]
  );

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return undefined;
    const onScroll = () => clearLongPressTimer();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [selectedConv?._id, clearLongPressTimer]);

  useEffect(() => {
    return () => clearLongPressTimer();
  }, [clearLongPressTimer]);

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

  useEffect(() => {
    setMessageSheet(null);
    setEditModal(null);
    clearLongPressTimer();
  }, [selectedConv?._id, clearLongPressTimer]);

  // ── Pusher Event Listeners ──────────────────────────────────────────────────
  useEffect(() => {
    if (!channel) return;

    const messageConversationId = (msg) => {
      const c = msg?.conversation;
      if (c == null) return '';
      if (typeof c === 'object' && c._id != null) return String(c._id);
      return String(c);
    };

    const handleNewMessage = (msg) => {
      const msgConvId = messageConversationId(msg);
      const sel = selectedConvRef.current;
      const selId = sel?._id != null ? String(sel._id) : '';

      if (selId && msgConvId && msgConvId === selId) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scrollToBottom('smooth'));
        });
      }

      // Update conversations list
      setConversations((prev) =>
        prev
          .map((c) => {
            if (String(c._id) !== msgConvId) return c;
            const isSelected = selId && String(c._id) === selId;
            const newUnread = isSelected ? 0 : (c.unreadCount?.[user._id] || 0) + 1;
            return {
              ...c,
              lastMessage: msg,
              updatedAt: new Date(),
              unreadCount: { ...c.unreadCount, [user._id]: newUnread },
            };
          })
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    };

    const handleMessagesSeen = ({ conversationId, seenBy }) => {
      if (String(selectedConvRef.current?._id || '') === String(conversationId || '')) {
        setMessages((prev) =>
          prev.map((m) => ({
            ...m,
            seenBy:
              Array.isArray(m.seenBy) && m.seenBy.some((id) => String(id) === String(seenBy))
                ? m.seenBy
                : [...(Array.isArray(m.seenBy) ? m.seenBy : []), seenBy],
          }))
        );
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (String(c._id) !== String(conversationId)) return c;
          const newUnreadCount = { ...c.unreadCount };
          newUnreadCount[seenBy] = 0;
          return { ...c, unreadCount: newUnreadCount };
        })
      );
    };

    const handleMessageUpdated = ({ conversationId, message: updated }) => {
      if (!updated?._id) return;
      const selId = selectedConvRef.current?._id != null ? String(selectedConvRef.current._id) : '';
      if (selId && String(conversationId) === selId) {
        setMessages((prev) => prev.map((m) => (String(m._id) === String(updated._id) ? { ...m, ...updated } : m)));
      }
      setConversations((prev) =>
        prev.map((c) => {
          if (String(c._id) !== String(conversationId)) return c;
          const lm = c.lastMessage;
          const lmId = lm?._id != null ? String(lm._id) : lm != null ? String(lm) : '';
          if (lmId && lmId === String(updated._id)) {
            return { ...c, lastMessage: { ...(typeof lm === 'object' ? lm : {}), ...updated } };
          }
          return c;
        })
      );
    };

    const handleMessageDeleted = ({ conversationId, message: tombstone, conversationLastMessage }) => {
      if (!tombstone?._id) return;
      const selId = selectedConvRef.current?._id != null ? String(selectedConvRef.current._id) : '';
      if (selId && String(conversationId) === selId) {
        setMessages((prev) => prev.map((m) => (String(m._id) === String(tombstone._id) ? { ...m, ...tombstone } : m)));
      }
      setConversations((prev) =>
        prev.map((c) => {
          if (String(c._id) !== String(conversationId)) return c;
          const next = { ...c };
          if (conversationLastMessage !== undefined) {
            next.lastMessage = conversationLastMessage;
          }
          return next;
        })
      );
    };

    channel.bind('new-message', handleNewMessage);
    channel.bind('message-seen', handleMessagesSeen);
    channel.bind('message-updated', handleMessageUpdated);
    channel.bind('message-deleted', handleMessageDeleted);

    return () => {
      try {
        if (channel) {
          channel.unbind('new-message', handleNewMessage);
          channel.unbind('message-seen', handleMessagesSeen);
          channel.unbind('message-updated', handleMessageUpdated);
          channel.unbind('message-deleted', handleMessageDeleted);
        }
      } catch (error) {
        // Silent catch
      }
    };
  }, [channel, user._id, scrollToBottom]);

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

    const clientId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const previewUrl = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    const optimistic = {
      _id: clientId,
      _clientId: clientId,
      pending: true,
      conversation: selectedConv._id,
      sender: user,
      messageType: isImage ? 'image' : 'file',
      fileUrl: previewUrl,
      fileName: file.name,
      text: isImage ? 'جاري إرسال الصورة…' : 'جاري إرسال الملف…',
      createdAt: new Date().toISOString(),
      seenBy: [user._id],
      isDeleted: false,
    };

    setMessages((prev) => [...prev, optimistic]);
    setConversations((prev) =>
      prev
        .map((c) =>
          c._id === selectedConv._id
            ? { ...c, lastMessage: optimistic, updatedAt: new Date() }
            : c
        )
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );
    requestAnimationFrame(() => scrollToBottom('auto'));

    const formData = new FormData();
    formData.append('file', file);

    const prevLastMessage =
      selectedConv.lastMessage && typeof selectedConv.lastMessage === 'object'
        ? { ...selectedConv.lastMessage }
        : selectedConv.lastMessage ?? null;

    try {
      setIsUploading(true);
      const res = await uploadChatFile(formData);
      const { fileUrl, fileName, fileType } = res.data;

      const messageRes = await sendMessageApi(selectedConv._id, {
        messageType: fileType === 'image' ? 'image' : 'file',
        fileUrl,
        fileName,
        text: `أرسل ${fileType === 'image' ? 'صورة' : 'ملفاً'}`,
      });

      const msg = messageRes.data.message;
      URL.revokeObjectURL(previewUrl);

      setMessages((prev) => {
        const idx = prev.findIndex((m) => m._clientId === clientId);
        const next = prev
          .filter((m) => m._clientId !== clientId)
          .filter((m) => String(m._id) !== String(msg._id));
        if (idx < 0) return [...next, msg];
        return [...next.slice(0, idx), msg, ...next.slice(idx)];
      });

      setConversations((prev) =>
        prev
          .map((c) =>
            c._id === selectedConv._id
              ? { ...c, lastMessage: msg, updatedAt: new Date() }
              : c
          )
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
      setTimeout(() => scrollToBottom('smooth'), 50);
    } catch (err) {
      console.error('Failed to upload file', err);
      URL.revokeObjectURL(previewUrl);
      setMessages((prev) => prev.filter((m) => m._clientId !== clientId));
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id !== selectedConv._id) return c;
          const lm = c.lastMessage;
          if (lm && (lm._clientId === clientId || lm._id === clientId)) {
            return { ...c, lastMessage: prevLastMessage };
          }
          return c;
        })
      );
      toast.error('فشل في رفع الملف.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getOtherParticipant = (conv) => {
    return conv?.participants?.find((p) => String(p._id) !== String(user?._id));
  };

  const handleConfirmDeleteMessage = async () => {
    if (!messageSheet || !selectedConv) return;
    const mid = messageSheet._id;
    if (!window.confirm('حذف الرسالة للجميع؟ لن يستطيع أحد استرجاعها.')) return;
    setDeletingId(mid);
    try {
      const res = await deleteMessageApi(selectedConv._id, mid);
      const { message: tombstone, conversationLastMessage } = res.data;
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(mid) ? { ...m, ...tombstone } : m))
      );
      setConversations((prev) =>
        prev.map((c) => {
          if (String(c._id) !== String(selectedConv._id)) return c;
          return { ...c, lastMessage: conversationLastMessage ?? c.lastMessage };
        })
      );
      setMessageSheet(null);
      toast.success('تم حذف الرسالة.');
    } catch (err) {
      console.error(err);
      toast.error('تعذر حذف الرسالة.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenEditFromSheet = () => {
    if (!messageSheet) return;
    setEditModal({ message: messageSheet, text: messageSheet.text || '' });
    setMessageSheet(null);
  };

  const handleSaveEditedMessage = async () => {
    if (!editModal?.message || !selectedConv) return;
    const text = editModal.text?.trim();
    if (!text) {
      toast.error('اكتب نصاً.');
      return;
    }
    setSavingEdit(true);
    try {
      const res = await updateMessageApi(selectedConv._id, editModal.message._id, text);
      const updated = res.data.message;
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(updated._id) ? { ...m, ...updated } : m))
      );
      setConversations((prev) =>
        prev.map((c) => {
          if (String(c._id) !== String(selectedConv._id)) return c;
          const lm = c.lastMessage;
          const lmId = lm?._id != null ? String(lm._id) : lm != null ? String(lm) : '';
          if (lmId === String(updated._id)) {
            return { ...c, lastMessage: { ...(typeof lm === 'object' ? lm : {}), ...updated } };
          }
          return c;
        })
      );
      setEditModal(null);
      toast.success('تم حفظ التعديل.');
    } catch (err) {
      console.error(err);
      toast.error('تعذر حفظ التعديل.');
    } finally {
      setSavingEdit(false);
    }
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
    <div
      className="flex min-h-0 w-full h-full max-w-full flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg sm:rounded-3xl sm:shadow-2xl lg:flex-row lg:shadow-2xl"
      dir="rtl"
    >
      {/* ── Left Side: Conversation List ───────────────────────────────────── */}
      <div
        className={`flex min-h-0 w-full flex-col border-l border-slate-100 bg-white lg:w-[400px] lg:max-w-[400px] lg:shrink-0 ${activeView === 'chat' ? 'hidden lg:flex' : 'flex'}`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-50 p-4 sm:p-6">
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
        <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-4">
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
        <div className="min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-1 [-webkit-overflow-scrolling:touch] sm:px-2">
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
              const lm = conv.lastMessage;
              const lmSenderId = lm?.sender
                ? typeof lm.sender === 'object'
                  ? String(lm.sender._id ?? '')
                  : String(lm.sender)
                : '';

              return (
                <motion.div
                  key={conv._id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedConv(conv);
                    setActiveView('chat');
                  }}
                  className={`group relative flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition-all duration-200 sm:gap-4 sm:p-4
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
                              {lmSenderId === String(user._id) && !lm?.isDeleted && (
                                <CheckCheck size={14} className={lm?.seenBy?.length > 1 ? 'text-blue-400' : 'text-slate-300'} />
                              )}
                              {lm?.isDeleted ? (
                                <span className="italic text-slate-400">رسالة محذوفة</span>
                              ) : lm?.messageType === 'image' ? (
                                <span className="flex items-center gap-1 italic">
                                  <Camera size={12} className="text-blue-400" />
                                  أرسل صورة
                                </span>
                              ) : (
                                lm?.text || 'ابدأ المحادثة الآن'
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
      <div
        className={`relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC] ${activeView === 'list' ? 'hidden lg:flex' : 'flex'}`}
      >
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="z-10 flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 bg-white/80 p-3 backdrop-blur-md sm:gap-3 sm:p-4">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="shrink-0 rounded-xl p-2 transition-colors hover:bg-slate-50 lg:hidden"
                  aria-label="العودة للمحادثات"
                >
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
              <div className="flex shrink-0 items-center gap-0.5 text-slate-400 sm:gap-2">
                <button
                  type="button"
                  className="hidden rounded-xl p-2 transition-all hover:bg-blue-50 hover:text-blue-600 sm:inline-flex"
                  aria-label="اتصال"
                >
                  <Phone size={20} />
                </button>
                <button
                  type="button"
                  className="hidden rounded-xl p-2 transition-all hover:bg-blue-50 hover:text-blue-600 sm:inline-flex"
                  aria-label="مكالمة فيديو"
                >
                  <Video size={20} />
                </button>
                <button type="button" className="rounded-xl p-2 transition-all hover:bg-slate-50">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div 
              ref={chatContainerRef}
              className="relative min-h-0 flex-1 touch-pan-y space-y-4 overflow-x-hidden overflow-y-auto overscroll-contain scroll-smooth p-3 [-webkit-overflow-scrolling:touch] sm:space-y-6 sm:p-4 lg:p-8"
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
                  const isMe = getMessageSenderId(msg) === String(user?._id ?? '');
                  const prevMsg = messages[idx - 1];
                  const prevSid = prevMsg ? getMessageSenderId(prevMsg) : '';
                  const curSid = getMessageSenderId(msg);
                  const isSameSender = prevMsg && prevSid === curSid;
                  const isSeen = msg.seenBy?.length > 1;
                  const isDeleted = !!msg.isDeleted;
                  const isPending = !!msg.pending;
                  const bubbleClass = isDeleted
                    ? 'rounded-3xl border border-slate-200 bg-slate-200/90 text-slate-600'
                    : isMe
                      ? 'select-none rounded-3xl rounded-tl-none bg-blue-600 text-white'
                      : 'rounded-3xl rounded-tr-none border border-slate-100 bg-white text-slate-800';

                  return (
                    <motion.div 
                      key={msg._id || msg._clientId || idx}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSameSender ? 'mt-1' : 'mt-6'}`}
                    >
                       {!isMe && !isSameSender && (
                          <div className="w-8 h-8 rounded-xl shrink-0 mt-auto ml-2 overflow-hidden border border-white shadow-sm bg-slate-100">
                             <img 
                                src={getImageUrl(activeOther?.profileImage)} 
                                className="h-full w-full object-cover"
                                alt=""
                             />
                          </div>
                       )}
                       {!isMe && isSameSender && <div className="ml-2 h-8 w-8 shrink-0" />}

                      <div 
                        {...buildMessageInteractionProps(msg)}
                        className={`relative max-w-[min(92%,20rem)] px-3 py-2.5 shadow-sm sm:max-w-[75%] sm:px-4 sm:py-3 lg:max-w-[60%] ${bubbleClass}`}
                      >
                        {!isDeleted && msg.messageType === 'image' && msg.fileUrl && (
                          <div className="relative mb-2 flex min-h-[150px] items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-slate-50">
                            <img 
                              src={getImageUrl(msg.fileUrl)} 
                              alt="" 
                              className={`h-auto max-w-full object-cover transition-opacity ${isPending ? 'opacity-90' : 'cursor-pointer hover:opacity-90'}`}
                              onClick={() => !isPending && setSelectedImage(getImageUrl(msg.fileUrl))}
                            />
                            {isPending && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/35 backdrop-blur-[1px]">
                                <Loader2 className="h-8 w-8 animate-spin text-white" />
                                <span className="text-[11px] font-bold text-white">جاري الرفع…</span>
                              </div>
                            )}
                          </div>
                        )}
                        {!isDeleted && msg.messageType === 'file' && !msg.fileUrl?.startsWith('blob:') && (
                          <div className="mb-2 flex items-center gap-2 rounded-xl border border-black/5 bg-slate-50 px-3 py-2 text-slate-700">
                            <FileText size={20} className="shrink-0 text-blue-600" />
                            <span className="min-w-0 truncate text-xs font-bold">{msg.fileName}</span>
                          </div>
                        )}
                        {!isDeleted && msg.messageType === 'file' && isPending && msg.fileUrl && (
                          <div className="mb-2 flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/40 bg-white/10 px-3 py-4">
                            <Loader2 className="h-7 w-7 animate-spin text-white" />
                            <span className="text-[11px] font-bold text-white/95">جاري رفع الملف…</span>
                          </div>
                        )}

                        <div className="flex flex-col">
                          {isDeleted ? (
                            <p className="text-[14px] font-medium italic leading-relaxed">تم حذف هذه الرسالة.</p>
                          ) : (
                            <p className="whitespace-pre-wrap text-[14px] font-medium leading-relaxed">{msg.text}</p>
                          )}
                          <div className={`mt-2 flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 ${isDeleted ? 'text-slate-500' : isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                            {!isDeleted && msg.editedAt && (
                              <span className="text-[9px] font-bold opacity-90">تم التعديل</span>
                            )}
                            <span className="text-[9px] font-bold">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && !isDeleted && !isPending && (
                              isSeen ? <CheckCheck size={14} className={isMe ? 'text-white' : ''} /> : <Check size={14} />
                            )}
                            {isMe && !isDeleted && isPending && (
                              <Loader2 size={14} className="shrink-0 animate-spin text-blue-100" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                       {isMe && !isSameSender && (
                          <div className="w-8 h-8 rounded-xl shrink-0 mt-auto mr-2 overflow-hidden border border-white shadow-sm bg-slate-100">
                             <img 
                                src={getImageUrl(user.profileImage)} 
                                className="h-full w-full object-cover"
                                alt=""
                             />
                          </div>
                       )}
                       {isMe && isSameSender && <div className="mr-2 h-8 w-8 shrink-0" />}
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="sticky bottom-0 z-20 shrink-0 border-t border-slate-100 bg-white/95 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md supports-[padding:max(0px)]:pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-4">
              <div className="mx-auto flex max-w-5xl items-end gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-inner transition-all focus-within:border-blue-400 focus-within:bg-white sm:gap-3 sm:rounded-[2rem] sm:p-2">
                <div className="flex shrink-0 gap-0.5 pb-0.5 sm:gap-1 sm:pb-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full p-2 text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-600 sm:p-2.5"
                  >
                    <Paperclip size={20} className="size-[18px] sm:size-5" />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                </div>

                <form onSubmit={handleSendMessage} className="min-w-0 flex-1">
                  <textarea
                    rows={1}
                    placeholder="اكتب رسالتك هنا..."
                    className="max-h-28 w-full resize-none border-none bg-transparent px-1 py-2.5 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 sm:max-h-32 sm:px-2 sm:py-3"
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

                <div className="flex shrink-0 gap-0.5 pb-0.5 pr-0.5 sm:gap-1 sm:pb-1 sm:pr-1">
                  <button
                    type="button"
                    className="hidden rounded-full p-2 text-slate-400 transition-colors hover:text-blue-600 sm:inline-flex sm:p-2.5"
                    aria-label="إيموجي"
                  >
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
                        className="rounded-full bg-blue-600 p-2.5 text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:bg-blue-700 active:scale-95 sm:p-3"
                      >
                        <Send size={18} className="mr-0.5 sm:size-[18px]" />
                      </motion.button>
                    ) : (
                      <motion.button 
                        key="mic"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="rounded-full bg-slate-200 p-2.5 text-slate-500 transition-all hover:bg-slate-300 sm:p-3"
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
               <h2 className="mb-4 text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">مرحباً بك في المحادثات</h2>
               <p className="mb-8 text-sm font-medium leading-relaxed text-slate-500 sm:mb-10">
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

      {createPortal(
        <AnimatePresence>
          {messageSheet && (
            <motion.div
              key="msg-sheet"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex flex-col justify-end bg-black/45 p-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
              role="dialog"
              aria-modal="true"
              aria-label="خيارات الرسالة"
              onClick={() => setMessageSheet(null)}
            >
              <motion.div
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 28, opacity: 0 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="border-b border-slate-100 px-4 py-3 text-center">
                  <p className="text-sm font-bold text-slate-800">خيارات الرسالة</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">للمحادثة مع {activeOther?.name}</p>
                </div>
                {messageSheet.messageType !== 'file' && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-right text-slate-800 transition-colors hover:bg-slate-50"
                    onClick={handleOpenEditFromSheet}
                  >
                    <Pencil size={20} className="shrink-0 text-blue-600" />
                    <span className="flex-1 text-sm font-bold">تعديل النص</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={deletingId === messageSheet._id}
                  className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3.5 text-right text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  onClick={handleConfirmDeleteMessage}
                >
                  <Trash2 size={20} className="shrink-0" />
                  <span className="flex-1 text-sm font-bold">
                    {deletingId === messageSheet._id ? 'جاري الحذف...' : 'حذف للجميع'}
                  </span>
                </button>
                <button
                  type="button"
                  className="w-full border-t border-slate-100 py-3 text-center text-sm font-bold text-slate-500 hover:bg-slate-50"
                  onClick={() => setMessageSheet(null)}
                >
                  إلغاء
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {editModal && (
            <motion.div
              key="edit-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[210] flex items-end justify-center bg-black/45 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-label="تعديل الرسالة"
              onClick={() => !savingEdit && setEditModal(null)}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 12 }}
                className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="border-b border-slate-100 px-4 py-3">
                  <h2 className="text-base font-bold text-slate-800">تعديل الرسالة</h2>
                </div>
                <div className="p-4">
                  <textarea
                    rows={4}
                    className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
                    value={editModal.text}
                    onChange={(e) => setEditModal((m) => (m ? { ...m, text: e.target.value } : m))}
                    disabled={savingEdit}
                  />
                </div>
                <div className="flex gap-2 border-t border-slate-100 p-3">
                  <button
                    type="button"
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                    disabled={savingEdit}
                    onClick={() => setEditModal(null)}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                    disabled={savingEdit}
                    onClick={handleSaveEditedMessage}
                  >
                    {savingEdit ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
 
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
