import api from './api';

export const fetchConversations = async () => {
  const response = await api.get('/conversations');
  return response.data;
};

export const fetchOrCreateConversation = async (recipientId) => {
  const response = await api.post('/conversations', { recipientId });
  return response.data;
};

export const fetchConversationById = async (conversationId) => {
  const response = await api.get(`/conversations/${conversationId}`);
  return response.data;
};

export const fetchMessages = async (conversationId) => {
  const response = await api.get(`/messages/${conversationId}`);
  return response.data;
};

export const sendApiMessage = async (conversationId, text) => {
  const response = await api.post('/messages', { conversationId, text });
  return response.data;
};

export const markApiMessagesAsRead = async (conversationId) => {
  const response = await api.put(`/messages/read/${conversationId}`);
  return response.data;
};

