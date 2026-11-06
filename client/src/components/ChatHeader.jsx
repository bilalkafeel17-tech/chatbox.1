import React from 'react';
import { ChevronLeft, User as UserIcon } from 'lucide-react';
import { formatLastSeen } from '../utils/dateUtils';

const ChatHeader = ({ participant, onlineStatus, onBack, onOpenProfile }) => {
  if (!participant) return null;

  const isOnline = onlineStatus?.isOnline !== undefined ? onlineStatus.isOnline : participant.isOnline;
  const lastSeen = onlineStatus?.lastSeen || participant.lastSeen;

  return (
    <div className="chat-header">
      <div className="chat-header-user">
        <button
          className="icon-button mobile-back-btn"
          onClick={onBack}
          aria-label="Back to conversations"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="avatar-container" onClick={onOpenProfile} style={{ cursor: 'pointer' }}>
          {participant.avatar ? (
            <img
              src={participant.avatar}
              alt={participant.username}
              className="avatar-image"
            />
          ) : (
            <div className="avatar-image">
              <UserIcon size={20} />
            </div>
          )}
          <span className={isOnline ? 'online-badge' : 'offline-badge'} />
        </div>

        <div className="chat-header-info">
          <span className="chat-header-name">{participant.username}</span>
          <span className={`chat-header-status ${isOnline ? 'online' : ''}`}>
            {formatLastSeen(isOnline, lastSeen)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;

