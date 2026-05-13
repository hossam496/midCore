import api from './axiosInstance';

// Get or create a conversation with a user
export const getOrCreateConversation = (participantId) =>
  api.post('/conversations', { participantId });

// Get all conversations for current user
export const getConversations = () => api.get('/conversations');

// Get messages in a conversation
export const getMessages = (conversationId, page = 1) =>
  api.get(`/conversations/${conversationId}/messages?page=${page}&limit=50`);

// Send a message
export const sendMessageApi = (conversationId, messageData) => {
  // If it's just a string, convert to object
  const data = typeof messageData === 'string' ? { text: messageData } : messageData;
  return api.post(`/conversations/${conversationId}/messages`, data);
};

// Get total unread count
export const getUnreadCount = () => api.get('/conversations/unread-count');

// Upload a file for chat (Content-Type + boundary set by the browser — see axios request interceptor)
export const uploadChatFile = (formData) =>
  api.post('/media/chat', formData, {
    timeout: 120000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

export const updateMessageApi = (conversationId, messageId, text) =>
  api.patch(`/conversations/${conversationId}/messages/${messageId}`, { text });

export const deleteMessageApi = (conversationId, messageId) =>
  api.delete(`/conversations/${conversationId}/messages/${messageId}`);
