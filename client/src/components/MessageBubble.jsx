import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { formatMessageTime } from '../utils/dateUtils';

const MessageBubble = ({ message, isOutgoing }) => {
  const renderStatus = () => {
    if (!isOutgoing) return null;

    if (message.status === 'read') {
      return (
        <span className="message-status-icon read" title="Read">
          <CheckCheck size={14} />
        </span>
      );
    }

    if (message.status === 'delivered') {
      return (
        <span className="message-status-icon" title="Delivered">
          <CheckCheck size={14} />
        </span>
      );
    }

    return (
      <span className="message-status-icon" title="Sent">
        <Check size={14} />
      </span>
    );
  };

  return (
    <div className={`message-row ${isOutgoing ? 'outgoing' : 'incoming'}`}>
      <div className="message-bubble">
        {message.text}
      </div>
      <div className="message-meta">
        <span>{formatMessageTime(message.createdAt)}</span>
        {renderStatus()}
      </div>
    </div>
  );
};

export default MessageBubble;

