import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Bot,
  User,
  ChevronDown,
} from 'lucide-react';
import api from '../api/axios';

const MAX_CHAR_LIMIT = 1000;
const INITIAL_GREETING =
  "Hi there! 👋 I'm your LaundryConnect Assistant. Ask me anything about our fabric care services, delivery charges, free delivery thresholds, 24-hr express turnaround, or tracking your order!";

const QUICK_SUGGESTIONS = [
  'What are your delivery charges?',
  'When is delivery free?',
  'How does 24-hr express turnaround work?',
  'What services do you offer?',
];

/**
 * Formats basic markdown elements (bold, bullet lists, newlines) without external heavyweight parsers.
 */
const formatBotText = (text) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-1.5 list-disc pl-4 space-y-1 text-sm">
          {currentList.map((item, idx) => (
            <li key={idx}>{parseInlineFormatting(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const parseInlineFormatting = (str) => {
    // Split by bold (**text**)
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-theme-primary">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(trimmed.slice(2));
    } else {
      flushList();
      if (trimmed.length > 0) {
        elements.push(
          <p key={`p-${index}`} className="my-1 text-sm leading-relaxed">
            {parseInlineFormatting(trimmed)}
          </p>
        );
      }
    }
  });

  flushList();
  return elements;
};

const ChatWidget = () => {
  // Persist open/closed state across SPA navigations within the session
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return sessionStorage.getItem('lc_chat_widget_open') === 'true';
    } catch {
      return false;
    }
  });

  // Conversation history in widget React state (sliding window of messages)
  // History resets when widget/page is closed
  const [messages, setMessages] = useState([
    {
      id: 'initial-greeting',
      role: 'assistant',
      content: INITIAL_GREETING,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Responsive viewport dimensions tracker accounting for browser zoom and window resize
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.clientWidth || window.innerWidth;
    }
    return 1024;
  });

  const [viewportHeight, setViewportHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight;
    }
    return 800;
  });

  // Dynamic navbar rendered height tracker (adapts to mobile, desktop, zoom, and font scaling)
  const [navbarHeight, setNavbarHeight] = useState(() => {
    if (typeof document !== 'undefined') {
      const nav = document.querySelector('nav');
      if (nav) {
        const h = nav.getBoundingClientRect().height;
        if (h > 0) return Math.round(h);
      }
    }
    return 76;
  });

  const location = useLocation();

  // Dynamic cart detection on mobile to avoid overlapping the bottom checkout bar on /services
  const [hasCart, setHasCart] = useState(false);

  useEffect(() => {
    const checkCart = () => {
      try {
        const stored = localStorage.getItem('laundry_cart');
        if (stored) {
          const parsed = JSON.parse(stored);
          setHasCart(Object.keys(parsed).length > 0);
          return;
        }
      } catch {}
      setHasCart(false);
    };

    checkCart();
    window.addEventListener('storage', checkCart);
    const interval = setInterval(checkCart, 800);
    return () => {
      window.removeEventListener('storage', checkCart);
      clearInterval(interval);
    };
  }, [location.pathname]);

  useEffect(() => {
    const updateDimensions = () => {
      // clientWidth represents visible viewport width strictly excluding scrollbars
      const currentWidth = document.documentElement.clientWidth || window.innerWidth;
      const currentHeight = window.innerHeight;
      setViewportWidth(currentWidth);
      setViewportHeight(currentHeight);

      // Measure actual rendered navbar height directly from DOM
      const nav = document.querySelector('nav');
      if (nav) {
        const rect = nav.getBoundingClientRect();
        if (rect.height > 0) {
          setNavbarHeight(Math.round(rect.height));
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions, { passive: true });
    window.addEventListener('orientationchange', updateDimensions, { passive: true });

    let observer = null;
    if (typeof ResizeObserver !== 'undefined' && document.documentElement) {
      observer = new ResizeObserver(() => {
        updateDimensions();
      });
      observer.observe(document.documentElement);
      const navEl = document.querySelector('nav');
      if (navEl) observer.observe(navEl);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
      if (observer) observer.disconnect();
    };
  }, [location.pathname]);

  // Sync open state with sessionStorage
  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    try {
      sessionStorage.setItem('lc_chat_widget_open', String(nextState));
    } catch {
      // sessionStorage unavailable
    }
  };

  // Close widget and reset history per requirement:
  // "History resets when the widget/page is closed — no need to persist across sessions in this phase"
  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem('lc_chat_widget_open', 'false');
    } catch {
      // ignore
    }
    // Reset conversation history
    setMessages([
      {
        id: `greeting-${Date.now()}`,
        role: 'assistant',
        content: INITIAL_GREETING,
        timestamp: new Date(),
      },
    ]);
    setLastFailedMessage(null);
  };

  // Reset conversation while keeping widget open
  const handleResetChat = () => {
    setMessages([
      {
        id: `greeting-${Date.now()}`,
        role: 'assistant',
        content: INITIAL_GREETING,
        timestamp: new Date(),
      },
    ]);
    setLastFailedMessage(null);
    setInput('');
  };

  // Auto-scroll to bottom of messages list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  // Send message to Gemini chat backend
  const handleSendMessage = async (textToSend) => {
    const rawContent = (typeof textToSend === 'string' ? textToSend : input).trim();
    if (!rawContent || isLoading) return;

    // Enforce client-side character limit
    const messageContent = rawContent.slice(0, MAX_CHAR_LIMIT);

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    // Calculate updated messages list for UI
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setLastFailedMessage(null);

    // Prepare payload: filter out prior error messages and extract last 10 messages for multi-turn context
    const validHistory = updatedMessages
      .filter((m) => !m.isError && (m.role === 'user' || m.role === 'assistant'))
      .slice(-10)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      const response = await api.post('/chat', {
        messages: validHistory,
      });

      if (response.data && response.data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: response.data.reply,
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error('Empty response received');
      }
    } catch (err) {
      const fallbackText =
        err.response?.data?.message ||
        "Sorry, I'm having trouble responding right now — try again in a moment or contact support";

      // Save failed message content so user can retry with one click
      setLastFailedMessage(messageContent);

      // Append distinct fallback error bubble
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: fallbackText,
          isError: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Retry the last failed message
  const handleRetry = () => {
    if (!lastFailedMessage || isLoading) return;
    const msgToRetry = lastFailedMessage;

    // Remove the last error bubble
    setMessages((prev) => prev.filter((m) => !m.isError));
    // Re-send the message
    handleSendMessage(msgToRetry);
  };

  // Handle Enter key for submission (Shift+Enter for newline)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Responsive layout & clearance calculations:
  // Mobile (< 640px): right offset 16px (1rem), margin budget 32px (2rem)
  // Desktop (>= 640px): right offset 24px (1.5rem), margin budget 48px (3rem)
  const isSm = viewportWidth >= 640;
  const rightOffset = isSm ? '1.5rem' : '1rem';
  const panelWidth = isSm ? 'min(420px, calc(100vw - 3rem))' : 'min(420px, calc(100vw - 2rem))';
  const panelMaxWidth = isSm ? 'calc(100vw - 3rem)' : 'calc(100vw - 2rem)';

  // Minimum clearance buffer (16px) strictly below the rendered navbar's bottom edge
  const safeNavbarHeight = typeof navbarHeight === 'number' && navbarHeight > 0 ? navbarHeight : 76;
  const TOP_CLEARANCE_BUFFER = 16;
  const minTopFloor = safeNavbarHeight + TOP_CLEARANCE_BUFFER;

  // Bottom anchor offset: 6rem (lifted on mobile if services cart is active)
  const isServicesCartActive = location.pathname === '/services' && hasCart;
  const bottomOffsetRem = !isSm && isServicesCartActive ? 9.5 : 6;
  const rootFontSize = typeof window !== 'undefined'
    ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    : 16;
  const bottomOffsetPx = bottomOffsetRem * rootFontSize;

  // Calculate maximum allowed height so the computed top position can NEVER be less than minTopFloor
  // Math: computedTop = viewportHeight - bottomOffsetPx - panelHeight >= minTopFloor
  // <=> panelHeight <= viewportHeight - bottomOffsetPx - minTopFloor
  const maxAvailableVerticalSpace = Math.max(260, viewportHeight - bottomOffsetPx - minTopFloor);
  const clampedHeightPx = Math.min(580, maxAvailableVerticalSpace);

  // CSS expression providing instantaneous GPU-level clamping matching the exact formula
  const cssHeightExpression = `min(580px, calc(100dvh - ${minTopFloor}px - ${bottomOffsetRem}rem))`;

  return (
    <>
      {/* Floating Action Launcher Button */}
      <div 
        className={`fixed z-[60] right-4 sm:right-6 transition-all duration-300 ${
          isServicesCartActive ? 'bottom-20 sm:bottom-6' : 'bottom-6'
        }`} 
        style={{ zIndex: 60 }}
      >
        <motion.button
          onClick={handleToggleOpen}
          aria-label={isOpen ? 'Close chat assistant' : 'Open chat assistant'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative flex items-center gap-2.5 px-4 py-3.5 rounded-full shadow-theme-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2 ${
            isOpen
              ? 'bg-theme-card text-theme-primary border border-theme-border shadow-xl'
              : 'bg-theme-accent text-slate-950 font-semibold shadow-theme-accent hover:brightness-105'
          }`}
        >
          {isOpen ? (
            <>
              <ChevronDown className="w-5 h-5 text-theme-muted" />
              <span className="text-sm font-medium">Close Assistant</span>
            </>
          ) : (
            <>
              <div className="relative">
                <MessageSquare className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
              </div>
              <span className="text-sm font-semibold tracking-wide">Ask AI</span>
              <Sparkles className="w-4 h-4 text-slate-900 animate-pulse" />
            </>
          )}
        </motion.button>
      </div>

      {/* Chat Window Modal / Flyout */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.94 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              width: panelWidth,
              maxWidth: panelMaxWidth,
              height: cssHeightExpression,
              maxHeight: cssHeightExpression,
              bottom: `${bottomOffsetRem}rem`,
              right: rightOffset,
              top: 'auto',
              zIndex: 60,
              overflow: 'hidden',
              boxSizing: 'border-box',
              transformOrigin: 'bottom right',
            }}
            className="fixed z-[60] flex flex-col rounded-3xl border border-theme-border/90 bg-theme-card/95 backdrop-blur-2xl shadow-theme-xl shadow-2xl overflow-hidden ring-1 ring-white/5"
          >
            {/* Widget Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border/80 bg-theme-surface/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md ring-1 ring-amber-400/30">
                  <Bot className="w-5 h-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-theme-card ring-1 ring-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-theme-primary flex items-center gap-1.5">
                    LaundryConnect AI
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-theme-accent/20 text-theme-accent border border-theme-accent/30">
                      Beta
                    </span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-theme-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                    <span>Instant pricing & policies</span>
                  </div>
                </div>
              </div>

              {/* Header Action Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Reset conversation"
                  aria-label="Reset conversation"
                  className="p-2 sm:p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-elevated transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  title="Close widget"
                  aria-label="Close widget"
                  className="p-2 sm:p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-elevated transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isError = !!msg.isError;

                if (isError) {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl p-4 border border-red-500/40 bg-red-500/10 text-theme-primary text-sm shadow-sm space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 text-xs text-red-200/90 leading-relaxed font-normal">
                          {msg.content}
                        </div>
                      </div>

                      {/* Prominent Retry Button */}
                      <div className="flex items-center justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleRetry}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                          Retry
                        </button>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-theme-surface border border-theme-border/80 flex items-center justify-center text-theme-accent flex-shrink-0 mt-0.5 shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-theme-accent text-slate-950 font-medium rounded-br-xs shadow-sm'
                          : 'bg-theme-surface/90 text-theme-primary border border-theme-border/70 rounded-bl-xs shadow-sm'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      ) : (
                        <div className="leading-relaxed">{formatBotText(msg.content)}</div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-theme-accent/20 border border-theme-accent/30 flex items-center justify-center text-theme-accent flex-shrink-0 mt-0.5 shadow-sm">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Bot Typing Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 text-theme-muted text-xs"
                >
                  <div className="w-8 h-8 rounded-xl bg-theme-surface border border-theme-border/80 flex items-center justify-center text-theme-accent flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-theme-surface border border-theme-border/70 rounded-bl-xs shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-theme-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-theme-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-theme-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}

              {/* Quick suggestion chips (display when conversation is short) */}
              {messages.length <= 2 && !isLoading && (
                <div className="pt-2">
                  <p className="text-[11px] uppercase font-semibold tracking-wider text-theme-subtle mb-2.5">
                    Quick Questions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(suggestion)}
                        className="text-xs text-left px-3 py-2 rounded-xl border border-theme-border bg-theme-surface/70 hover:bg-theme-elevated hover:border-theme-accent/50 text-theme-muted hover:text-theme-primary transition-all duration-150 shadow-xs"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form & Character Counter */}
            <div className="p-4 pt-3.5 border-t border-theme-border/80 bg-theme-surface/70 backdrop-blur-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex flex-col gap-2"
              >
                <div className="relative flex items-center">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about prices, turnaround, tracking..."
                    maxLength={MAX_CHAR_LIMIT}
                    disabled={isLoading}
                    className="w-full resize-none rounded-2xl py-3 pl-4 pr-12 text-xs sm:text-sm bg-theme-elevated/70 border border-theme-border/80 focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 text-theme-primary placeholder-theme-subtle outline-none transition-all disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    aria-label="Send message"
                    className="absolute right-2.5 p-2 rounded-xl bg-theme-accent text-slate-950 font-semibold hover:brightness-105 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between px-1.5 text-[11px] text-theme-subtle">
                  <span>Shift+Enter for newline</span>
                  <span className={input.length >= 900 ? 'text-amber-400 font-medium' : ''}>
                    {input.length}/{MAX_CHAR_LIMIT}
                  </span>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
