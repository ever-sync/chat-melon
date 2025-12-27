/**
 * MelonChat Widget v1.0
 * Embeddable chat widget for websites
 */
(function(window, document) {
  'use strict';

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
        bottom: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${primaryColor};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      .melonchat-bubble:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(0,0,0,0.25);
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
        bottom: 90px;
        width: 380px;
        height: 520px;
        max-height: calc(100vh - 120px);
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
        animation: melonchat-slideUp 0.3s ease;
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
        background: ${primaryColor};
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .melonchat-header-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
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
        font-weight: 600;
        font-size: 16px;
      }
      
      .melonchat-header-subtitle {
        font-size: 12px;
        opacity: 0.9;
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
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #f9fafb;
      }
      
      .melonchat-message {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        word-wrap: break-word;
      }
      
      .melonchat-message.visitor {
        align-self: flex-end;
        background: ${primaryColor};
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      .melonchat-message.agent {
        align-self: flex-start;
        background: white;
        color: #1f2937;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .melonchat-message-time {
        font-size: 10px;
        opacity: 0.7;
        margin-top: 4px;
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
        padding: 12px 16px;
        background: white;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
      }
      
      .melonchat-input {
        flex: 1;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        padding: 10px 16px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      
      .melonchat-input:focus {
        border-color: ${primaryColor};
      }
      
      .melonchat-send {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 50%;
        background: ${primaryColor};
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s;
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
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        flex: 1;
        overflow-y: auto;
      }
      
      .melonchat-prechat-title {
        font-size: 20px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .melonchat-prechat-subtitle {
        color: #6b7280;
        font-size: 14px;
      }
      
      .melonchat-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .melonchat-label {
        font-size: 13px;
        font-weight: 500;
        color: #374151;
      }
      
      .melonchat-field input {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      
      .melonchat-field input:focus {
        border-color: ${primaryColor};
      }
      
      .melonchat-start-btn {
        background: ${primaryColor};
        color: white;
        border: none;
        border-radius: 8px;
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s;
        margin-top: 8px;
      }
      
      .melonchat-start-btn:disabled {
        opacity: 0.5;
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
        background: white;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        margin-bottom: 8px;
      }
      
      .melonchat-greeting-title {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }
      
      .melonchat-greeting-msg {
        color: #6b7280;
        font-size: 14px;
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
