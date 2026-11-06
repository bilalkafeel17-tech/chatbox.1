import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { getDateDivider } from '../utils/dateUtils';
import { MessageSquareDashed } from 'lucide-react';

const MessageList = ({ messages, currentUserId, isTyping, typingUsername, loading }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (loading) {
    return (
      <div className="messages-container flex-center">
        <div className="spinner spinner-large"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="messages-container flex-center">
        <div className="empty-state-container">
          <div className="empty-state-icon-box">
            <MessageSquareDashed size={32} />
          </div>
          <h3 className="empty-state-title">No messages yet</h3>
          <p className="empty-state-description">
            Send a message to start the conversation.
          </p>
        </div>
      </div>
    );
  }

  let lastDateHeader = null;

  return (
    <div className="messages-container">
      {messages.map((message) => {
        const dateHeader = getDateDivider(message.createdAt);
        const showDateDivider = dateHeader !== lastDateHeader;
        if (showDateDivider) {
          lastDateHeader = dateHeader;
        }

        const senderId = message.sender?._id || message.sender;
        const isOutgoing = senderId?.toString() === currentUserId?.toString();

        return (
          <React.Fragment key={message._id}>
            {showDateDivider && (
              <div className="date-divider">
                <span className="date-pill">{dateHeader}</span>
              </div>
            )}
            <MessageBubble message={message} isOutgoing={isOutgoing} />
          </React.Fragment>
        );
      })}

      {isTyping && (
        <div className="typing-row">
          <div className="typing-bubble">
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
          <span className="typing-text">{typingUsername || 'User'} is typing...</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;

