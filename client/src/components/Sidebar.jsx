import React, { useState } from 'react';
import {
  MessageSquare,
  SquarePen,
  Search,
  X,
  Settings,
  LogOut,
  User as UserIcon,
  Check,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { formatConversationTime } from '../utils/dateUtils';

const Sidebar = ({ isMobileOpen, onOpenSearch, onOpenProfile }) => {
  const { user, logout } = useAuth();
  const {
    conversations,
    activeConversation,
    selectConversation,
    loadingConversations,
    onlineUsers
  } = useChat();

  const [filterQuery, setFilterQuery] = useState('');

  const filteredConversations = conversations.filter((conv) => {
    if (!filterQuery.trim()) return true;
    const otherParticipant =
      conv.otherParticipant ||
      conv.participants?.find((p) => p._id !== user?._id);

    const nameMatch = otherParticipant?.username
      ?.toLowerCase()
      .includes(filterQuery.toLowerCase());
    const messageMatch = conv.latestMessage?.text
      ?.toLowerCase()
      .includes(filterQuery.toLowerCase());

    return nameMatch || messageMatch;
  });

  const renderMessageStatus = (msg) => {
    if (!msg || msg.sender?._id !== user?._id && msg.sender !== user?._id) return null;

    if (msg.status === 'read') {
      return <CheckCheck size={13} style={{ color: '#60A5FA', marginRight: '2px' }} />;
    }
    if (msg.status === 'delivered') {
      return <CheckCheck size={13} style={{ color: 'var(--text-muted)', marginRight: '2px' }} />;
    }
    return <Check size={13} style={{ color: 'var(--text-muted)', marginRight: '2px' }} />;
  };

  return (
    <aside className={`sidebar ${!isMobileOpen ? 'hidden' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <MessageSquare size={20} />
          </div>
          <span className="brand-title">Chatbox</span>
        </div>

        <div className="sidebar-actions">
          <button
            className="icon-button"
            onClick={onOpenSearch}
            title="Start new conversation"
            aria-label="Start new conversation"
          >
            <SquarePen size={18} />
          </button>
          <button
            className="icon-button"
            onClick={onOpenProfile}
            title="Settings"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Filter / Search Box */}
      <div className="sidebar-search-box">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search conversations..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
          {filterQuery && (
            <button
              className="search-clear-btn icon-button"
              onClick={() => setFilterQuery('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div className="conversation-list">
        {loadingConversations ? (
          <div className="flex-center" style={{ padding: '30px' }}>
            <div className="spinner"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex-center" style={{ flexDirection: 'column', padding: '40px 20px', textAlign: 'center', gap: '10px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {filterQuery ? 'No conversations match your search.' : 'No conversations yet.'}
            </div>
            {!filterQuery && (
              <button className="btn-secondary" onClick={onOpenSearch} style={{ marginTop: '6px' }}>
                <SquarePen size={14} />
                <span>Find users</span>
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const otherParticipant =
              conv.otherParticipant ||
              conv.participants?.find((p) => p._id !== user?._id);

            const isOnline = otherParticipant
              ? onlineUsers[otherParticipant._id]?.isOnline !== undefined
                ? onlineUsers[otherParticipant._id].isOnline
                : otherParticipant.isOnline
              : false;

            const isActive = activeConversation?._id === conv._id;

            return (
              <button
                key={conv._id}
                className={`conversation-item ${isActive ? 'active' : ''}`}
                onClick={() => selectConversation(conv)}
              >
                <div className="avatar-container">
                  {otherParticipant?.avatar ? (
                    <img
                      src={otherParticipant.avatar}
                      alt={otherParticipant.username}
                      className="avatar-image"
                    />
                  ) : (
                    <div className="avatar-image">
                      <UserIcon size={20} />
                    </div>
                  )}
                  <span className={isOnline ? 'online-badge' : 'offline-badge'} />
                </div>

                <div className="conversation-details">
                  <div className="conversation-top">
                    <span className="conversation-name truncate">
                      {otherParticipant?.username || 'Unknown'}
                    </span>
                    {conv.latestMessage?.createdAt && (
                      <span className="conversation-time">
                        {formatConversationTime(conv.latestMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="conversation-bottom">
                    <div className="conversation-preview truncate">
                      {renderMessageStatus(conv.latestMessage)}
                      <span className="truncate">
                        {conv.latestMessage ? conv.latestMessage.text : 'Conversation started'}
                      </span>
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="unread-badge">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* User Mini Profile Strip */}
      <div className="user-profile-strip">
        <div className="user-strip-info" onClick={onOpenProfile} title="Edit profile">
          <div className="avatar-container">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="avatar-image"
                style={{ width: '38px', height: '38px' }}
              />
            ) : (
              <div className="avatar-image" style={{ width: '38px', height: '38px' }}>
                <UserIcon size={18} />
              </div>
            )}
            <span className="online-badge" />
          </div>

          <div className="user-strip-details">
            <span className="user-strip-name truncate">{user?.username}</span>
            <span className="user-strip-status">
              <span className="status-dot-sm"></span>
              Online
            </span>
          </div>
        </div>

        <button
          className="icon-button"
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

