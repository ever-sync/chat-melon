/**
 * MelonChat Widget v2.0 - Redesigned
 * Embeddable chat widget for websites
 * Last update: 2025-01-27
 */
(function(window, document) {
  'use strict';

  console.log('🍈 MelonChat Widget v2.0 loaded - Redesigned UI');

  // Get configuration from global
  const config = window.MelonChatConfig || {};
  const companyId = config.companyId;
  const primaryColor = config.primaryColor || '#22C55E';
  
  if (!companyId) {
    console.error('MelonChat: companyId is required');
    return;
  }

  // API base URL - use config or detect from script src
  const API_BASE = config.apiUrl || 'https://mrdexkpmxjkioiubyxwq.supabase.co/functions/v1/widget-api';
  
  // Session management
  const SESSION_KEY = `melonchat_session_${companyId}`;
  const CONV_KEY = `melonchat_conv_${companyId}`;
  
  let sessionId = localStorage.getItem(SESSION_KEY);
  let conversationId = localStorage.getItem(CONV_KEY);
  let widgetConfig = null;
  let isOpen = false;
  let lastMessageTime = null;
  let pollingInterval = null;
  let visitorId = null;

  // Generate new session if needed
  if (!sessionId) {
    sessionId = 'ses_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  // Inject styles
  const injectStyles = () => {
    const style = document.createElement('style');
    style.id = 'melonchat-styles';
    style.textContent = `
      #melonchat-widget {
        position: fixed;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        font-size: 14px;
        line-height: 1.5;
      }
      
      #melonchat-widget * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      .melonchat-bubble {
        position: fixed;
        bottom: 24px;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 6px 24px ${primaryColor}50, 0 2px 8px rgba(0,0,0,0.15);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 3px solid rgba(255,255,255,0.2);
      }

      .melonchat-bubble:hover {
        transform: scale(1.1) rotate(5deg);
        box-shadow: 0 8px 32px ${primaryColor}60, 0 4px 12px rgba(0,0,0,0.2);
      }

      .melonchat-bubble:active {
        transform: scale(1.05);
      }
      
      .melonchat-bubble.bottom-right {
        right: 20px;
      }
      
      .melonchat-bubble.bottom-left {
        left: 20px;
      }
      
      .melonchat-bubble svg {
        width: 28px;
        height: 28px;
        fill: currentColor;
      }
      
      .melonchat-window {
        position: fixed;
        bottom: 100px;
        width: 400px;
        height: 600px;
        max-height: calc(100vh - 130px);
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05);
        display: none;
        flex-direction: column;
        overflow: hidden;
        animation: melonchat-slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .melonchat-window.open {
        display: flex;
      }
      
      .melonchat-window.bottom-right {
        right: 20px;
      }
      
      .melonchat-window.bottom-left {
        left: 20px;
      }
      
      @keyframes melonchat-slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .melonchat-header {
        background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%);
        color: white;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 14px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      }

      .melonchat-header-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(255,255,255,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255,255,255,0.3);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .melonchat-header-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .melonchat-header-info {
        flex: 1;
      }

      .melonchat-header-title {
        font-weight: 700;
        font-size: 17px;
        letter-spacing: -0.01em;
      }

      .melonchat-header-subtitle {
        font-size: 13px;
        opacity: 0.95;
        margin-top: 2px;
      }
      
      .melonchat-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: background 0.2s;
      }
      
      .melonchat-close:hover {
        background: rgba(255,255,255,0.1);
      }
      
      .melonchat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 24px 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%);
      }

      .melonchat-messages::-webkit-scrollbar {
        width: 6px;
      }

      .melonchat-messages::-webkit-scrollbar-track {
        background: transparent;
      }

      .melonchat-messages::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
      }

      .melonchat-messages::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }

      .melonchat-message {
        max-width: 75%;
        padding: 12px 16px;
        border-radius: 16px;
        word-wrap: break-word;
        line-height: 1.5;
        font-size: 14px;
        animation: melonchat-messageSlide 0.3s ease;
      }

      @keyframes melonchat-messageSlide {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .melonchat-message.visitor {
        align-self: flex-end;
        background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%);
        color: white;
        border-bottom-right-radius: 4px;
        box-shadow: 0 2px 8px ${primaryColor}30;
      }

      .melonchat-message.agent {
        align-self: flex-start;
        background: white;
        color: #1f2937;
        border-bottom-left-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        border: 1px solid #f3f4f6;
      }

      .melonchat-message-time {
        font-size: 11px;
        opacity: 0.6;
        margin-top: 6px;
        font-weight: 400;
      }
      
      .melonchat-typing {
        align-self: flex-start;
        background: white;
        padding: 12px 16px;
        border-radius: 12px;
        display: none;
        gap: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .melonchat-typing.visible {
        display: flex;
      }
      
      .melonchat-typing-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #9ca3af;
        animation: melonchat-bounce 1.4s infinite;
      }
      
      .melonchat-typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .melonchat-typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      @keyframes melonchat-bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-8px); }
      }
      
      .melonchat-input-area {
        padding: 16px 20px;
        background: white;
        border-top: 1px solid #f0f0f0;
        display: flex;
        gap: 10px;
        box-shadow: 0 -2px 12px rgba(0,0,0,0.04);
      }

      .melonchat-input {
        flex: 1;
        border: 2px solid #e5e7eb;
        border-radius: 24px;
        padding: 12px 18px;
        font-size: 14px;
        outline: none;
        transition: all 0.2s ease;
        background: #f9fafb;
      }

      .melonchat-input:hover {
        border-color: #d1d5db;
        background: white;
      }

      .melonchat-input:focus {
        border-color: ${primaryColor};
        background: white;
        box-shadow: 0 0 0 3px ${primaryColor}15;
      }

      .melonchat-send {
        width: 44px;
        height: 44px;
        border: none;
        border-radius: 50%;
        background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px ${primaryColor}40;
      }

      .melonchat-send:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: 0 4px 12px ${primaryColor}50;
      }

      .melonchat-send:active:not(:disabled) {
        transform: scale(0.95);
      }

      .melonchat-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .melonchat-send svg {
        width: 20px;
        height: 20px;
      }
      
      .melonchat-prechat {
        padding: 32px 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        flex: 1;
        overflow-y: auto;
        background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      }

      .melonchat-prechat-title {
        font-size: 24px;
        font-weight: 700;
        color: #111827;
        line-height: 1.3;
        letter-spacing: -0.02em;
      }

      .melonchat-prechat-subtitle {
        color: #6b7280;
        font-size: 15px;
        line-height: 1.5;
        margin-top: -8px;
      }
      
      .melonchat-field {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .melonchat-label {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      .melonchat-field input {
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        padding: 12px 16px;
        font-size: 14px;
        outline: none;
        transition: all 0.2s ease;
        background: white;
      }

      .melonchat-field input:hover {
        border-color: #d1d5db;
      }

      .melonchat-field input:focus {
        border-color: ${primaryColor};
        box-shadow: 0 0 0 3px ${primaryColor}15;
      }

      .melonchat-start-btn {
        background: ${primaryColor};
        color: white;
        border: none;
        border-radius: 10px;
        padding: 14px 24px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: 12px;
        box-shadow: 0 2px 8px ${primaryColor}30;
      }

      .melonchat-start-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px ${primaryColor}40;
      }

      .melonchat-start-btn:active:not(:disabled) {
        transform: translateY(0);
      }

      .melonchat-start-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .melonchat-branding {
        text-align: center;
        padding: 8px;
        font-size: 11px;
        color: #9ca3af;
        background: white;
        border-top: 1px solid #f3f4f6;
      }
      
      .melonchat-branding a {
        color: #6b7280;
        text-decoration: none;
      }
      
      .melonchat-offline {
        background: #fef3c7;
        border: 1px solid #fcd34d;
        border-radius: 8px;
        padding: 12px;
        margin: 16px;
        text-align: center;
        color: #92400e;
        font-size: 13px;
      }
      
      .melonchat-greeting {
        background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
        padding: 20px;
        border-radius: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        margin-bottom: 12px;
        border: 1px solid #f3f4f6;
      }

      .melonchat-greeting-title {
        font-size: 20px;
        font-weight: 700;
        color: #111827;
        margin-bottom: 8px;
        line-height: 1.3;
        letter-spacing: -0.01em;
      }

      .melonchat-greeting-msg {
        color: #6b7280;
        font-size: 15px;
        line-height: 1.5;
      }
      
      @media (max-width: 480px) {
        .melonchat-window {
          width: calc(100vw - 20px);
          height: calc(100vh - 100px);
          bottom: 80px;
          right: 10px !important;
          left: 10px !important;
          border-radius: 12px;
        }
        
        .melonchat-bubble {
          width: 54px;
          height: 54px;
          bottom: 15px;
          right: 15px !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  // Icons
  const icons = {
    chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`
  };

  // Create widget DOM
  const createWidget = () => {
    const position = widgetConfig?.position || 'bottom-right';
    
    const container = document.createElement('div');
    container.id = 'melonchat-widget';
    
    container.innerHTML = `
      <div class="melonchat-bubble ${position}" id="melonchat-bubble">
        ${icons.chat}
      </div>
      
      <div class="melonchat-window ${position}" id="melonchat-window">
        <div class="melonchat-header">
          <div class="melonchat-header-avatar">
            ${widgetConfig?.logo_url ? `<img src="${widgetConfig.logo_url}" alt="">` : icons.user}
          </div>
          <div class="melonchat-header-info">
            <div class="melonchat-header-title">${widgetConfig?.company_name || 'Atendimento'}</div>
            <div class="melonchat-header-subtitle">Normalmente responde em minutos</div>
          </div>
          <button class="melonchat-close" id="melonchat-close">
            ${icons.close}
          </button>
        </div>
        
        <div id="melonchat-content">
          <!-- Content will be injected here -->
        </div>
        
        ${widgetConfig?.show_branding !== false ? `
          <div class="melonchat-branding">
            Powered by <a href="https://melonchat.com" target="_blank">MelonChat</a>
          </div>
        ` : ''}
      </div>
    `;
    
    document.body.appendChild(container);
    
    // Event listeners
    document.getElementById('melonchat-bubble').addEventListener('click', toggleWidget);
    document.getElementById('melonchat-close').addEventListener('click', toggleWidget);
  };

  // Toggle widget open/close
  const toggleWidget = () => {
    isOpen = !isOpen;
    const window = document.getElementById('melonchat-window');
    const bubble = document.getElementById('melonchat-bubble');
    
    if (isOpen) {
      window.classList.add('open');
      bubble.innerHTML = icons.close;
      
      if (!conversationId) {
        showPrechatForm();
      } else {
        showChat();
        startPolling();
      }
    } else {
      window.classList.remove('open');
      bubble.innerHTML = icons.chat;
      stopPolling();
    }
  };

  // Show pre-chat form
  const showPrechatForm = () => {
    const content = document.getElementById('melonchat-content');
    const requireName = widgetConfig?.require_name !== false;
    const requireEmail = widgetConfig?.require_email !== false;
    const requirePhone = widgetConfig?.require_phone === true;
    
    content.innerHTML = `
      <div class="melonchat-prechat">
        <div class="melonchat-prechat-title">${widgetConfig?.greeting_title || 'Olá! 👋'}</div>
        <div class="melonchat-prechat-subtitle">${widgetConfig?.greeting_message || 'Como posso ajudar você hoje?'}</div>
        
        ${widgetConfig?.is_offline ? `
          <div class="melonchat-offline">
            ${widgetConfig?.offline_message || 'Estamos offline no momento. Envie sua mensagem e responderemos em breve.'}
          </div>
        ` : ''}
        
        <form id="melonchat-prechat-form">
          ${requireName ? `
            <div class="melonchat-field">
              <label class="melonchat-label">Nome</label>
              <input type="text" name="name" placeholder="Seu nome" required>
            </div>
          ` : ''}
          
          ${requireEmail ? `
            <div class="melonchat-field">
              <label class="melonchat-label">Email</label>
              <input type="email" name="email" placeholder="seu@email.com" required>
            </div>
          ` : ''}
          
          ${requirePhone ? `
            <div class="melonchat-field">
              <label class="melonchat-label">Telefone</label>
              <input type="tel" name="phone" placeholder="(11) 99999-9999">
            </div>
          ` : ''}
          
          <button type="submit" class="melonchat-start-btn">Iniciar conversa</button>
        </form>
      </div>
    `;
    
    document.getElementById('melonchat-prechat-form').addEventListener('submit', handlePrechatSubmit);
  };

  // Handle pre-chat form submission
  const handlePrechatSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Iniciando...';
    
    const formData = new FormData(form);
    const data = {
      name: formData.get('name') || 'Visitante',
      email: formData.get('email') || null,
      phone: formData.get('phone') || null,
      metadata: {
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer
      }
    };
    
    try {
      const response = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-widget-company-id': companyId,
          'x-widget-session-id': sessionId
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }
      
      const result = await response.json();
      conversationId = result.conversation_id;
      visitorId = result.visitor_id;
      localStorage.setItem(CONV_KEY, conversationId);
      
      showChat();
      startPolling();
    } catch (error) {
      console.error('MelonChat error:', error);
      btn.disabled = false;
      btn.textContent = 'Iniciar conversa';
      alert('Erro ao iniciar conversa. Tente novamente.');
    }
  };

  // Show chat interface
  const showChat = () => {
    const content = document.getElementById('melonchat-content');
    
    content.innerHTML = `
      <div class="melonchat-messages" id="melonchat-messages">
        <div class="melonchat-greeting">
          <div class="melonchat-greeting-title">${widgetConfig?.greeting_title || 'Olá! 👋'}</div>
          <div class="melonchat-greeting-msg">${widgetConfig?.greeting_message || 'Como posso ajudar você hoje?'}</div>
        </div>
        <div class="melonchat-typing" id="melonchat-typing">
          <div class="melonchat-typing-dot"></div>
          <div class="melonchat-typing-dot"></div>
          <div class="melonchat-typing-dot"></div>
        </div>
      </div>
      <div class="melonchat-input-area">
        <input type="text" class="melonchat-input" id="melonchat-input" placeholder="${widgetConfig?.input_placeholder || 'Digite sua mensagem...'}" autocomplete="off">
        <button class="melonchat-send" id="melonchat-send">
          ${icons.send}
        </button>
      </div>
    `;
    
    const input = document.getElementById('melonchat-input');
    const sendBtn = document.getElementById('melonchat-send');
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    sendBtn.addEventListener('click', sendMessage);
    
    // Load existing messages
    loadMessages();
  };

  // Send message
  const sendMessage = async () => {
    const input = document.getElementById('melonchat-input');
    const content = input.value.trim();
    
    if (!content || !conversationId) return;
    
    input.value = '';
    input.disabled = true;
    
    // Add message to UI immediately
    addMessageToUI(content, 'visitor');
    
    try {
      const response = await fetch(`${API_BASE}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-widget-company-id': companyId,
          'x-widget-session-id': sessionId
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: content,
          message_type: 'text'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const result = await response.json();
      lastMessageTime = result.created_at;
    } catch (error) {
      console.error('MelonChat error:', error);
      // Could show error state on message
    } finally {
      input.disabled = false;
      input.focus();
    }
  };

  // Add message to UI
  const addMessageToUI = (content, type, time) => {
    const messages = document.getElementById('melonchat-messages');
    const typing = document.getElementById('melonchat-typing');
    
    const msg = document.createElement('div');
    msg.className = `melonchat-message ${type}`;
    msg.innerHTML = `
      ${content}
      ${time ? `<div class="melonchat-message-time">${formatTime(time)}</div>` : ''}
    `;
    
    messages.insertBefore(msg, typing);
    messages.scrollTop = messages.scrollHeight;
    
    // Play sound for agent messages
    if (type === 'agent' && widgetConfig?.play_sound !== false) {
      playNotificationSound();
    }
  };

  // Format time
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Load messages
  const loadMessages = async () => {
    if (!conversationId) return;
    
    try {
      const url = new URL(`${API_BASE}/messages`);
      url.searchParams.set('conversation_id', conversationId);
      if (lastMessageTime) {
        url.searchParams.set('after', lastMessageTime);
      }
      
      const response = await fetch(url, {
        headers: {
          'x-widget-company-id': companyId,
          'x-widget-session-id': sessionId
        }
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        // Only add new messages if we already have some
        if (lastMessageTime) {
          data.messages.forEach(msg => {
            const type = msg.sender_type === 'visitor' ? 'visitor' : 'agent';
            addMessageToUI(msg.content, type, msg.created_at);
          });
        } else {
          // Initial load - add all
          data.messages.forEach(msg => {
            const type = msg.sender_type === 'visitor' ? 'visitor' : 'agent';
            addMessageToUI(msg.content, type, msg.created_at);
          });
        }
        
        lastMessageTime = data.messages[data.messages.length - 1].created_at;
      }
    } catch (error) {
      console.error('MelonChat error loading messages:', error);
    }
  };

  // Start polling for new messages
  const startPolling = () => {
    if (pollingInterval) return;
    pollingInterval = setInterval(loadMessages, 3000);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio not supported
    }
  };

  // Load widget config
  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/config?companyId=${companyId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('MelonChat: Widget not configured');
          return false;
        }
        if (response.status === 403) {
          console.warn('MelonChat: Widget disabled');
          return false;
        }
        throw new Error('Failed to load config');
      }
      
      widgetConfig = await response.json();
      return true;
    } catch (error) {
      console.error('MelonChat error:', error);
      return false;
    }
  };

  // Initialize widget
  const init = async () => {
    const configLoaded = await loadConfig();
    if (!configLoaded) return;
    
    injectStyles();
    createWidget();
    
    // Auto-open after delay if configured
    if (widgetConfig?.auto_open_delay) {
      setTimeout(() => {
        if (!isOpen) toggleWidget();
      }, widgetConfig.auto_open_delay * 1000);
    }
  };

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
