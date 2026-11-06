import React, { useState } from 'react';
import { X, Check, User as UserIcon, Mail, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PRESET_AVATARS } from '../utils/avatarUtils';

const ProfileModal = ({ isOpen, onClose, viewOnlyUser }) => {
  const { user, updateProfile } = useAuth();
  const { success, error } = useToast();

  const isSelf = !viewOnlyUser || viewOnlyUser._id === user?._id;
  const targetUser = isSelf ? user : viewOnlyUser;

  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);

  // Sync state if user changes
  React.useEffect(() => {
    if (user && isSelf) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
    }
  }, [user, isSelf, isOpen]);

  if (!isOpen || !targetUser) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      error('Username cannot be empty');
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        username: username.trim(),
        bio: bio.trim(),
        avatar
      });
      success('Profile updated successfully');
      onClose();
    } catch (err) {
      error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isSelf ? 'Profile Settings' : 'User Information'}</h3>
          <button className="icon-button" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {isSelf ? (
            <form onSubmit={handleSave} className="auth-form">
              <div className="flex-center" style={{ flexDirection: 'column', gap: '12px', marginBottom: '8px' }}>
                <div className="avatar-container">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={username}
                      className="avatar-image"
                      style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-lg)' }}
                    />
                  ) : (
                    <div
                      className="avatar-image"
                      style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-lg)' }}
                    >
                      <UserIcon size={32} />
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Choose an avatar or provide a custom image URL</span>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Preset Avatars</label>
                <div className="avatar-preset-grid">
                  {PRESET_AVATARS.map((presetUrl, idx) => (
                    <div
                      key={idx}
                      className={`avatar-preset-item ${avatar === presetUrl ? 'selected' : ''}`}
                      onClick={() => setAvatar(presetUrl)}
                    >
                      <img src={presetUrl} alt={`Preset ${idx + 1}`} className="avatar-preset-img" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Custom Avatar URL</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '14px' }}
                  placeholder="https://example.com/avatar.png"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '14px' }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={30}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">About / Bio</label>
                <textarea
                  className="input-field"
                  style={{ paddingLeft: '14px', minHeight: '70px', resize: 'vertical' }}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={120}
                  placeholder="Tell others a bit about yourself"
                />
              </div>

              <div className="form-group" style={{ opacity: 0.7 }}>
                <label className="form-label">Email</label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="text"
                    className="input-field"
                    value={user?.email || ''}
                    disabled
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
                style={{ marginTop: '12px' }}
              >
                {saving ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              <div className="avatar-container">
                {targetUser.avatar ? (
                  <img
                    src={targetUser.avatar}
                    alt={targetUser.username}
                    className="avatar-image"
                    style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-lg)' }}
                  />
                ) : (
                  <div
                    className="avatar-image"
                    style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-lg)' }}
                  >
                    <UserIcon size={36} />
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {targetUser.username}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {targetUser.bio || 'Available'}
                </p>
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="user-search-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Mail size={16} color="var(--text-muted)" />
                    <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{targetUser.email}</span>
                  </div>
                </div>

                {targetUser.createdAt && (
                  <div className="user-search-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Calendar size={16} color="var(--text-muted)" />
                      <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                        Member since {new Date(targetUser.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

