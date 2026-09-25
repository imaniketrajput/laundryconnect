import React, { useState, useEffect, useRef } from 'react';
import socket from '../api/socket';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';

const QUICK_CHIPS = [
  "I'm outside",
  "Which gate / flat number?",
  "On my way",
  "Please ring doorbell"
];

const OrderChatPanel = ({ orderId, defaultCollapsed = true }) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const [isThrottled, setIsThrottled] = useState(false);

  const messagesEndRef = useRef(null);
  const isCollapsedRef = useRef(isCollapsed);
  const orderIdRef = useRef(orderId);

  // Keep refs in sync for socket listener callbacks
  useEffect(() => {
    isCollapsedRef.current = isCollapsed;
  }, [isCollapsed]);

  useEffect(() => {
    orderIdRef.current = orderId;
  }, [orderId]);

  // Scroll to bottom helper
  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // On mount or orderId change: fetch history, join socket room, listen for newChatMessage
  useEffect(() => {
    if (!orderId) return;

    setLoadingHistory(true);
    setError('');

    // 1. Fetch message history from separate chat DB via REST endpoint
    api.get(`/orders/${orderId}/messages`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setMessages(res.data);
        }
      })
      .catch((err) => {
        // If 503, chat database may be temporarily offline
        if (err.response?.status === 503) {
          setError('Live chat is temporarily offline.');
        } else {
          console.error('[OrderChat] Failed to load messages:', err.message);
        }
      })
      .finally(() => {
        setLoadingHistory(false);
        setTimeout(() => scrollToBottom('auto'), 150);
      });

    // 2. Connect socket and join the order room (reuse exact same pattern from TrackOrder)
    socket.connect();
    socket.emit('joinOrderRoom', orderId);

    // 3. Listen for incoming live chat messages
    const handleNewChatMessage = (msg) => {
      // Validate incoming message belongs to this order
      if (msg.order && msg.order.toString() !== orderIdRef.current.toString()) {
        return;
      }

      setMessages((prev) => {
        // Prevent duplicate appending
        if (msg._id && prev.some((m) => m._id === msg._id)) {
          return prev;
        }
        return [...prev, msg];
      });

      // If panel is currently collapsed, increment unread badge counter
      if (isCollapsedRef.current) {
        setUnreadCount((c) => c + 1);
      } else {
        setTimeout(() => scrollToBottom('smooth'), 100);
      }
    };

    socket.on('newChatMessage', handleNewChatMessage);

    // 4. Cleanup on unmount or orderId switch
    return () => {
      socket.off('newChatMessage', handleNewChatMessage);
    };
  }, [orderId]);

  // Auto-scroll when messages change and panel is open
  useEffect(() => {
    if (!isCollapsed) {
      scrollToBottom('smooth');
    }
  }, [messages, isCollapsed]);

  const toggleCollapse = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setUnreadCount(0);
      setTimeout(() => scrollToBottom('auto'), 100);
    } else {
      setIsCollapsed(true);
    }
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || isThrottled) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be signed in to send messages.');
      return;
    }

    if (textToSend.length > 1000) {
      setError('Message exceeds 1000 characters.');
      return;
    }

    // Local 1-second throttle matching server-side rate limit
    setIsThrottled(true);
    setTimeout(() => setIsThrottled(false), 1000);

    // Emit live message over order-scoped socket room
    socket.emit('sendChatMessage', {
      orderId,
      text: textToSend,
      token,
    });

    setInputText('');
    setError('');
  };

  const currentUserId = user?._id || user?.id;
  const currentUserRole = user?.role;

  return (
    <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-sm overflow-hidden transition-all duration-200 w-full">
      {/* ── Collapsible Header / Toggle Bar ── */}
      <button
        type="button"
        onClick={toggleCollapse}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-theme-elevated/40 transition-colors cursor-pointer select-none focus:outline-none"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-theme-accent-light/15 border border-theme-accent/30 flex items-center justify-center text-theme-accent">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-theme-card" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-theme-primary font-poppins truncate">
                Direct Order Chat
              </h3>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Live
              </span>
            </div>
            <p className="text-xs text-theme-muted truncate mt-0.5">
              Coordination between customer &amp; delivery partner
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 flex-shrink-0 ml-2">
          {/* Unread Message Badge (shown when collapsed and new messages arrived) */}
          {isCollapsed && unreadCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-theme-accent text-[var(--accent-text)] animate-pulse shadow-sm">
              {unreadCount} {unreadCount === 1 ? 'new' : 'new'}
            </span>
          )}

          <div className="w-8 h-8 rounded-xl bg-theme-elevated border border-theme flex items-center justify-center text-theme-muted">
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </div>
        </div>
      </button>

      {/* ── Expandable Chat Body ── */}
      {!isCollapsed && (
        <div className="border-t border-theme p-4 sm:p-5 space-y-4 animate-fade-in bg-theme-surface/30">
          {/* 7-Day TTL Policy Info Banner */}
          <div className="flex items-center justify-between px-3 py-2 bg-theme-elevated/60 border border-theme rounded-2xl text-[11px] text-theme-muted">
            <div className="flex items-center space-x-1.5">
              <Clock className="h-3.5 w-3.5 text-theme-accent flex-shrink-0" />
              <span>7-Day Auto-Cleanup: messages delete automatically after 7 days</span>
            </div>
            <div className="hidden sm:flex items-center space-x-1 text-emerald-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Encrypted Room</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Message List */}
          <div className="h-64 sm:h-72 overflow-y-auto space-y-3 p-3 bg-theme-card rounded-2xl border border-theme">
            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center h-full text-theme-muted space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-theme-accent" />
                <span className="text-xs">Loading message history...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-theme-muted space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-theme-elevated border border-theme flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 opacity-60 text-theme-accent" />
                </div>
                <p className="text-xs font-semibold text-theme-primary">No messages yet</p>
                <p className="text-[11px] max-w-xs text-theme-muted">
                  Send a quick message to coordinate pickup location, gate code, or delivery instructions.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMyMessage =
                  (currentUserId && msg.sender?.toString() === currentUserId.toString()) ||
                  (currentUserRole && msg.senderRole === currentUserRole);

                const roleLabel =
                  msg.senderRole === 'partner'
                    ? (isMyMessage ? 'You (Delivery Partner)' : 'Delivery Partner')
                    : (isMyMessage ? 'You (Customer)' : 'Customer');

                const timeString = msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <div
                    key={msg._id || idx}
                    className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1 px-1 text-[10px] text-theme-muted">
                      <span className="font-semibold text-theme-primary">{roleLabel}</span>
                      <span>&bull;</span>
                      <span>{timeString}</span>
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] px-3.5 py-2.5 text-xs sm:text-sm break-words ${
                        isMyMessage
                          ? 'bg-theme-accent text-[var(--accent-text)] rounded-2xl rounded-tr-xs shadow-theme-accent'
                          : 'bg-theme-elevated text-theme-primary border border-theme rounded-2xl rounded-tl-xs shadow-theme-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputText(chip)}
                className="text-[11px] px-2.5 py-1 bg-theme-elevated hover:bg-theme-elevated/80 text-theme-primary rounded-xl border border-theme transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Message Input & Send Bar */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                maxLength={1000}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type coordination message (e.g. 'I am at gate 2')..."
                className="w-full px-3.5 py-2.5 bg-theme-elevated border border-theme rounded-2xl text-xs sm:text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:border-theme-accent transition-colors font-sans"
              />
              {inputText.length > 900 && (
                <span className="absolute right-3 top-2.5 text-[10px] font-mono text-amber-500">
                  {1000 - inputText.length}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isThrottled}
              className="px-4 py-2.5 bg-theme-accent text-[var(--accent-text)] rounded-2xl text-xs sm:text-sm font-bold shadow-theme-accent disabled:opacity-50 transition-all flex items-center space-x-1.5 theme-btn-hover flex-shrink-0 cursor-pointer"
            >
              <span>Send</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default OrderChatPanel;
