import React from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { MessagesSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const ChatWindow = ({ onBack, onOpenUserProfile }) => {
  const { user } = useAuth();
  const {
    activeConversation,
    messages,
    loadingMessages,
    sendMessage,
    handleTyping,
    typingUsers,
    onlineUsers
  } = useChat();

  if (!activeConversation) {
    return (
      <div className="chat-window flex-center">
        <div className="empty-state-container">
          <div className="empty-state-icon-box">
            <MessagesSquare size={36} />
          </div>
          <h2 className="empty-state-title">Select a Conversation</h2>
          <p className="empty-state-description">
            Choose an existing conversation from the sidebar or search for a user to start messaging.
          </p>
        </div>
      </div>
    );
  }

  const otherParticipant =
    activeConversation.otherParticipant ||
    activeConversation.participants?.find((p) => p._id !== user?._id);

  const onlineStatus = otherParticipant ? onlineUsers[otherParticipant._id] : null;
  const isTyping = !!typingUsers[activeConversation._id];
  const typingUsername = typingUsers[activeConversation._id]?.username;

  return (
    <div className="chat-window">
      <ChatHeader
        participant={otherParticipant}
        onlineStatus={onlineStatus}
        onBack={onBack}
        onOpenProfile={() => onOpenUserProfile(otherParticipant)}
      />
      <MessageList
        messages={messages}
        currentUserId={user?._id}
        isTyping={isTyping}
        typingUsername={typingUsername}
        loading={loadingMessages}
      />
      <MessageInput
        onSendMessage={sendMessage}
        onTyping={handleTyping}
      />
    </div>
  );
};

export default ChatWindow;

