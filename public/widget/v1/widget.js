/**
 * MelonChat Widget v3.0 - Premium Edition
 * High-end, customizable chat widget for websites
 * Author: Antigravity / DeepMind
 */
(function(window, document) {
  'use strict';

  // Get configuration from global
  const config = window.MelonChatConfig || {};
  const companyId = config.companyId;
  
  if (!companyId) {
    console.error('🍈 MelonChat: companyId is required');
    return;
  }

  // API base URL
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
  let isTyping = false;

  // Generate new session if needed
  if (!sessionId) {
    sessionId = 'ses_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  // Inject styles with premium design
  const injectStyles = (settings) => {
    const primary = settings?.primary_color || config.primaryColor || '#22C55E';
    const headerGrad = settings?.header_gradient || `linear-gradient(135deg, ${primary} 0%, ${primary}dd 100%)`;
    const bubbleGrad = settings?.bubble_gradient || `linear-gradient(135deg, ${primary} 0%, ${primary}dd 100%)`;
    const borderRadius = (settings?.border_radius || 16) + 'px';
    const fontFamily = settings?.font_family || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif';
    
    const shadows = {
      none: 'none',
      low: '0 4px 12px rgba(0,0,0,0.05)',
      medium: '0 12px 32px rgba(0,0,0,0.12)',
      high: '0 24px 64px rgba(0,0,0,0.2)'
    };
    const shadowIntensity = settings?.shadow_intensity || 'medium';
    const mainShadow = shadows[shadowIntensity];

    const style = document.createElement('style');
    style.id = 'melonchat-styles';
    style.textContent = `
      #melonchat-widget {
        position: fixed;
        z-index: 2147483647;
        font-family: ${fontFamily};
        font-size: 14px;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
      }
      
      #melonchat-widget * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      .melonchat-bubble {
        position: fixed;
        bottom: 24px;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        background: ${bubbleGrad};
        box-shadow: 0 8px 24px ${primary}40;
      }

      .melonchat-bubble.small { width: 52px; height: 52px; }
      .melonchat-bubble.medium { width: 64px; height: 64px; }
      .melonchat-bubble.large { width: 76px; height: 76px; }
      
      .melonchat-bubble.bottom-right { right: 24px; border-radius: 50% 50% 4px 50%; }
      .melonchat-bubble.bottom-left { left: 24px; border-radius: 50% 50% 50% 4px; }

      .melonchat-bubble:hover {
        transform: scale(1.1) translateY(-4px);
        box-shadow: 0 12px 32px ${primary}60;
      }

      .melonchat-bubble svg {
        width: 40%;
        height: 40%;
        fill: white;
        transition: transform 0.3s ease;
      }
      
      .melonchat-window {
        position: fixed;
        bottom: 104px;
        width: 400px;
        height: 640px;
        max-height: calc(100vh - 140px);
        background: white;
        border-radius: ${borderRadius};
        box-shadow: ${mainShadow};
        display: none;
        flex-direction: column;
        overflow: hidden;
        transform-origin: bottom right;
        transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        z-index: 2147483646;
      }
      
      .melonchat-window.open {
        display: flex;
        animation: melonchat-appear 0.4s ease-out;
      }

      @keyframes melonchat-appear {
        from { opacity: 0; transform: scale(0.9) translateY(20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      
      .melonchat-window.bottom-right { right: 24px; }
      .melonchat-window.bottom-left { left: 24px; transform-origin: bottom left; }
      
      .melonchat-header {
        background: ${headerGrad};
        color: white;
        padding: 24px;
        display: flex;
        align-items: center;
        gap: 16px;
        position: relative;
      }

      .melonchat-header-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255,255,255,0.4);
        overflow: hidden;
        flex-shrink: 0;
      }

      .melonchat-header-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .melonchat-header-info { flex: 1; overflow: hidden; }

      .melonchat-header-title {
        font-weight: 700;
        font-size: 18px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .melonchat-header-subtitle {
        font-size: 13px;
        opacity: 0.9;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .melonchat-online-dot {
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        box-shadow: 0 0 0 2px rgba(16,185,129,0.3);
      }
      
      .melonchat-close {
        background: rgba(255,255,255,0.15);
        border: none;
        color: white;
        cursor: pointer;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      
      .melonchat-close:hover { background: rgba(255,255,255,0.25); transform: rotate(90deg); }
      
      .melonchat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #f8fafc;
        scroll-behavior: smooth;
      }

      .melonchat-messages::-webkit-scrollbar { width: 5px; }
      .melonchat-messages::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

      .melonchat-message {
        max-width: 85%;
        padding: 12px 16px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.5;
        position: relative;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }

      .melonchat-message.visitor {
        align-self: flex-end;
        background: ${primary};
        color: white;
        border-bottom-right-radius: 4px;
      }

      .melonchat-message.agent {
        align-self: flex-start;
        background: white;
        color: #1e293b;
        border-bottom-left-radius: 4px;
        border: 1px solid #e2e8f0;
      }

      .melonchat-message-time {
        font-size: 10px;
        opacity: 0.6;
        margin-top: 4px;
        text-align: right;
      }
      
      .melonchat-typing-container {
        display: none;
        align-self: flex-start;
        padding: 12px 18px;
        background: white;
        border-radius: 18px;
        border: 1px solid #e2e8f0;
        gap: 4px;
      }
      
      .melonchat-typing-dot {
        width: 6px;
        height: 6px;
        background: #94a3b8;
        border-radius: 50%;
        animation: melonchat-bounce 1.4s infinite;
      }
      
      @keyframes melonchat-bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-4px); }
      }
      
      .melonchat-input-area {
        padding: 20px;
        background: white;
        border-top: 1px solid #f1f5f9;
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .melonchat-input {
        flex: 1;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px 16px;
        font-size: 14px;
        outline: none;
        transition: all 0.2s;
      }

      .melonchat-input:focus {
        border-color: ${primary};
        box-shadow: 0 0 0 3px ${primary}15;
      }

      .melonchat-send {
        width: 44px;
        height: 44px;
        border: none;
        border-radius: 12px;
        background: ${primary};
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .melonchat-send:hover { opacity: 0.9; transform: scale(1.05); }
      .melonchat-send svg { width: 22px; height: 22px; }
      
      .melonchat-prechat {
        padding: 32px 24px;
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .melonchat-prechat-header { margin-bottom: 8px; }
      .melonchat-prechat-title { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
      .melonchat-prechat-subtitle { font-size: 15px; color: #64748b; line-height: 1.5; }
      
      .melonchat-form { display: flex; flex-direction: column; gap: 16px; }
      .melonchat-field { display: flex; flex-direction: column; gap: 6px; }
      .melonchat-label { font-size: 13px; font-weight: 600; color: #475569; }
      .melonchat-field input {
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        padding: 12px;
        font-size: 14px;
        transition: all 0.2s;
      }
      .melonchat-field input:focus { border-color: ${primary}; outline: none; }

      .melonchat-start-btn {
        background: ${primary};
        color: white;
        border: none;
        border-radius: 10px;
        padding: 16px;
        font-weight: 700;
        font-size: 15px;
        cursor: pointer;
        transition: all 0.2s;
        margin-top: 8px;
        box-shadow: 0 4px 12px ${primary}30;
      }

      .melonchat-branding {
        padding: 10px;
        text-align: center;
        font-size: 10px;
        color: #94a3b8;
        background: #f8fafc;
        border-top: 1px solid #f1f5f9;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .melonchat-welcome-image {
        width: 100%;
        border-radius: 12px;
        margin-bottom: 16px;
        object-fit: cover;
        max-height: 180px;
      }
      
      @media (max-width: 480px) {
        .melonchat-window {
          width: 100%;
          height: 100%;
          bottom: 0px;
          right: 0px !important;
          left: 0px !important;
          border-radius: 0;
          max-height: 100%;
        }
        .melonchat-bubble { bottom: 16px; right: 16px !important; }
      }
    `;
    document.head.appendChild(style);
  };

  const icons = {
    chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>`,
    chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`
  };

  // Helper to format time
  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/config?companyId=${companyId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      console.error('🍈 MelonChat: Failed to load config', e);
      return null;
    }
  };

  const init = async () => {
    widgetConfig = await fetchConfig();
    if (!widgetConfig) return;

    injectStyles(widgetConfig);
    createWidget();
    
    if (conversationId) {
      loadMessages();
      startPolling();
    }
  };

  const createWidget = () => {
    const pos = widgetConfig.position || 'bottom-right';
    const size = widgetConfig.button_size || 'medium';
    
    const container = document.createElement('div');
    container.id = 'melonchat-widget';
    container.innerHTML = `
      <div class="melonchat-bubble ${pos} ${size}" id="melonchat-bubble">
        ${icons.chat}
      </div>
      <div class="melonchat-window ${pos}" id="melonchat-window">
        <div class="melonchat-header">
          <div class="melonchat-header-avatar">
            ${widgetConfig.logo_url ? `<img src="${widgetConfig.logo_url}">` : `<div style="padding:10px">${icons.chat}</div>`}
          </div>
          <div class="melonchat-header-info">
            <div class="melonchat-header-title">${widgetConfig.company_name || 'Suporte'}</div>
            <div class="melonchat-header-subtitle"><span class="melonchat-online-dot"></span> Online agora</div>
          </div>
          <button class="melonchat-close" id="melonchat-close">${icons.close}</button>
        </div>
        <div id="melonchat-content" style="flex:1; display:flex; flex-direction:column; overflow:hidden;"></div>
        ${widgetConfig.show_branding !== false ? `
          <div class="melonchat-branding">Powered by <b>MelonChat</b></div>
        ` : ''}
      </div>
    `;
    
    document.body.appendChild(container);
    
    document.getElementById('melonchat-bubble').addEventListener('click', toggleWidget);
    document.getElementById('melonchat-close').addEventListener('click', () => toggleWidget(false));
  };

  const toggleWidget = (forceState) => {
    isOpen = forceState !== undefined ? forceState : !isOpen;
    const win = document.getElementById('melonchat-window');
    const bub = document.getElementById('melonchat-bubble');
    
    if (isOpen) {
      win.classList.add('open');
      bub.innerHTML = icons.chevronDown;
      
      if (!conversationId) {
        renderPrechat();
      } else {
        renderChat();
      }
    } else {
      win.classList.remove('open');
      bub.innerHTML = icons.chat;
    }
  };

  const renderPrechat = () => {
    const content = document.getElementById('melonchat-content');
    const fields = widgetConfig.custom_fields || [];
    
    content.innerHTML = `
      <div class="melonchat-prechat">
        <div class="melonchat-prechat-header">
          ${widgetConfig.welcome_image_url ? `<img src="${widgetConfig.welcome_image_url}" class="melonchat-welcome-image">` : ''}
          <h2 class="melonchat-prechat-title">${widgetConfig.greeting_title || 'Olá! 👋'}</h2>
          <p class="melonchat-prechat-subtitle">${widgetConfig.greeting_message || 'Como podemos ajudar você hoje?'}</p>
        </div>
        
        <form class="melonchat-form" id="melonchat-form">
          ${widgetConfig.require_name !== false ? `
            <div class="melonchat-field">
              <label class="melonchat-label">Nome</label>
              <input type="text" name="name" placeholder="Seu nome completo" required>
            </div>
          ` : ''}
          ${widgetConfig.require_email !== false ? `
            <div class="melonchat-field">
              <label class="melonchat-label">E-mail</label>
              <input type="email" name="email" placeholder="seu@email.com" required>
            </div>
          ` : ''}
          ${widgetConfig.require_phone === true ? `
            <div class="melonchat-field">
              <label class="melonchat-label">WhatsApp</label>
              <input type="tel" name="phone" placeholder="(00) 00000-0000">
            </div>
          ` : ''}
          
          ${fields.map(f => `
            <div class="melonchat-field">
              <label class="melonchat-label">${f.label}</label>
              <input type="text" name="cf_${f.name}" placeholder="" ${f.required ? 'required' : ''}>
            </div>
          `).join('')}
          
          <button type="submit" class="melonchat-start-btn" id="melonchat-start-btn">Iniciar Atendimento</button>
        </form>
      </div>
    `;
    
    document.getElementById('melonchat-form').addEventListener('submit', handleStart);
  };

  const handleStart = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('melonchat-start-btn');
    btn.disabled = true;
    btn.textContent = 'Carregando...';
    
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      custom_fields: {},
      metadata: {
        page_url: window.location.href,
        page_title: document.title
      }
    };
    
    // Extract custom fields
    for (let [key, value] of formData.entries()) {
      if (key.startsWith('cf_')) {
        data.custom_fields[key.replace('cf_', '')] = value;
      }
    }
    
    try {
      const response = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-widget-company-id': companyId, 'x-widget-session-id': sessionId },
        body: JSON.stringify(data)
      });
      
      const res = await response.json();
      conversationId = res.conversation_id;
      visitorId = res.visitor_id;
      localStorage.setItem(CONV_KEY, conversationId);
      
      renderChat();
      startPolling();
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = 'Tentar novamente';
    }
  };

  const renderChat = () => {
    const content = document.getElementById('melonchat-content');
    content.innerHTML = `
      <div class="melonchat-messages" id="melonchat-messages">
        <div class="melonchat-typing-container" id="melonchat-typing">
          <div class="melonchat-typing-dot" style="animation-delay:0s"></div>
          <div class="melonchat-typing-dot" style="animation-delay:0.2s"></div>
          <div class="melonchat-typing-dot" style="animation-delay:0.4s"></div>
        </div>
      </div>
      <div class="melonchat-input-area">
        <input type="text" class="melonchat-input" id="melonchat-input" placeholder="${widgetConfig.input_placeholder || 'Escreva aqui...'}" autocomplete="off">
        <button class="melonchat-send" id="melonchat-send">${icons.send}</button>
      </div>
    `;
    
    const input = document.getElementById('melonchat-input');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });
    document.getElementById('melonchat-send').addEventListener('click', handleSend);
    
    loadMessages();
  };

  const handleSend = async () => {
    const input = document.getElementById('melonchat-input');
    const text = input.value.trim();
    if (!text) return;
    
    input.value = '';
    addMessage({ content: text, sender_type: 'visitor', created_at: new Date().toISOString() });
    
    try {
      await fetch(`${API_BASE}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-widget-company-id': companyId, 'x-widget-session-id': sessionId },
        body: JSON.stringify({ conversation_id: conversationId, content: text })
      });
    } catch (e) { console.error(e); }
  };

  const addMessage = (msg) => {
    const box = document.getElementById('melonchat-messages');
    if (!box) return;
    
    const div = document.createElement('div');
    div.className = `melonchat-message ${msg.sender_type}`;
    div.innerHTML = `
      <div class="melonchat-text">${msg.content}</div>
      <div class="melonchat-message-time">${formatTime(msg.created_at)}</div>
    `;
    
    box.insertBefore(div, document.getElementById('melonchat-typing'));
    box.scrollTop = box.scrollHeight;
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`${API_BASE}/messages?conversation_id=${conversationId}`, {
        headers: { 'x-widget-company-id': companyId, 'x-widget-session-id': sessionId }
      });
      const res = await response.json();
      const box = document.getElementById('melonchat-messages');
      if (box) {
         // Clear existing except typing
         const typing = document.getElementById('melonchat-typing');
         box.innerHTML = '';
         box.appendChild(typing);
         res.messages.forEach(addMessage);
      }
    } catch (e) { console.error(e); }
  };

  const startPolling = () => {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(async () => {
      if (!isOpen) return;
      try {
        const response = await fetch(`${API_BASE}/messages?conversation_id=${conversationId}`, {
          headers: { 'x-widget-company-id': companyId, 'x-widget-session-id': sessionId }
        });
        const res = await response.json();
        // Simple logic to refresh if count changed - upgrade to 'after' timestamp for production
        loadMessages();
      } catch (e) {}
    }, 4000);
  };

  const stopPolling = () => {
    if (pollingInterval) clearInterval(pollingInterval);
  };

  // Start the widget
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }

})(window, document);
