import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import UserSearchModal from '../components/UserSearchModal';
import ProfileModal from '../components/ProfileModal';
import { useChat } from '../context/ChatContext';

const ChatPage = () => {
  const { activeConversation, setActiveConversation } = useChat();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewOnlyUser, setViewOnlyUser] = useState(null);

  // On mobile: if activeConversation is set, sidebar is hidden. If null, sidebar is visible.
  const isMobileSidebarOpen = !activeConversation;

  const handleBackToConversations = () => {
    setActiveConversation(null);
  };

  const handleOpenMyProfile = () => {
    setViewOnlyUser(null);
    setIsProfileModalOpen(true);
  };

  const handleOpenUserProfile = (user) => {
    setViewOnlyUser(user);
    setIsProfileModalOpen(true);
  };

  return (
    <div className="chat-layout">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onOpenProfile={handleOpenMyProfile}
      />

      <ChatWindow
        onBack={handleBackToConversations}
        onOpenUserProfile={handleOpenUserProfile}
      />

      <UserSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setViewOnlyUser(null);
        }}
        viewOnlyUser={viewOnlyUser}
      />
    </div>
  );
};

export default ChatPage;

