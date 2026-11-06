import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal } from 'lucide-react';

const MessageInput = ({ onSendMessage, onTyping }) => {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e) => {
    setText(e.target.value);
    if (onTyping) {
      onTyping(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSendMessage(text);
    setText('');
    if (onTyping) {
      onTyping(false);
    }
  };

  return (
    <div className="chat-input-area">
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <button
          type="submit"
          className="send-button"
          disabled={!text.trim()}
          aria-label="Send message"
        >
          <SendHorizontal size={18} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;

