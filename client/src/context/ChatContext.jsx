import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchConversations,
  fetchOrCreateConversation,
  fetchMessages,
  markApiMessagesAsRead
} from '../services/chatService';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // conversationId -> { userId, username }
  const typingTimeoutRef = useRef(null);

  // Load user conversations
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingConversations(true);
      const res = await fetchConversations();
      if (res.success && res.data) {
        setConversations(res.data);
      }
    } catch (err) {
      console.error('[ChatContext] Failed to load conversations:', err.message);
    } finally {
      setLoadingConversations(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Select a conversation and load its messages
  const selectConversation = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
    setLoadingMessages(true);

    try {
      const res = await fetchMessages(conversation._id);
      if (res.success && res.data) {
        setMessages(res.data);
      }

      // Mark messages as read via API and socket
      if (conversation.unreadCount > 0) {
        await markApiMessagesAsRead(conversation._id);
        if (socket) {
          socket.emit('mark_as_read', { conversationId: conversation._id });
        }
        // Update local state unread count to 0
        setConversations((prev) =>
          prev.map((c) =>
            c._id === conversation._id ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    } catch (err) {
      console.error('[ChatContext] Failed to load messages:', err.message);
    } finally {
      setLoadingMessages(false);
    }
  }, [socket]);

  // Join/leave socket room on active conversation change
  useEffect(() => {
    if (!socket || !activeConversation) return;

    socket.emit('join_conversation', { conversationId: activeConversation._id });

    return () => {
      socket.emit('leave_conversation', { conversationId: activeConversation._id });
    };
  }, [socket, activeConversation?._id]);

  // Socket event listeners for real-time messaging
  useEffect(() => {
    if (!socket) return;

    // Incoming message in active room
    const handleReceiveMessage = (message) => {
      // If message is for currently active conversation
      if (activeConversation && activeConversation._id === message.conversationId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });

        // If we are recipient, mark as read immediately
        if (message.receiver?._id === user?._id || message.receiver === user?._id) {
          socket.emit('mark_as_read', { conversationId: message.conversationId });
        }
      }

      // Update conversations list latestMessage and sort
      setConversations((prev) => {
        const index = prev.findIndex((c) => c._id === message.conversationId);
        if (index !== -1) {
          const updatedConv = {
            ...prev[index],
            latestMessage: message,
            unreadCount:
              activeConversation?._id === message.conversationId
                ? 0
                : (message.receiver?._id === user?._id || message.receiver === user?._id)
                ? (prev[index].unreadCount || 0) + 1
                : prev[index].unreadCount
          };
          const rest = prev.filter((_, i) => i !== index);
          return [updatedConv, ...rest];
        } else {
          // If conversation isn't in list yet, reload conversations
          loadConversations();
          return prev;
        }
      });
    };

    // Incoming notification for messages in other rooms
    const handleNotification = ({ conversationId, message }) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c._id === conversationId);
        if (index !== -1) {
          const updatedConv = {
            ...prev[index],
            latestMessage: message,
            unreadCount:
              activeConversation?._id === conversationId
                ? 0
                : (prev[index].unreadCount || 0) + 1
          };
          const rest = prev.filter((_, i) => i !== index);
          return [updatedConv, ...rest];
        } else {
          loadConversations();
          return prev;
        }
      });
    };

    // Real-time read receipt updates
    const handleMessagesRead = ({ conversationId, readerId }) => {
      if (activeConversation && activeConversation._id === conversationId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender?._id === user?._id || msg.sender === user?._id
              ? { ...msg, status: 'read' }
              : msg
          )
        );
      }
    };

    // Typing start
    const handleUserTyping = ({ conversationId, userId, username }) => {
      if (activeConversation && activeConversation._id === conversationId && userId !== user?._id) {
        setTypingUsers((prev) => ({
          ...prev,
          [conversationId]: { userId, username }
        }));
      }
    };

    // Typing stop
    const handleUserStopTyping = ({ conversationId, userId }) => {
      if (activeConversation && activeConversation._id === conversationId) {
        setTypingUsers((prev) => {
          const copy = { ...prev };
          delete copy[conversationId];
          return copy;
        });
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('new_message_notification', handleNotification);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('new_message_notification', handleNotification);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, activeConversation, user?._id, loadConversations]);

  // Send message function via socket
  const sendMessage = useCallback(
    (text) => {
      if (!activeConversation || !text.trim() || !socket) return;

      socket.emit(
        'send_message',
        {
          conversationId: activeConversation._id,
          text: text.trim()
        },
        (response) => {
          if (!response?.success) {
            console.error('[ChatContext] Send message failed:', response?.error);
          }
        }
      );
    },
    [activeConversation, socket]
  );

  // Typing emitter helper
  const handleTyping = useCallback(
    (isTyping) => {
      if (!activeConversation || !socket) return;

      if (isTyping) {
        socket.emit('typing_start', { conversationId: activeConversation._id });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('typing_stop', { conversationId: activeConversation._id });
        }, 2000);
      } else {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('typing_stop', { conversationId: activeConversation._id });
      }
    },
    [activeConversation, socket]
  );

  // Start or open a conversation with a specific user
  const startConversationWithUser = useCallback(
    async (recipientId) => {
      try {
        const res = await fetchOrCreateConversation(recipientId);
        if (res.success && res.data) {
          const newOrExisting = res.data;
          // Add to conversation list if not already present
          setConversations((prev) => {
            const exists = prev.some((c) => c._id === newOrExisting._id);
            if (!exists) {
              return [newOrExisting, ...prev];
            }
            return prev;
          });
          selectConversation(newOrExisting);
          return newOrExisting;
        }
      } catch (err) {
        console.error('[ChatContext] Start conversation error:', err.message);
        throw err;
      }
    },
    [selectConversation]
  );

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        loadingConversations,
        loadingMessages,
        typingUsers,
        onlineUsers,
        selectConversation,
        sendMessage,
        handleTyping,
        startConversationWithUser,
        loadConversations,
        setActiveConversation
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

