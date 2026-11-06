import React, { useState, useEffect } from 'react';
import { X, Search, MessageSquare, User as UserIcon } from 'lucide-react';
import { searchUsersApi, fetchAllUsersApi } from '../services/userService';
import { useChat } from '../context/ChatContext';

const UserSearchModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { startConversationWithUser, onlineUsers } = useChat();

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setUsers([]);
      return;
    }

    const loadInitialUsers = async () => {
      try {
        setLoading(true);
        const res = await fetchAllUsersApi();
        if (res.success && res.data) {
          setUsers(res.data);
        }
      } catch (err) {
        console.error('[UserSearch] Load users error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialUsers();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (!searchQuery.trim()) {
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await searchUsersApi(searchQuery);
        if (res.success && res.data) {
          setUsers(res.data);
        }
      } catch (err) {
        console.error('[UserSearch] Search error:', err.message);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, isOpen]);

  const handleStartChat = async (userId) => {
    try {
      await startConversationWithUser(userId);
      onClose();
    } catch (err) {
      console.error('[UserSearch] Start chat error:', err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">New Conversation</h3>
          <button className="icon-button" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="user-search-list">
            {loading ? (
              <div className="flex-center" style={{ padding: '24px' }}>
                <div className="spinner"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="flex-center" style={{ padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No registered users found
              </div>
            ) : (
              users.map((u) => {
                const isOnline = onlineUsers[u._id]?.isOnline !== undefined
                  ? onlineUsers[u._id].isOnline
                  : u.isOnline;

                return (
                  <div key={u._id} className="user-search-item">
                    <div className="user-search-item-info">
                      <div className="avatar-container">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.username} className="avatar-image" />
                        ) : (
                          <div className="avatar-image">
                            <UserIcon size={18} />
                          </div>
                        )}
                        <span className={isOnline ? 'online-badge' : 'offline-badge'} />
                      </div>
                      <div className="user-search-names">
                        <span className="user-search-username">{u.username}</span>
                        <span className="user-search-bio truncate">{u.bio || 'Available'}</span>
                      </div>
                    </div>

                    <button
                      className="btn-secondary"
                      onClick={() => handleStartChat(u._id)}
                    >
                      <MessageSquare size={14} />
                      <span>Chat</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;

