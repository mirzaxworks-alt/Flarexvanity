/**
 * Flarex™ Newgen Moderation Bot - Dashboard Interactive Engine
 * Real-time Discord Bot Synchronization, Discord OAuth2 Authentication,
 * Live Process Uptime Tracking, Granular Dirty State Management & Real Server Metrics.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Discord Custom Emojis Map from reo/style/emoji.py
  const EMOJI = {
    antinuke: 'https://cdn.discordapp.com/emojis/1525317317213290496.webp',
    automod: 'https://cdn.discordapp.com/emojis/1525316796289388765.webp',
    welcomer: 'https://cdn.discordapp.com/emojis/1525317627898105946.webp',
    leveling: 'https://cdn.discordapp.com/emojis/1552116357884149842.gif',
    music: 'https://cdn.discordapp.com/emojis/1525317695782785076.webp',
    economy: 'https://cdn.discordapp.com/emojis/1525317618095882442.webp',
    tickets: 'https://cdn.discordapp.com/emojis/1525317581282476102.webp',
    giveaways: 'https://cdn.discordapp.com/emojis/1525317427519553577.webp',
    logs: 'https://cdn.discordapp.com/emojis/1525317246543597648.webp',
    staff: 'https://cdn.discordapp.com/emojis/1525317596105150474.webp',
    settings: 'https://cdn.discordapp.com/emojis/1525317551872016525.webp',
    home: 'https://cdn.discordapp.com/emojis/1525317606398103595.webp',
    crown: 'assets/crown.png',
    channel: 'https://cdn.discordapp.com/emojis/1525317323777507410.webp',
    roles: 'https://cdn.discordapp.com/emojis/1525317276105048155.webp',
    user: 'https://cdn.discordapp.com/emojis/1525317296598548623.webp',
    success: 'https://cdn.discordapp.com/emojis/1525317487560884265.webp',
    error: 'https://cdn.discordapp.com/emojis/1525317475917631629.webp',
    warning: 'https://cdn.discordapp.com/emojis/1525317421534023791.webp',
    ban: 'https://cdn.discordapp.com/emojis/1525317495278276758.webp',
    kick: 'https://cdn.discordapp.com/emojis/1525317491809583156.webp',
    loading: 'https://cdn.discordapp.com/emojis/1525317314147254385.gif',
    enabled: 'https://cdn.discordapp.com/emojis/1537085815002374255.webp',
    disabled: 'https://cdn.discordapp.com/emojis/1525316799615209595.webp',
    webhook: 'https://cdn.discordapp.com/emojis/1525317636802609173.webp',
    invite: 'https://cdn.discordapp.com/emojis/1525317684642840686.webp'
  };

  // State Management
  let currentUser = null;
  let allGuilds = [];
  let currentGuildId = null;
  let activeGuildData = null;
  let botConfiguredClientId = '1525310645031931904';

  // Live Metrics & Sync State
  let botStatusData = null;
  let lastSyncTime = null;
  let isSyncing = false;
  let syncFailureCount = 0;
  let syncTimeoutId = null;

  // Deep State Management for Atomic Dirty Detection
  let savedState = null;
  let currentState = null;
  let isSaving = false;

  // DOM Elements
  const navButtons = document.querySelectorAll('.nav-item-btn[data-tab]');
  const tabPanels = document.querySelectorAll('.tab-content-panel');
  const saveBar = document.getElementById('floatingSaveBar');
  const saveBtn = document.getElementById('saveChangesBtn');
  const discardBtn = document.getElementById('discardChangesBtn');
  const toastContainer = document.getElementById('toastContainer');
  
  // Mobile Sidebar Elements
  const mobileMenuToggleBtn = document.getElementById('mobileMenuToggleBtn');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const sidebarLeft = document.querySelector('.sidebar-left');

  // Sync Status Elements
  const syncStatusWidget = document.getElementById('syncStatusWidget');
  const syncStatusLabel = document.getElementById('syncStatusLabel');
  const syncLastTimeText = document.getElementById('syncLastTimeText');
  const syncRetryBtn = document.getElementById('syncRetryBtn');

  // Modals
  const searchModal = document.getElementById('searchModal');
  const serverPickerModal = document.getElementById('serverPickerModal');
  const authLoginModal = document.getElementById('authLoginModal');
  const hostSettingsModal = document.getElementById('hostSettingsModal');
  const ticketPanelModal = document.getElementById('ticketPanelModal');
  const levelRewardModal = document.getElementById('levelRewardModal');
  const giveawayModal = document.getElementById('giveawayModal');
  const warnTierModal = document.getElementById('warnTierModal');
  const reactionRoleModal = document.getElementById('reactionRoleModal');
  const trialConfirmModal = document.getElementById('trialConfirmModal');
  const posterLightboxModal = document.getElementById('posterLightboxModal');
  const whitelistModal = document.getElementById('whitelistModal');
  const assignRoleModal = document.getElementById('assignRoleModal');
  const addBannedWordModal = document.getElementById('addBannedWordModal');
  
  // Triggers
  const openSearchBtns = document.querySelectorAll('.trigger-search-modal');
  const openServerPickerBtns = document.querySelectorAll('.trigger-server-picker');
  const userProfilePill = document.getElementById('userProfilePill');

  // =========================================================
  // UTILITY & STATE HELPERS
  // =========================================================

  /**
   * Safe HTML Entity Escaping Helper
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Clear any legacy client-side tokens from storage for security
  try {
    sessionStorage.removeItem('flarex_discord_token');
    localStorage.removeItem('flarex_remote_bot_secret');
    localStorage.removeItem('flarex_discord_token');
    localStorage.removeItem('flarex_discord_token_type');
  } catch (e) {}

  function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
  }

  function getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let curr = obj;
    for (const part of parts) {
      if (curr === null || curr === undefined) return undefined;
      curr = curr[part];
    }
    return curr;
  }

  function setNestedValue(obj, path, value) {
    if (!obj || !path) return;
    const parts = path.split('.');
    let curr = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!curr[part] || typeof curr[part] !== 'object') {
        curr[part] = {};
      }
      curr = curr[part];
    }
    curr[parts[parts.length - 1]] = value;
  }

  function normalizeValue(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return v.trim();
    if (Array.isArray(v)) return v.map(normalizeValue);
    if (typeof v === 'object') {
      const out = {};
      for (const k of Object.keys(v).sort()) {
        out[k] = normalizeValue(v[k]);
      }
      return out;
    }
    return v;
  }

  function deepEqual(a, b) {
    const na = normalizeValue(a);
    const nb = normalizeValue(b);
    return JSON.stringify(na) === JSON.stringify(nb);
  }

  function isDirty() {
    if (!savedState || !currentState) return false;
    return !deepEqual(savedState, currentState);
  }

  function updateDirtyUI() {
    const dirty = isDirty();
    if (saveBar) {
      if (dirty) {
        saveBar.classList.add('visible');
      } else {
        saveBar.classList.remove('visible');
      }
    }
    if (saveBtn) {
      saveBtn.disabled = !dirty || isSaving;
    }
  }

  window.addEventListener('beforeunload', (e) => {
    if (isDirty()) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  function showToast(message, emojiKey = 'crown') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    const iconSrc = EMOJI[emojiKey] || EMOJI.crown;
    toast.innerHTML = `<img src="${iconSrc}" class="discord-emoji" alt="icon"> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3500);
  }

  function toggleMobileSidebar() {
    if (sidebarLeft) sidebarLeft.classList.toggle('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.toggle('active');
  }

  function closeMobileSidebar() {
    if (sidebarLeft) sidebarLeft.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
  }

  if (mobileMenuToggleBtn) {
    mobileMenuToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileSidebar();
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeMobileSidebar);
  }

  function switchTab(tabId) {
    navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });

    closeMobileSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      if (tabId) switchTab(tabId);
    });
  });

  function getApiBaseUrl() {
    let custom = localStorage.getItem('flarex_remote_bot_url') || '';
    if (!custom || custom.trim() === '' || custom.trim() === '/api') {
      return '/api';
    }
    return custom.trim().replace(/\/$/, '');
  }

  function getApiHeaders() {
    return { 'Content-Type': 'application/json' };
  }

  async function apiFetch(url, options = {}) {
    const defaultHeaders = getApiHeaders();
    const config = {
      credentials: 'include',
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };
    return fetch(url, config);
  }

  function formatRelativeTime(timestamp) {
    if (!timestamp) return 'Just now';
    const nowSec = Math.floor(Date.now() / 1000);
    const diff = Math.max(0, nowSec - timestamp);

    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  // Full Default Schema Configuration (Active Server Defaults without hardcoded values)
  function getDefaultConfig() {
    return {
      antinuke: {
        enabled: true,
        punishment: "ban",
        panic_active: false,
        channel_del_limit: 2,
        role_del_limit: 2,
        mass_ban_limit: 3,
        mass_kick_limit: 3,
        bot_add_protect: true,
        vanity_protect: true,
        whitelist: []
      },
      raid: {
        enabled: true,
        join_threshold: 5,
        join_interval_seconds: 10,
        min_account_age_hours: 24,
        new_account_action: "kick",
        auto_lockdown: true,
        raise_verification_level: true,
        pattern_detection_enabled: true,
        pattern_cluster_threshold: 3,
        pattern_cluster_window_seconds: 30,
        heuristic_detection_enabled: true,
        heuristic_score_threshold: 75,
        alert_role_id: "",
        log_channel_id: ""
      },
      automod: {
        enabled: true,
        anti_spam: { enabled: true, max_messages: 5, window: 3, action: "timeout_5m" },
        anti_invite: { enabled: true, action: "delete_warn", whitelist: "" },
        anti_mention: { enabled: true, max: 5 },
        anti_caps: { enabled: true, percent: 70 },
        banned_words: ["scam", "nitro-free", "steam-gift", "grabify", "free-robux", "iplogger"]
      },
      warn_config: {
        decay_days: 30,
        default_reason: "Violation of server rules",
        tiers: [
          { warns: 1, action: "timeout_5m", duration: "5m" },
          { warns: 2, action: "timeout_1h", duration: "1h" },
          { warns: 3, action: "kick", duration: "" }
        ]
      },
      jail: {
        jail_role_id: "",
        jail_channel_id: "",
        log_channel_id: "",
        clear_roles: true,
        default_duration: "1h"
      },
      verification: {
        enabled: true,
        channel_id: "",
        verified_role_id: "",
        unverified_role_id: "",
        log_channel_id: "",
        require_captcha: false,
        kick_on_fail: true,
        min_account_age_days: 0,
        max_attempts: 3,
        autokick_hours: 24
      },
      reaction_roles: {
        enabled: true,
        entries: []
      },
      starboard: {
        enabled: true,
        channel_id: "",
        threshold: 3,
        emoji: "⭐",
        self_star: false
      },
      welcomer: {
        enabled: true,
        channel: "",
        title: "Welcome to {server.name}!",
        description: "Welcome {user.mention} to {server.name}! We're thrilled to have you here. Check out the server rules and enjoy your stay! 🎉",
        color: "#df9b6d",
        footer: "Member #{member.count}",
        autoroles: [],
        dm_enabled: false,
        dm_message: "Welcome to {server.name}! We hope you enjoy your time with us."
      },
      leveling: {
        enabled: true,
        xp_min: 15,
        xp_max: 25,
        cooldown: 60,
        multiplier: 1.0,
        target: "current",
        channel: "",
        message: "🎉 {user.mention} just reached **Level {level}**!",
        stack_roles: true,
        rewards: [
          { level: 5, role_id: "", role_name: "Active Member" },
          { level: 10, role_id: "", role_name: "Elite Member" },
          { level: 20, role_id: "", role_name: "VIP Veteran" }
        ]
      },
      music: {
        default_volume: 100,
        stay_247: true,
        voice_channel: "",
        idle_timeout: 120,
        equalizer: "bass_boost",
        dj_role: ""
      },
      economy: {
        currency_symbol: "🪙",
        currency_name: "Gold Coins",
        starting_balance: 1000,
        daily_amount: 500,
        work_range: "150 - 450",
        rob_success_rate: 35,
        shield_duration: "24 Hours"
      },
      tickets: {
        enabled: true,
        transcript_channel: "",
        rating_survey: true,
        ticket_limit: 1,
        panels: [
          {
            id: 1,
            name: "General Support",
            description: "Click below to create a support ticket with server staff.",
            emoji: "🎫",
            category_id: "",
            role: "Support Team",
            support_roles: [],
            channel_id: "",
            enabled: true
          }
        ]
      },
      giveaways: {
        enabled: true
      },
      logs: {
        security_channel: "",
        mod_channel: "",
        message_channel: "",
        member_channel: "",
        voice_channel: "",
        server_channel: ""
      },
      settings: {
        prefix: "",
        nickname: "Flarex",
        embed_color: "#df9b6d",
        timezone: ""
      },
      command_access: {
        disabled_commands: [],
        admin_bypass: true,
        cooldown_multiplier: 1.0,
        rate_limits: {
          enabled: true,
          user_max: 6,
          user_window: 10,
          command_max: 3,
          command_window: 10,
          guild_max: 40,
          guild_window: 10,
          strike_window: 600,
          block_after_strikes: 3
        }
      },
      cases: {
        modlog_channel_id: "",
        command_channel_id: "",
        require_reason: true,
        dm_user_on_action: true,
        recent_cases: []
      }
    };
  }

  // =========================================================
  // SYNC STATUS WIDGET ENGINE
  // =========================================================

  function setSyncStatus(status) {
    if (!syncStatusLabel || !syncStatusWidget) return;

    if (status === 'synced') {
      syncStatusWidget.style.borderColor = 'rgba(74, 222, 128, 0.25)';
      syncStatusWidget.style.background = 'rgba(74, 222, 128, 0.08)';
      syncStatusLabel.textContent = 'Synced';
      syncStatusLabel.style.color = 'var(--status-online)';
      if (syncRetryBtn) syncRetryBtn.style.display = 'none';
      if (syncLastTimeText) {
        syncLastTimeText.style.display = 'inline';
        syncLastTimeText.textContent = '• Just now';
      }
      lastSyncTime = Math.floor(Date.now() / 1000);
    } else if (status === 'syncing') {
      syncStatusWidget.style.borderColor = 'rgba(251, 191, 36, 0.25)';
      syncStatusWidget.style.background = 'rgba(251, 191, 36, 0.08)';
      syncStatusLabel.textContent = 'Syncing...';
      syncStatusLabel.style.color = 'var(--status-warning)';
    } else if (status === 'failed') {
      syncStatusWidget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
      syncStatusWidget.style.background = 'rgba(239, 68, 68, 0.12)';
      syncStatusLabel.textContent = 'Sync failed';
      syncStatusLabel.style.color = '#f87171';
      if (syncRetryBtn) syncRetryBtn.style.display = 'inline-block';
      if (syncLastTimeText) syncLastTimeText.style.display = 'none';
    }
  }

  // Update sync relative timestamp every second
  setInterval(() => {
    if (lastSyncTime && syncLastTimeText && syncLastTimeText.style.display !== 'none') {
      const nowSec = Math.floor(Date.now() / 1000);
      const diff = Math.max(0, nowSec - lastSyncTime);
      if (diff < 5) {
        syncLastTimeText.textContent = '• Just now';
      } else {
        syncLastTimeText.textContent = `• ${diff}s ago`;
      }
    }
  }, 1000);

  if (syncStatusWidget) {
    syncStatusWidget.addEventListener('click', () => {
      performSync(false);
    });
  }

  if (syncRetryBtn) {
    syncRetryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      performSync(false);
    });
  }

  // =========================================================
  // BOT STATUS & LIVE PROCESS UPTIME
  // =========================================================

  function setBotOfflineState() {
    botStatusData = null;
    const s1 = document.getElementById('metricTotalServers');
    const sidebarServers = document.getElementById('sidebarServersVal');
    const s4 = document.getElementById('metricUptime');
    const sidebarUptime = document.getElementById('sidebarUptimeVal');
    const statusText = document.getElementById('metricBotStatusText');

    if (s1) s1.textContent = 'Offline';
    if (sidebarServers) sidebarServers.textContent = 'Offline';
    if (s4) s4.textContent = 'Offline';
    if (sidebarUptime) sidebarUptime.textContent = 'Offline';
    if (statusText) {
      statusText.textContent = 'Bot Offline';
      statusText.style.color = '#f87171';
    }
  }

  function updateLiveUptime() {
    const s4 = document.getElementById('metricUptime');
    const sidebarUptime = document.getElementById('sidebarUptimeVal');
    const statusText = document.getElementById('metricBotStatusText');

    if (!botStatusData || botStatusData.status !== 'online' || !botStatusData.boot_timestamp) {
      if (s4) s4.textContent = 'Offline';
      if (sidebarUptime) sidebarUptime.textContent = 'Offline';
      if (statusText) {
        statusText.textContent = 'Bot Offline';
        statusText.style.color = '#f87171';
      }
      return;
    }

    if (statusText) {
      statusText.textContent = 'Online';
      statusText.style.color = 'var(--status-online)';
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const diffSec = Math.max(0, nowSec - botStatusData.boot_timestamp);

    const days = Math.floor(diffSec / 86400);
    const hours = Math.floor((diffSec % 86400) / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    const secs = diffSec % 60;

    let formatted = '';
    if (days > 0) formatted = `${days}d ${hours}h ${mins}m`;
    else if (hours > 0) formatted = `${hours}h ${mins}m ${secs}s`;
    else formatted = `${mins}m ${secs}s`;

    if (s4) s4.textContent = formatted;
    if (sidebarUptime) sidebarUptime.textContent = formatted;
  }

  setInterval(updateLiveUptime, 1000);

  async function fetchBotStatus() {
    const baseUrl = getApiBaseUrl();

    try {
      const res = await apiFetch(`${baseUrl}/bot/status`);
      if (res.ok) {
        botStatusData = await res.json();
        
        const s1 = document.getElementById('metricTotalServers');
        const sidebarServers = document.getElementById('sidebarServersVal');
        
        if (s1 && botStatusData.total_servers !== undefined) {
          s1.textContent = botStatusData.total_servers;
        }
        if (sidebarServers && botStatusData.total_servers !== undefined) {
          sidebarServers.textContent = botStatusData.total_servers;
        }
        if (botStatusData.bot_id) {
          botConfiguredClientId = botStatusData.bot_id;
        }

        updateLiveUptime();
        return true;
      } else {
        setBotOfflineState();
        if (res.status === 502) {
          showToast('Bot API unreachable (502). Bot is offline.', 'error');
        } else {
          showToast(`Bot status request returned HTTP ${res.status}`, 'error');
        }
      }
    } catch (e) {
      setBotOfflineState();
      showToast('Bot offline / gateway unreachable: ' + (e.message || e), 'error');
    }
    return false;
  }

  // =========================================================
  // GUILD STATS & RECENT ACTIVITY FEED
  // =========================================================

  async function fetchGuildStats(guildId) {
    if (!guildId) return false;
    const baseUrl = getApiBaseUrl();

    try {
      const res = await apiFetch(`${baseUrl}/guild/${guildId}/stats`);
      if (res.ok) {
        const data = await res.json();
        const sMembers = document.getElementById('metricServerMembers');
        const sMessages = document.getElementById('metricServerMessages');

        if (sMembers) {
          const apiCount = (data.stats && data.stats.exact_member_count !== undefined && data.stats.exact_member_count !== null) ? Number(data.stats.exact_member_count) : 0;
          const fallbackCount = activeGuildData ? Number(activeGuildData.member_count || 0) : 0;
          const mCount = apiCount > 0 ? apiCount : fallbackCount;
          sMembers.textContent = mCount.toLocaleString();
          if (activeGuildData && apiCount > 0) activeGuildData.member_count = apiCount;
        }

        if (sMessages && data.stats) {
          if (data.stats.total_messages !== null && data.stats.total_messages !== undefined) {
            sMessages.textContent = Number(data.stats.total_messages).toLocaleString();
          } else {
            sMessages.textContent = 'N/A';
          }
        }
        return true;
      } else {
        showToast(`Failed to fetch stats for server (HTTP ${res.status}).`, 'error');
      }
    } catch (e) {
      showToast(`Could not fetch stats for guild ${guildId}: ` + (e.message || e), 'error');
    }
    return false;
  }

  async function fetchGuildActivity(guildId) {
    const listContainer = document.getElementById('activityFeedList');
    if (!listContainer || !guildId) return;

    const baseUrl = getApiBaseUrl();

    try {
      const res = await apiFetch(`${baseUrl}/guild/${guildId}/activity`);
      if (res.ok) {
        const data = await res.json();
        const activities = data.activities || [];

        if (activities.length === 0) {
          listContainer.innerHTML = `
            <div style="padding: 32px 16px; text-align: center; color: var(--text-muted);">
              <div style="font-size: 24px; margin-bottom: 6px; opacity: 0.7;">📜</div>
              <div style="font-size: 13.5px; font-weight: 500; color: var(--text-secondary); margin-bottom: 4px;">No recent activity recorded for this server</div>
              <div style="font-size: 11.5px; color: var(--text-muted); max-width: 320px; margin: 0 auto;">Events such as member joins, bans, moderation actions, and dashboard updates will appear here in real-time.</div>
            </div>
          `;
          return;
        }

        listContainer.innerHTML = activities.map(act => {
          let icon = '⚡';
          if (act.type === 'join') icon = `<img src="${EMOJI.welcomer}" class="discord-emoji" alt="Join">`;
          else if (act.type === 'leave') icon = `<img src="${EMOJI.kick}" class="discord-emoji" alt="Leave">`;
          else if (act.type === 'ban') icon = `<img src="${EMOJI.ban}" class="discord-emoji" alt="Ban">`;
          else if (act.type === 'unban') icon = `<img src="${EMOJI.success}" class="discord-emoji" alt="Unban">`;
          else if (act.type === 'channel') icon = `<img src="${EMOJI.channel}" class="discord-emoji" alt="Channel">`;
          else if (act.type === 'role') icon = `<img src="${EMOJI.roles}" class="discord-emoji" alt="Role">`;
          else if (act.type === 'config') icon = `<img src="${EMOJI.settings}" class="discord-emoji" alt="Config">`;

          const targetText = act.target ? `<span class="activity-event-target">${escapeHtml(act.target)}</span>` : '';
          const userSub = act.user ? `<span style="color: var(--text-muted); font-size: 11px; margin-left: 6px;">(${escapeHtml(act.user)})</span>` : '';
          const relTime = act.relative_time || formatRelativeTime(act.timestamp);

          return `
            <div class="activity-row">
              <div class="activity-left-info">
                <span class="activity-bullet"></span>
                <span class="activity-action-icon">${icon}</span>
                <span class="activity-event-name">${escapeHtml(act.event || '')}</span>
                ${targetText}
                ${userSub}
              </div>
              <div class="activity-timestamp">${escapeHtml(relTime)}</div>
            </div>
          `;
        }).join('');
        return;
      } else {
        showToast(`Failed to fetch activities (HTTP ${res.status}).`, 'error');
      }
    } catch (e) {
      showToast(`Could not fetch activities for guild ${guildId}: ` + (e.message || e), 'error');
    }

    listContainer.innerHTML = `
      <div style="padding: 24px 16px; text-align: center; color: var(--text-muted);">
        <div style="font-size: 13px;">No recent activity recorded for this server</div>
      </div>
    `;
  }

  // =========================================================
  // REAL-TIME BACKGROUND AUTO-SYNC ENGINE WITH BACKOFF & VISIBILITY PAUSE
  // =========================================================

  function scheduleNextSync(delayMs) {
    if (syncTimeoutId) {
      clearTimeout(syncTimeoutId);
      syncTimeoutId = null;
    }
    const delay = (delayMs !== undefined) ? delayMs : (
      syncFailureCount > 0
        ? Math.min(60000, 8000 * Math.pow(2, Math.min(syncFailureCount, 4)))
        : 8000
    );
    syncTimeoutId = setTimeout(() => {
      performSync(true);
    }, delay);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // Resume sync immediately when tab becomes visible
      performSync(true);
    }
  });

  async function performSync(isSilent = true) {
    // 1. Skip sync when tab is hidden
    if (document.hidden) {
      scheduleNextSync(8000);
      return;
    }

    // 2. Skip sync while form has unsaved edits
    if (isDirty()) {
      scheduleNextSync(8000);
      return;
    }

    if (isSyncing) return;
    isSyncing = true;
    if (!isSilent) setSyncStatus('syncing');

    try {
      const botOk = await fetchBotStatus();

      if (currentGuildId) {
        await fetchGuildStats(currentGuildId);
        await fetchGuildActivity(currentGuildId);
        await fetchGuildLeaderboard(currentGuildId);
        await fetchPremiumStatus(currentGuildId);

        // If user is not currently editing, silently refresh config from backend
        if (!isDirty()) {
          const baseUrl = getApiBaseUrl();
          try {
            const cfgRes = await apiFetch(`${baseUrl}/guild/${currentGuildId}/config`);
            if (cfgRes.ok) {
              const cfgData = await cfgRes.json();
              if (cfgData.config && !isDirty()) {
                savedState = deepClone(cfgData.config);
                currentState = deepClone(cfgData.config);
                populateForm(currentState);
              }
            } else if (cfgRes.status === 401) {
              showToast('Session expired or unauthorized. Please re-authenticate with Discord.', 'error');
            } else {
              showToast(`Auto-sync: Server returned HTTP ${cfgRes.status}.`, 'error');
            }
          } catch (e) {
            showToast('Auto-sync failed to refresh server config: ' + (e.message || e), 'error');
          }
        }
      }

      setSyncStatus('synced');
      syncFailureCount = 0;
      if (!isSilent) showToast('Dashboard synchronized with Discord runtime!', 'crown');
    } catch (err) {
      console.error('Auto-sync failure:', err);
      syncFailureCount++;
      setSyncStatus('failed');
      if (!isSilent) showToast('Auto-sync error: ' + (err.message || err), 'error');
    } finally {
      isSyncing = false;
      scheduleNextSync();
    }
  }

  // Initial Sync Schedule
  scheduleNextSync(8000);

  // =========================================================
  // SERVER PICKER & ACTIVE GUILD LOGIC
  // =========================================================

  function renderServerPicker(filter = 'all') {
    const grid = document.getElementById('serverPickerGrid');
    if (!grid) return;

    if (!currentUser) {
      grid.innerHTML = `
        <div style="padding: 36px 20px; text-align: center; color: var(--text-secondary);">
          <div style="font-size: 32px; margin-bottom: 10px;">🔒</div>
          <div style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 6px;">Discord Authentication Required</div>
          <div style="font-size: 13px; color: var(--text-muted); max-width: 380px; margin: 0 auto 18px; line-height: 1.5;">
            Please sign in with your Discord account to locate and manage Discord servers where you have Administrator or Server Owner permissions.
          </div>
          <button id="serverPickerLoginPromptBtn" class="btn btn-blurple" style="padding: 10px 22px; margin: 0 auto;">
            <img src="${EMOJI.crown}" class="discord-emoji small"> Sign in with Discord
          </button>
        </div>
      `;
      const promptBtn = document.getElementById('serverPickerLoginPromptBtn');
      if (promptBtn) promptBtn.addEventListener('click', () => {
        closeModals();
        if (authLoginModal) authLoginModal.classList.add('open');
      });
      return;
    }

    let list = allGuilds;
    let emptyTitle = "No Permitted Servers Found";
    let emptyDesc = "We could not find any servers where you hold Administrator or Server Owner permissions.";

    if (filter === 'managed') {
      list = allGuilds.filter(g => g.bot_present);
      emptyTitle = "No Servers with Flarex Connected";
      emptyDesc = "You haven't added Flarex to any of your servers yet. Click 'Available to Add' to invite Flarex with 1 click!";
    } else if (filter === 'invite') {
      list = allGuilds.filter(g => !g.bot_present);
      emptyTitle = "All Servers Connected";
      emptyDesc = "Flarex is already added and connected to all of your permitted Discord servers!";
    }

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="padding: 36px 20px; text-align: center; color: var(--text-secondary);">
          <div style="font-size: 32px; margin-bottom: 10px;">🛡️</div>
          <div style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 6px;">${escapeHtml(emptyTitle)}</div>
          <div style="font-size: 13px; color: var(--text-muted); max-width: 380px; margin: 0 auto; line-height: 1.5;">
            ${escapeHtml(emptyDesc)}
          </div>
        </div>
      `;
      return;
    }

    const clientId = getDiscordClientId();

    grid.innerHTML = list.map(g => {
      const isSelected = g.id === currentGuildId;
      const initials = escapeHtml(g.name ? g.name.substring(0, 2).toUpperCase() : '??');
      const avatarHTML = g.icon 
        ? `<img src="${escapeHtml(g.icon)}" alt="${escapeHtml(g.name)}" onerror="this.parentElement.innerHTML='<span>${initials}</span>'" style="width: 100%; height: 100%; object-fit: cover;">`
        : `<span>${initials}</span>`;

      const roleBadge = g.owner 
        ? `<span class="nav-badge-pill" style="color: var(--accent-copper-light); background: rgba(223, 155, 109, 0.16);"><img src="${EMOJI.crown}" class="discord-emoji small"> Owner</span>`
        : `<span class="nav-badge-pill" style="color: #93c5fd; background: rgba(96,165,250,0.16);"><img src="${EMOJI.staff}" class="discord-emoji small"> Admin</span>`;

      const botBadge = g.bot_present
        ? `<span class="nav-badge-pill" style="color: #4ade80; background: rgba(74,222,128,0.16);"><img src="${EMOJI.success}" class="discord-emoji small"> Bot Connected</span>`
        : `<span class="nav-badge-pill" style="color: #f59e0b; background: rgba(245,158,11,0.14);"><img src="${EMOJI.invite}" class="discord-emoji small"> Not Added</span>`;

      const inviteUrl = g.invite_url || `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&permissions=8&guild_id=${encodeURIComponent(g.id)}&scope=bot%20applications.commands`;

      // Show Manage Server ONLY if Flarex is added; show + Add Flarex ONLY if Flarex is NOT added
      const actionButton = g.bot_present
        ? `<button class="btn btn-primary btn-sm select-guild-btn" data-id="${escapeHtml(g.id)}" style="min-width: 125px;">
             <img src="${isSelected ? EMOJI.success : EMOJI.settings}" class="discord-emoji small"> ${isSelected ? 'Active Server' : 'Manage Server'}
           </button>`
        : `<a href="${inviteUrl}" target="_blank" class="btn btn-blurple btn-sm add-bot-btn" data-invite-id="${escapeHtml(g.id)}" onclick="event.stopPropagation()" style="min-width: 120px;">
             <img src="${EMOJI.invite}" class="discord-emoji small"> + Add Flarex
           </a>`;

      return `
        <div class="server-picker-card ${isSelected ? 'active-server' : ''} ${!g.bot_present ? 'unadded-server' : ''}" data-guild-card="${escapeHtml(g.id)}" style="cursor: pointer;">
          <div class="server-card-top">
            <div class="server-icon-squircle">${avatarHTML}</div>
            <div class="server-info-col">
              <div class="server-title-text">${escapeHtml(g.name)}</div>
              <div class="server-members-sub">
                <img src="${EMOJI.user}" class="discord-emoji small"> ${(g.member_count || 0).toLocaleString()} members • ${roleBadge} • ${botBadge}
              </div>
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
            ${actionButton}
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('[data-guild-card]').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) return;
        const id = card.getAttribute('data-guild-card');
        const guildData = allGuilds.find(g => g.id === id);
        if (guildData && !guildData.bot_present) {
          const inviteUrl = guildData.invite_url || `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&permissions=8&guild_id=${encodeURIComponent(id)}&scope=bot%20applications.commands`;
          window.open(inviteUrl, '_blank');
          showToast(`Opening invite page for ${guildData.name}...`, 'invite');
          return;
        }
        selectGuild(id);
        closeModals();
      });
    });

    grid.querySelectorAll('.select-guild-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        selectGuild(id);
        closeModals();
      });
    });
  }

  function updateDynamicPickers(guild) {
    if (!guild) return;

    const channels = guild.channels || [];
    const roles = guild.roles || [];

    // Text channel pickers
    document.querySelectorAll('select[data-channel-picker="text"]').forEach(select => {
      const currentVal = select.value;
      const textChannels = channels.filter(c => c.type === 'text' || c.type === 'announcement' || c.type === '0' || c.type === '5' || !c.type);
      
      if (textChannels.length > 0) {
        select.innerHTML = `<option value="">-- Select Channel --</option>` + textChannels.map(c => 
          `<option value="${escapeHtml(c.id)}">#${escapeHtml(c.name)}</option>`
        ).join('');
      } else {
        select.innerHTML = `<option value="">-- No Channels Found --</option>`;
      }
      if (currentVal) select.value = currentVal;
    });

    // Voice channel pickers
    document.querySelectorAll('select[data-channel-picker="voice"]').forEach(select => {
      const currentVal = select.value;
      const voiceChannels = channels.filter(c => c.type === 'voice' || c.type === '2');
      
      if (voiceChannels.length > 0) {
        select.innerHTML = `<option value="">-- Select Voice Channel --</option>` + voiceChannels.map(c => 
          `<option value="${escapeHtml(c.id)}">🔊 ${escapeHtml(c.name)}</option>`
        ).join('');
      } else {
        select.innerHTML = `<option value="">-- No Voice Channels --</option>`;
      }
      if (currentVal) select.value = currentVal;
    });

    // Role pickers
    document.querySelectorAll('select[data-role-picker="true"]').forEach(select => {
      const currentVal = select.value;
      if (roles.length > 0) {
        select.innerHTML = `
          <option value="">-- Select Role --</option>
          ${roles.map(r => `<option value="${escapeHtml(r.id)}">@${escapeHtml(r.name)}</option>`).join('')}
        `;
      } else {
        select.innerHTML = `<option value="">-- No Roles Found --</option>`;
      }
      if (currentVal) select.value = currentVal;
    });

    // Category channel pickers
    const categorySelect = document.getElementById('ticketPanelCategorySelect');
    if (categorySelect) {
      const currentVal = categorySelect.value;
      const categories = channels.filter(c => c.type === 'category' || c.type === '4');
      if (categories.length > 0) {
        categorySelect.innerHTML = `<option value="">-- Default Server Category --</option>` + categories.map(c => 
          `<option value="${escapeHtml(c.id)}">📁 ${escapeHtml(c.name)}</option>`
        ).join('');
      } else {
        categorySelect.innerHTML = `<option value="">-- Default Server Category --</option>`;
      }
      if (currentVal) categorySelect.value = currentVal;
    }
  }

  // =========================================================
  // DYNAMIC TICKET PANELS RENDERING & MODAL ENGINE
  // =========================================================

  function renderTicketPanels(panels, discoveredCats = [], discoveredChs = []) {
    const container = document.getElementById('ticketPanelsContainer');
    if (!container) return;

    // 1. Render Discovered Channels Card
    const discContainer = document.getElementById('discoveredTicketChannelsContainer');
    const discBadge = document.getElementById('discoveredTicketsCountBadge');
    if (discContainer) {
      const totalDisc = (discoveredCats ? discoveredCats.length : 0) + (discoveredChs ? discoveredChs.length : 0);
      if (discBadge) discBadge.textContent = `${totalDisc} Discovered`;

      if (totalDisc === 0) {
        discContainer.innerHTML = `
          <div style="color: var(--text-muted); font-size: 12px;">
            No dedicated ticket categories detected in this Discord server. Use the "+ Add Ticket Panel" button above to configure one.
          </div>
        `;
      } else {
        let catHtml = '';
        if (discoveredCats && discoveredCats.length > 0) {
          catHtml = `
            <div style="margin-bottom: 12px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 6px;">Ticket Categories in Discord</div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${discoveredCats.map(c => `
                  <span class="nav-badge-pill" style="background: rgba(223,155,109,0.15); color: var(--accent-copper); font-size: 12px; padding: 4px 10px;">
                    📁 ${escapeHtml(c.name)} (${Number(c.channels_count || 0)} channels)
                  </span>
                `).join('')}
              </div>
            </div>
          `;
        }

        let chHtml = '';
        if (discoveredChs && discoveredChs.length > 0) {
          chHtml = `
            <div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 6px;">Ticket Channels in Discord</div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${discoveredChs.map(c => `
                  <span class="nav-badge-pill" style="background: rgba(96,165,250,0.12); color: #60a5fa; font-size: 12px; padding: 4px 10px;">
                    #${escapeHtml(c.name)} <span style="opacity: 0.7; font-size: 10.5px;">(${escapeHtml(c.category_name || '')})</span>
                  </span>
                `).join('')}
              </div>
            </div>
          `;
        }

        discContainer.innerHTML = catHtml + chHtml;
      }
    }

    if (!panels || panels.length === 0) {
      container.innerHTML = `
        <div style="padding: 32px 20px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 28px; margin-bottom: 8px;">🎫</div>
          <div style="font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">No Ticket Panels Configured</div>
          <div style="font-size: 12px; margin-bottom: 16px;">This server has no active ticket panels configured in the database.</div>
          <button type="button" class="btn btn-primary btn-sm" id="emptyAddTicketPanelBtn">+ Create First Ticket Panel</button>
        </div>
      `;
      const btn = document.getElementById('emptyAddTicketPanelBtn');
      if (btn) btn.addEventListener('click', openAddTicketPanelModal);
      return;
    }

    container.innerHTML = `
      <table class="custom-table">
        <thead>
          <tr>
            <th>Panel Name / Channel</th>
            <th>Category</th>
            <th>Support Staff Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${panels.map(p => {
            const isEn = p.enabled !== false;
            let roleDisplay = p.role || 'None';
            if ((!p.role || p.role === 'None') && p.support_roles && p.support_roles.length > 0) {
              roleDisplay = p.support_roles.map(r => `@${r}`).join(', ');
            }
            const discBadgeHtml = p.discovered ? `<span class="nav-badge-pill" style="background: rgba(74,222,128,0.12); color: #4ade80; font-size: 10px; margin-left: 6px;">Discovered</span>` : '';
            return `
              <tr data-panel-id="${escapeHtml(p.id)}">
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 16px;">${escapeHtml(p.emoji || '🎫')}</span>
                    <div>
                      <div style="display: flex; align-items: center;">
                        <strong>${escapeHtml(p.name || `Ticket Panel #${p.id}`)}</strong>
                        ${discBadgeHtml}
                      </div>
                      <div style="font-size: 11px; color: var(--text-muted);">
                        ${p.channel_id ? `Target: &lt;#${escapeHtml(p.channel_id)}&gt;` : 'Default Channel'}
                      </div>
                    </div>
                  </div>
                </td>
                <td><span class="nav-badge-pill" style="background: rgba(255,255,255,0.06);">${p.category_id ? `📁 &lt;#${escapeHtml(p.category_id)}&gt;` : 'Server Default'}</span></td>
                <td><span class="nav-badge-pill">${escapeHtml(roleDisplay)}</span></td>
                <td>
                  <label class="switch">
                    <input type="checkbox" class="ticket-panel-toggle" data-panel-id="${escapeHtml(p.id)}" ${isEn ? 'checked' : ''}>
                    <span class="slider"></span>
                  </label>
                </td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn btn-secondary btn-sm edit-ticket-panel-btn" data-panel-id="${escapeHtml(p.id)}">Edit</button>
                    <button type="button" class="btn btn-secondary btn-sm delete-ticket-panel-btn" data-panel-id="${escapeHtml(p.id)}" style="color: #f87171; border-color: rgba(248,113,113,0.3);">Delete</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    container.querySelectorAll('.ticket-panel-toggle').forEach(chk => {
      chk.addEventListener('change', () => {
        const id = Number(chk.getAttribute('data-panel-id'));
        if (!currentState.tickets) currentState.tickets = { enabled: true, panels: [] };
        const p = currentState.tickets.panels.find(x => Number(x.id) === id);
        if (p) {
          p.enabled = chk.checked;
          currentState.tickets.enabled = currentState.tickets.panels.some(x => x.enabled);
          const tStatus = document.getElementById('ticketsStatusLabel');
          if (tStatus) {
            tStatus.textContent = currentState.tickets.enabled ? 'Active' : 'Disabled';
            tStatus.style.color = currentState.tickets.enabled ? 'var(--status-online)' : 'var(--text-muted)';
          }
          updateDirtyUI();
        }
      });
    });

    container.querySelectorAll('.edit-ticket-panel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-panel-id'));
        openEditTicketPanelModal(id);
      });
    });

    container.querySelectorAll('.delete-ticket-panel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-panel-id'));
        if (confirm('Are you sure you want to delete this ticket panel?')) {
          currentState.tickets.panels = currentState.tickets.panels.filter(x => Number(x.id) !== id);
          currentState.tickets.enabled = currentState.tickets.panels.some(x => x.enabled);
          renderTicketPanels(currentState.tickets.panels, currentState.tickets.discovered_categories, currentState.tickets.discovered_channels);
          updateDirtyUI();
          showToast('Ticket panel deleted. Click "Save Changes" to apply.', 'warning');
        }
      });
    });
  }

  function openAddTicketPanelModal() {
    if (!ticketPanelModal) return;
    const titleEl = document.getElementById('ticketPanelModalTitle');
    if (titleEl) titleEl.innerHTML = `<img src="${EMOJI.tickets}" class="discord-emoji" alt="Tickets"> Add Ticket Panel`;
    document.getElementById('ticketPanelIdInput').value = '';
    document.getElementById('ticketPanelNameInput').value = '';
    document.getElementById('ticketPanelEmojiInput').value = '🎫';
    document.getElementById('ticketPanelActiveCheckbox').checked = true;
    if (activeGuildData) updateDynamicPickers(activeGuildData);
    ticketPanelModal.classList.add('open');
  }

  function openEditTicketPanelModal(id) {
    if (!ticketPanelModal || !currentState || !currentState.tickets) return;
    const p = currentState.tickets.panels.find(x => Number(x.id) === id);
    if (!p) return;

    if (activeGuildData) updateDynamicPickers(activeGuildData);

    const titleEl = document.getElementById('ticketPanelModalTitle');
    if (titleEl) titleEl.innerHTML = `<img src="${EMOJI.tickets}" class="discord-emoji" alt="Tickets"> Edit Ticket Panel #${escapeHtml(id)}`;
    document.getElementById('ticketPanelIdInput').value = p.id;
    document.getElementById('ticketPanelNameInput').value = p.name || '';
    document.getElementById('ticketPanelEmojiInput').value = p.emoji || '🎫';
    document.getElementById('ticketPanelActiveCheckbox').checked = p.enabled !== false;

    const roleSelect = document.getElementById('ticketPanelRoleSelect');
    if (roleSelect && p.support_roles && p.support_roles.length > 0) {
      roleSelect.value = p.support_roles[0];
    }
    const channelSelect = document.getElementById('ticketPanelChannelSelect');
    if (channelSelect && p.channel_id) {
      channelSelect.value = p.channel_id;
    }
    const catSelect = document.getElementById('ticketPanelCategorySelect');
    if (catSelect && p.category_id) {
      catSelect.value = p.category_id;
    }

    ticketPanelModal.classList.add('open');
  }

  // =========================================================
  // DYNAMIC LEVELING REWARDS & REAL-TIME LEADERBOARD ENGINE
  // =========================================================

  function renderLevelingRewards(rewards) {
    const container = document.getElementById('levelRewardsContainer');
    if (!container) return;

    if (!rewards || rewards.length === 0) {
      container.innerHTML = `
        <div style="padding: 32px 20px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 28px; margin-bottom: 8px;">🏆</div>
          <div style="font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">No Role Milestones Configured</div>
          <div style="font-size: 12px; margin-bottom: 16px;">Add role rewards to automatically grant roles when members reach specific levels.</div>
          <button type="button" class="btn btn-primary btn-sm" id="emptyAddLevelRewardBtn">+ Add First Milestone</button>
        </div>
      `;
      const btn = document.getElementById('emptyAddLevelRewardBtn');
      if (btn) btn.addEventListener('click', openAddLevelRewardModal);
      return;
    }

    container.innerHTML = `
      <table class="custom-table">
        <thead>
          <tr>
            <th>Target Level</th>
            <th>Role Granted</th>
            <th>Role ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rewards.map((r, idx) => {
            const discBadge = r.discovered ? `<span class="nav-badge-pill" style="background: rgba(74,222,128,0.12); color: #4ade80; font-size: 10px; margin-left: 6px;">Discovered</span>` : '';
            return `
              <tr>
                <td>
                  <div style="display: flex; align-items: center;">
                    <span class="nav-badge-pill" style="background: rgba(223,155,109,0.15); color: var(--accent-copper); font-weight: 700;">Level ${escapeHtml(r.level)}</span>
                    ${discBadge}
                  </div>
                </td>
                <td><strong>${escapeHtml(r.role || `@Role ${r.role_id}`)}</strong></td>
                <td><code>${escapeHtml(r.role_id || 'N/A')}</code></td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn btn-secondary btn-sm edit-level-reward-btn" data-index="${idx}">Edit</button>
                    <button type="button" class="btn btn-secondary btn-sm delete-level-reward-btn" data-index="${idx}" style="color: #f87171; border-color: rgba(248,113,113,0.3);">Delete</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    container.querySelectorAll('.edit-level-reward-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-index'));
        openEditLevelRewardModal(idx);
      });
    });

    container.querySelectorAll('.delete-level-reward-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-index'));
        if (confirm('Delete this role milestone?')) {
          currentState.leveling.rewards.splice(idx, 1);
          renderLevelingRewards(currentState.leveling.rewards);
          updateDirtyUI();
          showToast('Role milestone deleted. Click "Save Changes" to apply.', 'warning');
        }
      });
    });
  }

  function renderLeaderboard(leaderboardData) {
    const container = document.getElementById('levelingLeaderboardContainer');
    const badge = document.getElementById('leaderboardTotalCountBadge');
    if (!container) return;

    const list = leaderboardData || [];
    if (badge) badge.textContent = `${list.length} Ranked Member${list.length === 1 ? '' : 's'}`;

    if (list.length === 0) {
      container.innerHTML = `
        <div style="padding: 32px 20px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 28px; margin-bottom: 8px;">📈</div>
          <div style="font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">No Members Ranked Yet</div>
          <div style="font-size: 12px;">Members in this Discord server will automatically appear on this leaderboard as they earn XP by chatting.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="custom-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Member</th>
            <th>Level</th>
            <th>Total XP</th>
            <th>Progress to Next Level</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(u => {
            let rankBadge = `#${u.rank}`;
            if (u.rank === 1) rankBadge = '🥇 #1';
            else if (u.rank === 2) rankBadge = '🥈 #2';
            else if (u.rank === 3) rankBadge = '🥉 #3';

            return `
              <tr>
                <td>
                  <span class="nav-badge-pill" style="font-weight: 700; ${u.rank <= 3 ? 'background: rgba(223,155,109,0.2); color: var(--accent-copper); font-size: 13px;' : ''}">${escapeHtml(rankBadge)}</span>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${escapeHtml(u.avatar)}" class="discord-avatar" style="width: 32px; height: 32px; border-radius: 50%;" alt="${escapeHtml(u.username)}">
                    <div>
                      <div style="font-weight: 600; color: var(--text-primary); font-size: 13.5px;">${escapeHtml(u.username)}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(u.handle || '')}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="nav-badge-pill" style="background: rgba(96,165,250,0.15); color: #60a5fa; font-weight: 700;">
                    Lvl ${escapeHtml(u.level)}
                  </span>
                </td>
                <td>
                  <strong>${(u.total_xp || 0).toLocaleString()} XP</strong>
                </td>
                <td style="min-width: 140px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                      <div style="height: 100%; width: ${Number(u.progress_percent || 0)}%; background: linear-gradient(90deg, var(--accent-copper), #f3ba8f); border-radius: 3px;"></div>
                    </div>
                    <span style="font-size: 11px; color: var(--text-muted); font-family: monospace;">${Number(u.progress_percent || 0)}%</span>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  async function fetchGuildLeaderboard(guildId) {
    if (!guildId) return;
    const baseUrl = getApiBaseUrl();

    try {
      const res = await apiFetch(`${baseUrl}/guild/${guildId}/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        renderLeaderboard(data.leaderboard || []);
      } else {
        showToast(`Failed to load leaderboard (HTTP ${res.status}).`, 'error');
      }
    } catch (e) {
      showToast(`Could not fetch leaderboard for guild ${guildId}: ` + (e.message || e), 'error');
    }
  }

  function openAddLevelRewardModal() {
    if (!levelRewardModal) return;
    const titleEl = document.getElementById('levelRewardModalTitle');
    if (titleEl) titleEl.innerHTML = `<img src="${EMOJI.roles}" class="discord-emoji" alt="Roles"> Add Role Milestone`;
    document.getElementById('levelRewardIndexInput').value = '';
    document.getElementById('levelRewardLevelInput').value = '5';
    if (activeGuildData) updateDynamicPickers(activeGuildData);
    levelRewardModal.classList.add('open');
  }

  function openEditLevelRewardModal(idx) {
    if (!levelRewardModal || !currentState || !currentState.leveling || !currentState.leveling.rewards) return;
    const r = currentState.leveling.rewards[idx];
    if (!r) return;

    if (activeGuildData) updateDynamicPickers(activeGuildData);

    const titleEl = document.getElementById('levelRewardModalTitle');
    if (titleEl) titleEl.innerHTML = `<img src="${EMOJI.roles}" class="discord-emoji" alt="Roles"> Edit Role Milestone`;
    document.getElementById('levelRewardIndexInput').value = idx;
    document.getElementById('levelRewardLevelInput').value = r.level;
    const roleSelect = document.getElementById('levelRewardRoleSelect');
    if (roleSelect && r.role_id) {
      roleSelect.value = r.role_id;
    }
    levelRewardModal.classList.add('open');
  }

  // =========================================================
  // DYNAMIC GIVEAWAYS RENDERING & MODAL ENGINE
  // =========================================================

  function renderGiveaways(giveawaysList) {
    const container = document.getElementById('giveawaysContainer');
    if (!container) return;

    if (!giveawaysList || giveawaysList.length === 0) {
      container.innerHTML = `
        <div style="padding: 32px 20px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 28px; margin-bottom: 8px;">🎁</div>
          <div style="font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">No Active Giveaways</div>
          <div style="font-size: 12px; margin-bottom: 16px;">There are currently no active giveaways running on this server.</div>
          <button type="button" class="btn btn-primary btn-sm" id="emptyAddGiveawayBtn">+ Launch First Giveaway</button>
        </div>
      `;
      const btn = document.getElementById('emptyAddGiveawayBtn');
      if (btn) btn.addEventListener('click', openAddGiveawayModal);
      return;
    }

    container.innerHTML = `
      <table class="custom-table">
        <thead>
          <tr>
            <th>Prize</th>
            <th>Channel / Winners</th>
            <th>Ends At</th>
            <th>Requirements</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${giveawaysList.map(g => {
            const endsAtFormatted = g.ends_at ? new Date(g.ends_at * 1000).toLocaleString() : 'Active';
            let reqs = 'None';
            if (g.required_role && g.min_level) {
              reqs = `@Role ${escapeHtml(g.required_role)} + Lvl ${escapeHtml(g.min_level)}`;
            } else if (g.required_role) {
              reqs = `@Role ${escapeHtml(g.required_role)}`;
            } else if (g.min_level) {
              reqs = `Level ${escapeHtml(g.min_level)}+`;
            }

            return `
              <tr data-giveaway-id="${escapeHtml(g.message_id || g.id)}">
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">🎁</span>
                    <div>
                      <strong>${escapeHtml(g.prize || 'Giveaway')}</strong>
                      <div style="font-size: 11px; color: var(--text-muted);">ID: ${escapeHtml(g.message_id || g.id)}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div>&lt;#${escapeHtml(g.channel_id)}&gt;</div>
                  <div style="font-size: 11px; color: var(--text-muted);">${Number(g.winners || 1)} Winner${Number(g.winners || 1) === 1 ? '' : 's'}</div>
                </td>
                <td><span class="nav-badge-pill" style="background: rgba(223,155,109,0.15); color: var(--accent-copper); font-weight: 600;">${escapeHtml(endsAtFormatted)}</span></td>
                <td><span class="nav-badge-pill">${reqs}</span></td>
                <td>
                  <button type="button" class="btn btn-secondary btn-sm end-giveaway-btn" data-giveaway-id="${escapeHtml(g.message_id || g.id)}" style="color: #f87171; border-color: rgba(248,113,113,0.3);">
                    🛑 End Now
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    container.querySelectorAll('.end-giveaway-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const gid = btn.getAttribute('data-giveaway-id');
        if (!gid || !currentGuildId) return;

        if (confirm(`Are you sure you want to immediately end this giveaway?`)) {
          btn.disabled = true;
          btn.textContent = 'Ending...';
          const baseUrl = getApiBaseUrl();

          try {
            const res = await apiFetch(`${baseUrl}/guild/${currentGuildId}/giveaway/${gid}/end`, {
              method: 'POST'
            });

            if (res.ok) {
              showToast('Giveaway ended on Discord!', 'success');
              if (currentState.giveaways && currentState.giveaways.list) {
                currentState.giveaways.list = currentState.giveaways.list.filter(x => String(x.message_id || x.id) !== String(gid));
                renderGiveaways(currentState.giveaways.list);
              }
              // Refresh server activity
              fetchGuildActivity(currentGuildId);
            } else {
              const err = await res.json().catch(() => ({}));
              showToast(err.error || 'Failed to end giveaway.', 'error');
              btn.disabled = false;
              btn.textContent = '🛑 End Now';
            }
          } catch (e) {
            showToast('Error communicating with bot: ' + (e.message || e), 'error');
            btn.disabled = false;
            btn.textContent = '🛑 End Now';
          }
        }
      });
    });
  }

  function openAddGiveawayModal() {
    if (!giveawayModal) return;
    const titleEl = giveawayModal.querySelector('.modal-title-text');
    if (titleEl) titleEl.innerHTML = `<img src="${EMOJI.giveaways}" class="discord-emoji" alt="Giveaways"> Launch Discord Giveaway`;
    
    const prizeInput = document.getElementById('giveawayPrizeInput');
    const durInput = document.getElementById('giveawayDurationInput');
    const winInput = document.getElementById('giveawayWinnersInput');
    const minLvlInput = document.getElementById('giveawayMinLevelInput');
    
    if (prizeInput) prizeInput.value = 'Discord Nitro';
    if (durInput) durInput.value = '1d';
    if (winInput) winInput.value = '1';
    if (minLvlInput) minLvlInput.value = '0';

    if (activeGuildData) updateDynamicPickers(activeGuildData);
    giveawayModal.classList.add('open');
  }

  // =========================================================
  // DYNAMIC WARN TIERS RENDERING & MODAL ENGINE
  // =========================================================

  function renderWarnTiers(tiers) {
    const tbody = document.getElementById('warnTiersTableBody');
    if (!tbody) return;

    if (!tiers || tiers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">
            No warning escalation tiers configured. Click <strong>+ Add Tier</strong> to create one.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = tiers.map((tier, idx) => {
      const actionLabels = {
        'timeout_5m': 'Timeout (5m)',
        'timeout_1h': 'Timeout (1h)',
        'timeout_24h': 'Timeout (24h)',
        'kick': 'Kick from Server',
        'ban': 'Permanent Ban',
        'jail': 'Jail / Quarantine'
      };
      const actLabel = actionLabels[tier.action] || tier.action || 'Timeout';
      const durationStr = tier.duration || 'Standard';

      return `
        <tr>
          <td><span class="nav-badge-pill" style="color: var(--accent-copper); background: var(--accent-subtle); font-weight: 700;">${escapeHtml(tier.warns || tier.threshold || (idx + 1))} Warning${Number(tier.warns || 1) === 1 ? '' : 's'}</span></td>
          <td><strong>${escapeHtml(actLabel)}</strong></td>
          <td><code>${escapeHtml(durationStr)}</code></td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm delete-warn-tier-btn" data-index="${idx}" style="color: #f87171; border-color: rgba(248,113,113,0.3);" aria-label="Delete warning tier">
              ✕ Remove
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.delete-warn-tier-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (currentState && currentState.warn_config && currentState.warn_config.tiers) {
          currentState.warn_config.tiers.splice(idx, 1);
          renderWarnTiers(currentState.warn_config.tiers);
          updateDirtyUI();
        }
      });
    });
  }

  function openAddWarnTierModal() {
    if (!warnTierModal) return;
    const threshInput = document.getElementById('warnTierThresholdInput');
    const actSelect = document.getElementById('warnTierActionSelect');
    const durInput = document.getElementById('warnTierDurationInput');
    if (threshInput) threshInput.value = (currentState && currentState.warn_config && currentState.warn_config.tiers ? currentState.warn_config.tiers.length + 1 : 3);
    if (actSelect) actSelect.value = 'timeout_5m';
    if (durInput) durInput.value = '5m';
    warnTierModal.classList.add('open');
  }

  // =========================================================
  // DYNAMIC REACTION ROLES RENDERING & MODAL ENGINE
  // =========================================================

  function renderReactionRoles(entries) {
    const tbody = document.getElementById('reactionRolesTableBody');
    if (!tbody) return;

    if (!entries || entries.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
            No reaction role bindings active. Click <strong>+ Add Reaction Role</strong> to create one.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = entries.map((entry, idx) => {
      let roleName = entry.role_name || (entry.role_id ? `@Role ${entry.role_id}` : '@Role');
      if (activeGuildData && activeGuildData.roles && entry.role_id) {
        const rObj = activeGuildData.roles.find(r => String(r.id) === String(entry.role_id));
        if (rObj) roleName = `@${rObj.name}`;
      }

      let chName = entry.channel_id ? `#${entry.channel_id}` : '#general';
      if (activeGuildData && activeGuildData.channels && entry.channel_id) {
        const cObj = activeGuildData.channels.find(c => String(c.id) === String(entry.channel_id));
        if (cObj) chName = `#${cObj.name}`;
      }

      return `
        <tr>
          <td>${escapeHtml(chName)}</td>
          <td><code>${escapeHtml(entry.message_id || '--')}</code></td>
          <td style="font-size: 16px;">${escapeHtml(entry.emoji || '⭐')}</td>
          <td><span class="tag-chip" style="font-size: 11px;">${escapeHtml(roleName)}</span></td>
          <td><span class="nav-badge-pill">${escapeHtml(entry.mode || 'toggle')}</span></td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm delete-reaction-role-btn" data-index="${idx}" style="color: #f87171; border-color: rgba(248,113,113,0.3);" aria-label="Delete reaction role">
              ✕ Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.delete-reaction-role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (currentState && currentState.reaction_roles && currentState.reaction_roles.entries) {
          currentState.reaction_roles.entries.splice(idx, 1);
          renderReactionRoles(currentState.reaction_roles.entries);
          updateDirtyUI();
        }
      });
    });
  }

  function openAddReactionRoleModal() {
    if (!reactionRoleModal) return;
    const msgInput = document.getElementById('reactionRoleMessageIdInput');
    const emojiInput = document.getElementById('reactionRoleEmojiInput');
    const modeSelect = document.getElementById('reactionRoleModeSelect');

    if (activeGuildData) updateDynamicPickers(activeGuildData);
    if (msgInput) msgInput.value = '';
    if (emojiInput) emojiInput.value = '⭐';
    if (modeSelect) modeSelect.value = 'toggle';

    reactionRoleModal.classList.add('open');
  }

  // =========================================================
  // DYNAMIC MODERATION CASES RENDERING ENGINE
  // =========================================================

  function renderCases(casesList) {
    const tbody = document.getElementById('casesTableBody');
    if (!tbody) return;

    if (!casesList || casesList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 28px;">
            No moderation cases recorded for this server.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = casesList.map(c => {
      const actType = (c.action || c.type || 'warn').toUpperCase();
      let badgeStyle = 'background: rgba(251,191,36,0.15); color: #fbbf24;';
      if (actType.includes('BAN')) badgeStyle = 'background: rgba(239,68,68,0.15); color: #f87171;';
      else if (actType.includes('KICK')) badgeStyle = 'background: rgba(249,115,22,0.15); color: #fb923c;';
      else if (actType.includes('MUTE') || actType.includes('TIMEOUT')) badgeStyle = 'background: rgba(96,165,250,0.15); color: #60a5fa;';
      else if (actType.includes('JAIL')) badgeStyle = 'background: rgba(168,85,247,0.15); color: #c084fc;';

      const timeStr = c.created_at ? formatRelativeTime(c.created_at) : 'Recent';

      return `
        <tr>
          <td><strong>#${escapeHtml(c.id || c.case_id || '1')}</strong></td>
          <td><span class="nav-badge-pill" style="${badgeStyle} font-weight: 700;">${escapeHtml(actType)}</span></td>
          <td><strong>${escapeHtml(c.target_user || c.user_tag || c.user_id || 'User')}</strong></td>
          <td><span style="color: var(--text-secondary);">${escapeHtml(c.moderator || c.mod_tag || 'Flarex')}</span></td>
          <td><span style="color: var(--text-muted); font-size: 12px;">${escapeHtml(c.reason || 'No reason provided')}</span></td>
          <td><span style="color: var(--text-muted); font-size: 11px;">${escapeHtml(timeStr)}</span></td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================
  // DYNAMIC BANNED WORDS RENDERING & MODAL ENGINE
  // =========================================================

  function renderBannedWords(words) {
    const wrap = document.getElementById('bannedWordsChipsWrap');
    if (!wrap) return;
    wrap.innerHTML = '';

    if (!Array.isArray(words) || words.length === 0) {
      wrap.innerHTML = '<span style="color: var(--text-muted); font-size: 12.5px; font-style: italic; padding: 4px 0;">No blacklisted words configured. Click <strong>+ Add Word</strong> to create one.</span>';
      return;
    }

    words.forEach((word, idx) => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.style.display = 'inline-flex';
      chip.style.alignItems = 'center';
      chip.style.gap = '6px';
      chip.style.padding = '5px 12px';
      chip.style.borderRadius = '8px';
      chip.style.background = 'rgba(28, 18, 14, 0.9)';
      chip.style.border = '1px solid var(--accent-border)';
      chip.style.color = 'var(--text-primary)';
      chip.style.fontSize = '12px';
      chip.style.fontFamily = 'var(--font-mono)';

      chip.innerHTML = `
        <span>${escapeHtml(word)}</span>
        <button type="button" class="remove-banned-word-btn" data-index="${idx}" title="Remove word" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-weight: bold; font-size: 13px; padding: 0 2px; line-height: 1; transition: color 0.2s;" aria-label="Remove ${escapeHtml(word)}">✕</button>
      `;
      wrap.appendChild(chip);
    });

    wrap.querySelectorAll('.remove-banned-word-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        removeBannedWord(idx);
      });
      btn.addEventListener('mouseenter', () => { btn.style.color = '#f87171'; });
      btn.addEventListener('mouseleave', () => { btn.style.color = 'var(--text-muted)'; });
    });
  }

  function removeBannedWord(index) {
    if (!currentState) currentState = deepClone(savedState) || getDefaultConfig();
    if (!currentState.automod) currentState.automod = { enabled: true, banned_words: [] };
    if (!currentState.automod.banned_words) currentState.automod.banned_words = [];

    const removed = currentState.automod.banned_words.splice(index, 1);
    renderBannedWords(currentState.automod.banned_words);
    updateDirtyUI();
    showToast(`Removed "${removed[0] || 'word'}" from blacklist. Click Save Changes to apply.`, 'info');
  }

  function openAddBannedWordModal() {
    if (!addBannedWordModal) return;
    const input = document.getElementById('newBannedWordInput');
    if (input) {
      input.value = '';
    }
    addBannedWordModal.classList.add('open');
    setTimeout(() => { if (input) input.focus(); }, 50);
  }

  function saveBannedWord() {
    const input = document.getElementById('newBannedWordInput');
    if (!input) return;
    const rawVal = input.value.trim();
    if (!rawVal) {
      showToast('Please enter at least one word to blacklist.', 'warning');
      return;
    }

    if (!currentState) currentState = deepClone(savedState) || getDefaultConfig();
    if (!currentState.automod) currentState.automod = { enabled: true, banned_words: [] };
    if (!currentState.automod.banned_words) currentState.automod.banned_words = [];

    const newWords = rawVal.split(/[,]+/).map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
    let addedCount = 0;

    newWords.forEach(w => {
      if (!currentState.automod.banned_words.includes(w)) {
        currentState.automod.banned_words.push(w);
        addedCount++;
      }
    });

    renderBannedWords(currentState.automod.banned_words);
    closeModals();
    updateDirtyUI();

    if (addedCount > 0) {
      showToast(`Added ${addedCount} word(s) to blacklist! Click Save Changes to apply.`, 'success');
    } else {
      showToast('Word(s) already exist in the blacklist.', 'warning');
    }
  }

  // =========================================================
  // COMMAND RATE LIMITS & COOLDOWNS DIRECTORY
  // =========================================================

  const COMMAND_DIRECTORY_DATA = [
    { name: 'antinuke', category: '🛡️ Moderation', base: 10, scope: 'User + Guild', perm: 'Administrator' },
    { name: 'whitelist', category: '🛡️ Moderation', base: 5, scope: 'User', perm: 'Administrator' },
    { name: 'extraowner', category: '🛡️ Moderation', base: 5, scope: 'User', perm: 'Server Owner' },
    { name: 'raid', category: '🛡️ Moderation', base: 5, scope: 'User + Guild', perm: 'Administrator' },
    { name: 'ban / unban', category: '🛡️ Moderation', base: 3, scope: 'User', perm: 'Ban Members' },
    { name: 'kick', category: '🛡️ Moderation', base: 3, scope: 'User', perm: 'Kick Members' },
    { name: 'mute / unmute', category: '🛡️ Moderation', base: 3, scope: 'User', perm: 'Moderate Members' },
    { name: 'purge', category: '🛡️ Moderation', base: 5, scope: 'User', perm: 'Manage Messages' },
    { name: 'lock / unlock', category: '🛡️ Moderation', base: 3, scope: 'User', perm: 'Manage Channels' },
    { name: 'hide / unhide', category: '🛡️ Moderation', base: 3, scope: 'User', perm: 'Manage Channels' },
    { name: 'jail / unjail', category: '🛡️ Moderation', base: 5, scope: 'User', perm: 'Moderate Members' },
    { name: 'warn', category: '🛡️ Moderation', base: 3, scope: 'User', perm: 'Moderate Members' },
    { name: 'slowmode', category: '🛡️ Moderation', base: 3, scope: 'User', perm: 'Manage Channels' },
    { name: 'role / autorole', category: '👑 Roles', base: 5, scope: 'User', perm: 'Manage Roles' },
    { name: 'customrole', category: '👑 Roles', base: 5, scope: 'User', perm: 'Manage Roles' },
    { name: 'ticket / setup', category: '⚙️ Automation', base: 10, scope: 'User', perm: 'Manage Guild' },
    { name: 'reactionrole', category: '⚙️ Automation', base: 5, scope: 'User', perm: 'Manage Roles' },
    { name: 'autoresponder', category: '⚙️ Automation', base: 5, scope: 'User', perm: 'Manage Guild' },
    { name: 'autoreact', category: '⚙️ Automation', base: 5, scope: 'User', perm: 'Manage Guild' },
    { name: 'welcome', category: '✨ Welcomer', base: 5, scope: 'User', perm: 'Manage Guild' },
    { name: 'starboard', category: '⭐ Community', base: 5, scope: 'User', perm: 'Manage Guild' },
    { name: 'music / play', category: '🎵 Music', base: 3, scope: 'User', perm: 'Everyone' },
    { name: 'skip / stop', category: '🎵 Music', base: 3, scope: 'User', perm: 'Everyone' },
    { name: 'volume', category: '🎵 Music', base: 3, scope: 'User', perm: 'Everyone' },
    { name: '24/7', category: '🎵 Music', base: 5, scope: 'User', perm: 'Manage Guild' },
    { name: 'j2c', category: '🎙️ Voice', base: 5, scope: 'User', perm: 'Manage Channels' },
    { name: 'giveaway', category: '🎉 Giveaways', base: 15, scope: 'User', perm: 'Manage Guild' },
    { name: 'rank / leaderboard', category: '🏆 Leveling', base: 5, scope: 'User', perm: 'Everyone' },
    { name: 'daily / balance', category: '🪙 Economy', base: 5, scope: 'User', perm: 'Everyone' },
    { name: 'pay / transfer', category: '🪙 Economy', base: 5, scope: 'User', perm: 'Everyone' },
    { name: 'work / rob', category: '🪙 Economy', base: 10, scope: 'User', perm: 'Everyone' },
    { name: 'help', category: '⚡ Utility', base: 2, scope: 'User', perm: 'Everyone' },
    { name: 'status', category: '⚡ Utility', base: 3, scope: 'User', perm: 'Everyone' },
    { name: 'prefix', category: '⚡ Utility', base: 5, scope: 'User', perm: 'Administrator' },
    { name: 'ping', category: '⚡ Utility', base: 2, scope: 'User', perm: 'Everyone' }
  ];

  function renderCommandDirectory(multiplier = 1.0, query = '') {
    const tbody = document.getElementById('commandDirectoryTableBody');
    if (!tbody) return;

    let mult = Number(multiplier);
    if (isNaN(mult) || mult <= 0) mult = 1.0;

    let list = COMMAND_DIRECTORY_DATA;
    if (query) {
      list = list.filter(c => c.name.toLowerCase().includes(query) || c.category.toLowerCase().includes(query) || c.perm.toLowerCase().includes(query));
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
            No commands matching "${escapeHtml(query)}" found.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(c => {
      const effSec = Math.max(0.1, Number((c.base * mult).toFixed(2)));
      const effDisplay = mult < 1.0 
        ? `<span class="nav-badge-pill" style="background: rgba(74, 222, 128, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); font-weight: 800;">${effSec}s (${Math.round((1 - mult) * 100)}% faster)</span>`
        : mult > 1.0
        ? `<span class="nav-badge-pill" style="background: rgba(239, 68, 68, 0.15); color: #f87171;">${effSec}s</span>`
        : `<code>${effSec}s</code>`;

      return `
        <tr>
          <td><code style="color: var(--accent-copper-light); font-weight: 700;">&gt; ${escapeHtml(c.name)}</code></td>
          <td><span>${escapeHtml(c.category)}</span></td>
          <td><code>${c.base}s</code></td>
          <td>${effDisplay}</td>
          <td><span class="nav-badge-pill" style="background: rgba(184, 137, 99, 0.15); color: var(--text-secondary); border: 1px solid var(--accent-border);">${escapeHtml(c.scope)}</span></td>
          <td><span style="font-size: 12px; color: var(--text-primary); font-weight: 600;">${escapeHtml(c.perm)}</span></td>
        </tr>
      `;
    }).join('');
  }

  function updateCommandAccessTierUI() {
    const labelEl = document.getElementById('activeTierCooldownLabel');
    const badgeEl = document.getElementById('tierCooldownSpeedBadge');
    if (!labelEl || !badgeEl) return;

    let tierName = 'FREE';
    if (premiumData && premiumData.is_active) {
      tierName = (premiumData.plan_name || premiumData.subscription || 'GOLD').toUpperCase();
    } else if (premiumData && premiumData.is_trial) {
      tierName = 'GOLD TRIAL';
    }

    if (tierName.includes('OBSIDIAN')) {
      labelEl.textContent = 'Obsidian Edition Speed (0.10x Ultra-Fast)';
      badgeEl.textContent = '0.10x (10x Speed)';
      badgeEl.style.background = 'rgba(101, 69, 51, 0.45)';
      badgeEl.style.color = '#F3E6D8';
    } else if (tierName.includes('DIAMOND')) {
      labelEl.textContent = 'Diamond Tier 1 Speed (0.25x - 4x Faster)';
      badgeEl.textContent = '0.25x (4x Speed)';
      badgeEl.style.background = 'rgba(184, 137, 99, 0.25)';
      badgeEl.style.color = 'var(--accent-copper-light)';
    } else if (tierName.includes('GOLD') || (premiumData && premiumData.is_trial)) {
      labelEl.textContent = 'Gold Free Trial Speed (0.50x - 2x Faster)';
      badgeEl.textContent = '0.50x (2x Speed)';
      badgeEl.style.background = 'rgba(234, 179, 8, 0.2)';
      badgeEl.style.color = '#facc15';
    } else {
      labelEl.textContent = 'Standard Speed (1.00x Base)';
      badgeEl.textContent = '1.00x Standard';
      badgeEl.style.background = 'rgba(184, 137, 99, 0.15)';
      badgeEl.style.color = 'var(--accent-copper-light)';
    }
  }

  // =========================================================
  // DYNAMIC WHITELIST RENDERING & MODAL ENGINE
  // =========================================================

  function normalizeWhitelistEntry(entry) {
    if (typeof entry === 'string') {
      return {
        id: entry,
        name: `User / Role (${entry})`,
        designation: 'admin',
        scope: 'full_immunity'
      };
    }
    return {
      id: entry.id || '',
      name: entry.name || `User / Role (${entry.id || 'N/A'})`,
      designation: entry.designation || 'admin',
      scope: entry.scope || 'full_immunity'
    };
  }

  function renderWhitelists(list) {
    const tbody = document.getElementById('whitelistTableBody');
    if (!tbody) return;

    if (!list || list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 28px;">
            No whitelisted administrators or bots configured. Click <strong>+ Add Whitelist</strong> to add trusted staff.
          </td>
        </tr>
      `;
      return;
    }

    const designationBadges = {
      'owner': '<span class="nav-badge-pill"><img src="assets/crown.png" class="discord-emoji small" alt="Owner"> Owner</span>',
      'lead_dev': '<span class="nav-badge-pill"><img src="https://cdn.discordapp.com/emojis/1525317596105150474.webp" class="discord-emoji small" alt="Lead Dev"> Lead Dev</span>',
      'admin': '<span class="nav-badge-pill" style="color: #fbbf24; background: rgba(251,191,36,0.15);">⭐ Administrator</span>',
      'bot': '<span class="nav-badge-pill" style="color: #60a5fa; background: rgba(96,165,250,0.15);"><img src="https://cdn.discordapp.com/emojis/1525316796289388765.webp" class="discord-emoji small" alt="Bot"> Bot</span>',
      'mod': '<span class="nav-badge-pill" style="color: #4ade80; background: rgba(74,222,128,0.15);">🔨 Moderator</span>'
    };

    const scopeLabels = {
      'full_immunity': '<span style="color: var(--status-online); font-weight: 600;">Full Immunity</span>',
      'channel_role': '<span>Channel &amp; Role Only</span>',
      'bot_operations': '<span>Bot Operations</span>',
      'anti_spam': '<span>Anti-Spam Only</span>'
    };

    tbody.innerHTML = list.map((item, idx) => {
      const entry = normalizeWhitelistEntry(item);
      const badge = designationBadges[entry.designation] || `<span class="nav-badge-pill">${escapeHtml(entry.designation)}</span>`;
      const scope = scopeLabels[entry.scope] || `<span>${escapeHtml(entry.scope)}</span>`;

      return `
        <tr>
          <td><strong>${escapeHtml(entry.name)}</strong></td>
          <td><code>${escapeHtml(entry.id)}</code></td>
          <td>${badge}</td>
          <td>${scope}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-secondary btn-sm edit-whitelist-btn" data-index="${idx}">
                Edit
              </button>
              <button type="button" class="btn btn-secondary btn-sm delete-whitelist-btn" data-index="${idx}" style="color: #f87171; border-color: rgba(248,113,113,0.3);" aria-label="Delete whitelist entry">
                ✕
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.edit-whitelist-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        openAddWhitelistModal(idx);
      });
    });

    tbody.querySelectorAll('.delete-whitelist-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (currentState && currentState.antinuke && currentState.antinuke.whitelist) {
          currentState.antinuke.whitelist.splice(idx, 1);
          renderWhitelists(currentState.antinuke.whitelist);
          updateDirtyUI();
          showToast('Whitelist entry removed. Click "Save Changes" to apply.', 'info');
        }
      });
    });
  }

  function openAddWhitelistModal(editIndex = -1) {
    if (!whitelistModal) return;
    const titleEl = document.getElementById('whitelistModalTitle');
    const editInput = document.getElementById('whitelistEditIndex');
    const nameInput = document.getElementById('whitelistNameInput');
    const idInput = document.getElementById('whitelistIdInput');
    const desigSelect = document.getElementById('whitelistDesignationSelect');
    const scopeSelect = document.getElementById('whitelistScopeSelect');

    if (editIndex >= 0 && currentState && currentState.antinuke && currentState.antinuke.whitelist && currentState.antinuke.whitelist[editIndex]) {
      const entry = normalizeWhitelistEntry(currentState.antinuke.whitelist[editIndex]);
      if (titleEl) titleEl.innerHTML = `<img src="assets/crown.png" class="discord-emoji" alt="Whitelist"> Edit Whitelist Entry`;
      if (editInput) editInput.value = editIndex;
      if (nameInput) nameInput.value = entry.name;
      if (idInput) idInput.value = entry.id;
      if (desigSelect) desigSelect.value = entry.designation;
      if (scopeSelect) scopeSelect.value = entry.scope;
    } else {
      if (titleEl) titleEl.innerHTML = `<img src="assets/crown.png" class="discord-emoji" alt="Whitelist"> Add Whitelisted User or Bot`;
      if (editInput) editInput.value = -1;
      if (nameInput) nameInput.value = '';
      if (idInput) idInput.value = '';
      if (desigSelect) desigSelect.value = 'admin';
      if (scopeSelect) scopeSelect.value = 'full_immunity';
    }

    whitelistModal.classList.add('open');
  }

  // =========================================================
  // DYNAMIC AUTOROLES RENDERING & MODAL ENGINE
  // =========================================================

  function renderAutoroles(roles) {
    const container = document.getElementById('welcomerAutorolesContainer');
    if (!container) return;

    if (!roles || roles.length === 0) {
      container.innerHTML = `
        <span style="font-size: 12px; color: var(--text-muted); font-style: italic;">No auto-roles assigned on member join.</span>
        <button type="button" class="tag-chip" id="autorolesEmptyAddBtn" style="border-style: dashed; color: var(--text-muted); cursor: pointer;">+ Assign Role</button>
      `;
      const emptyBtn = document.getElementById('autorolesEmptyAddBtn');
      if (emptyBtn) emptyBtn.addEventListener('click', openAssignRoleModal);
      return;
    }

    container.innerHTML = roles.map((roleIdOrName, idx) => {
      let displayName = roleIdOrName;
      if (activeGuildData && activeGuildData.roles) {
        const found = activeGuildData.roles.find(r => String(r.id) === String(roleIdOrName));
        if (found) displayName = `@${found.name}`;
        else if (!String(displayName).startsWith('@')) displayName = `@${displayName}`;
      } else if (!String(displayName).startsWith('@')) {
        displayName = `@${displayName}`;
      }

      return `
        <span class="tag-chip autorole-chip">
          ${escapeHtml(displayName)}
          <span class="remove-autorole-chip-btn" data-index="${idx}" style="cursor: pointer; margin-left: 6px; color: #f87171; font-weight: bold;" title="Remove role">✕</span>
        </span>
      `;
    }).join('') + `
      <button type="button" class="tag-chip" id="autorolesAddTagBtn" style="border-style: dashed; color: var(--text-muted); cursor: pointer;">+ Assign Role</button>
    `;

    container.querySelectorAll('.remove-autorole-chip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (currentState && currentState.welcomer && currentState.welcomer.autoroles) {
          currentState.welcomer.autoroles.splice(idx, 1);
          renderAutoroles(currentState.welcomer.autoroles);
          updateDirtyUI();
          showToast('Auto-role removed. Click "Save Changes" to apply.', 'info');
        }
      });
    });

    const addTagBtn = document.getElementById('autorolesAddTagBtn');
    if (addTagBtn) addTagBtn.addEventListener('click', openAssignRoleModal);
  }

  function openAssignRoleModal() {
    if (!assignRoleModal) return;
    if (activeGuildData) updateDynamicPickers(activeGuildData);
    assignRoleModal.classList.add('open');
  }

  function populateForm(state) {
    if (!state) return;

    const modelInputs = document.querySelectorAll('[data-model]');
    modelInputs.forEach(el => {
      const path = el.getAttribute('data-model');
      const val = getNestedValue(state, path);

      if (el.type === 'checkbox') {
        el.checked = Boolean(val);
        const statusLabelId = el.getAttribute('data-status-label');
        if (statusLabelId) {
          const lbl = document.getElementById(statusLabelId);
          if (lbl) {
            lbl.textContent = el.checked ? 'Active' : 'Disabled';
            lbl.style.color = el.checked ? 'var(--status-online)' : 'var(--text-muted)';
          }
        }
      } else if (el.type === 'range') {
        if (val !== undefined && val !== null) el.value = val;
        const badgeId = el.getAttribute('data-badge');
        const unit = el.getAttribute('data-unit') || '';
        if (badgeId) {
          const badge = document.getElementById(badgeId);
          if (badge) badge.textContent = `${el.value}${unit}`;
        }
      } else if (el.tagName === 'SELECT') {
        if (val !== undefined && val !== null) {
          let found = false;
          for (let i = 0; i < el.options.length; i++) {
            if (el.options[i].value == val) {
              el.selectedIndex = i;
              found = true;
              break;
            }
          }
          if (!found && String(val).trim()) {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val;
            opt.selected = true;
            el.appendChild(opt);
          }
        }
      } else {
        if (Array.isArray(val)) {
          el.value = val.join(', ');
        } else {
          el.value = (val !== undefined && val !== null) ? val : '';
        }
      }
    });

    renderLiveDiscordPreview();
    renderWhitelists(state.antinuke ? state.antinuke.whitelist : []);
    renderAutoroles(state.welcomer ? state.welcomer.autoroles : []);
    renderTicketPanels(state.tickets ? state.tickets.panels : [], state.tickets ? state.tickets.discovered_categories : [], state.tickets ? state.tickets.discovered_channels : []);
    renderLevelingRewards(state.leveling ? state.leveling.rewards : []);
    renderGiveaways(state.giveaways ? (state.giveaways.list || []) : []);
    renderWarnTiers(state.warn_config ? state.warn_config.tiers : []);
    renderReactionRoles(state.reaction_roles ? state.reaction_roles.entries : []);
    renderCases(state.cases ? state.cases.recent_cases : []);
    renderBannedWords(state.automod ? state.automod.banned_words : []);
    renderCommandDirectory(state.command_access ? state.command_access.cooldown_multiplier : 1.0);
    updateCommandAccessTierUI();
  }

  function initModelEventHandlers() {
    document.querySelectorAll('[data-model]').forEach(el => {
      const handler = () => {
        if (!currentState) currentState = deepClone(savedState) || getDefaultConfig();
        const path = el.getAttribute('data-model');
        let val;

        if (el.type === 'checkbox') {
          val = el.checked;
          const statusLabelId = el.getAttribute('data-status-label');
          if (statusLabelId) {
            const lbl = document.getElementById(statusLabelId);
            if (lbl) {
              lbl.textContent = val ? 'Active' : 'Disabled';
              lbl.style.color = val ? 'var(--status-online)' : 'var(--text-muted)';
            }
          }
        } else if (el.type === 'range') {
          val = Number(el.value);
          const badgeId = el.getAttribute('data-badge');
          const unit = el.getAttribute('data-unit') || '';
          if (badgeId) {
            const badge = document.getElementById(badgeId);
            if (badge) badge.textContent = `${el.value}${unit}`;
          }
        } else if (el.type === 'number') {
          val = Number(el.value);
        } else {
          val = el.value;
        }

        setNestedValue(currentState, path, val);
        if (path.startsWith('welcomer.')) {
          renderLiveDiscordPreview();
        }
        if (path === 'command_access.cooldown_multiplier') {
          renderCommandDirectory(val);
        }
        updateDirtyUI();
      };

      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    });
  }

  // =========================================================
  // GUILD LOAD ERROR STATE ENGINE
  // =========================================================

  function showGuildLoadError(guildId, errorMsg) {
    const container = document.getElementById('tab-overview');
    if (!container) return;

    let errBanner = document.getElementById('guildLoadErrorBanner');
    if (!errBanner) {
      errBanner = document.createElement('div');
      errBanner.id = 'guildLoadErrorBanner';
      errBanner.style.cssText = 'background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 12px; padding: 18px 24px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px;';
      container.insertBefore(errBanner, container.firstChild);
    }

    errBanner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="font-size: 26px;">⚠️</span>
        <div>
          <div style="font-weight: 700; color: #f87171; font-size: 14px; margin-bottom: 2px;">Failed to Load Server Data</div>
          <div style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(errorMsg || 'Unable to connect to the Discord bot gateway for this server.')}</div>
        </div>
      </div>
      <button type="button" class="btn btn-primary btn-sm" id="retryGuildLoadBtn" style="background: #ef4444; border: none; padding: 8px 18px; font-weight: 700; border-radius: 8px; cursor: pointer; color: #fff;">
        🔄 Retry
      </button>
    `;

    const retryBtn = document.getElementById('retryGuildLoadBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        clearGuildLoadError();
        selectGuild(guildId);
      });
    }
  }

  function clearGuildLoadError() {
    const errBanner = document.getElementById('guildLoadErrorBanner');
    if (errBanner) {
      errBanner.remove();
    }
  }

  async function selectGuild(guildId) {
    if (isDirty()) {
      const confirmLeave = confirm('You have unsaved changes on this server. Discard and switch servers?');
      if (!confirmLeave) return;
    }

    clearGuildLoadError();
    currentGuildId = guildId;
    activeGuildData = allGuilds.find(g => g.id === guildId) || allGuilds[0];

    // Update Header Server Selector Button
    const headerServerAvatar = document.getElementById('headerServerAvatar');
    const headerServerName = document.getElementById('headerServerName');

    if (activeGuildData) {
      if (headerServerAvatar) {
        headerServerAvatar.innerHTML = activeGuildData.icon 
          ? `<img src="${escapeHtml(activeGuildData.icon)}" alt="Icon" style="width: 100%; height: 100%; object-fit: cover;">` 
          : `<span>${escapeHtml(activeGuildData.name ? activeGuildData.name.substring(0, 2).toUpperCase() : '??')}</span>`;
      }
      if (headerServerName) {
        headerServerName.textContent = activeGuildData.name || 'Selected Server';
      }
      const sMembers = document.getElementById('metricServerMembers');
      if (sMembers && activeGuildData.member_count !== undefined) {
        const mCount = Number(activeGuildData.member_count || 0);
        sMembers.textContent = mCount.toLocaleString();
      }
    }

    renderServerPicker();
    updateDynamicPickers(activeGuildData);

    // Fetch live stats, activity, leaderboard & premium status immediately
    await fetchGuildStats(currentGuildId);
    await fetchGuildActivity(currentGuildId);
    await fetchGuildLeaderboard(currentGuildId);
    await fetchPremiumStatus(currentGuildId);

    // Fetch live config for this guild from REST API
    const baseUrl = getApiBaseUrl();

    try {
      const res = await apiFetch(`${baseUrl}/guild/${currentGuildId}/config`);
      if (res.ok) {
        const data = await res.json();
        const loadedCfg = data.config || (activeGuildData ? activeGuildData.config : null) || getDefaultConfig();
        savedState = deepClone(loadedCfg);
        currentState = deepClone(loadedCfg);
        populateForm(currentState);
        updateDirtyUI();
        clearGuildLoadError();
        if (activeGuildData) {
          showToast(`Active server: ${activeGuildData.name}`, 'crown');
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.error || `Server responded with HTTP ${res.status}`;
        showToast(`Error loading configuration: ${msg}`, 'error');
        showGuildLoadError(currentGuildId, msg);
      }
    } catch (e) {
      showToast(`Failed to connect to bot gateway: ` + (e.message || e), 'error');
      showGuildLoadError(currentGuildId, e.message || 'Network error communicating with bot gateway.');
    }
  }

  // =========================================================
  // SAVE / DISCARD CHANGES ENGINE
  // =========================================================

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (isSaving || !isDirty()) return;
      if (!currentGuildId) {
        showToast('Please select a server first.', 'error');
        return;
      }

      isSaving = true;
      saveBtn.disabled = true;
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = `<img src="${EMOJI.loading}" class="discord-emoji small"> Saving...`;

      const baseUrl = getApiBaseUrl();

      try {
        const res = await apiFetch(`${baseUrl}/guild/${currentGuildId}/config`, {
          method: 'POST',
          body: JSON.stringify({ config: currentState })
        });

        if (res.ok) {
          savedState = deepClone(currentState);
          if (activeGuildData) {
            activeGuildData.config = deepClone(currentState);
          }
          updateDirtyUI();
          showToast('Configuration synchronized with Discord & Flarex gateway!', 'success');
          
          // Refresh activities and stats to show configuration save event
          fetchGuildActivity(currentGuildId);
          setSyncStatus('synced');
        } else {
          const errData = await res.json().catch(() => ({}));
          showToast(errData.error || `Failed to save configuration (HTTP ${res.status}).`, 'error');
          setSyncStatus('failed');
        }
      } catch (e) {
        showToast('Error communicating with server: ' + (e.message || e), 'error');
        setSyncStatus('failed');
      } finally {
        isSaving = false;
        saveBtn.disabled = !isDirty();
        saveBtn.innerHTML = originalText;
      }
    });
  }

  if (discardBtn) {
    discardBtn.addEventListener('click', () => {
      currentState = deepClone(savedState);
      populateForm(currentState);
      updateDirtyUI();
      showToast('Changes discarded.', 'warning');
    });
  }

  // Live Discord Preview Rendering
  const welcomeTitleInput = document.getElementById('welcomeEmbedTitle');
  const welcomeDescInput = document.getElementById('welcomeEmbedDesc');
  const welcomeColorInput = document.getElementById('welcomeEmbedColor');
  const welcomeFooterInput = document.getElementById('welcomeEmbedFooter');

  const previewTitle = document.getElementById('previewEmbedTitle');
  const previewDesc = document.getElementById('previewEmbedDesc');
  const previewEmbedCard = document.getElementById('previewEmbedCard');
  const previewFooter = document.getElementById('previewEmbedFooter');

  function renderLiveDiscordPreview() {
    const sName = activeGuildData ? activeGuildData.name : 'Your Server';
    const sMembers = activeGuildData ? (activeGuildData.member_count || 0).toLocaleString() : '1,250';
    const uName = currentUser ? (currentUser.global_name || currentUser.username) : 'Member';
    const uMention = currentUser ? `@${currentUser.username}` : '@Member';

    const formatText = (text) => {
      if (!text) return '';
      return text
        .replace(/{user\.mention}/g, uMention)
        .replace(/{user\.name}/g, uName)
        .replace(/{server\.name}/g, sName)
        .replace(/{server\.member_count}/g, sMembers)
        .replace(/{created_at}/g, 'Today at 12:34 PM');
    };

    if (previewTitle && welcomeTitleInput) previewTitle.textContent = formatText(welcomeTitleInput.value);
    if (previewDesc && welcomeDescInput) previewDesc.textContent = formatText(welcomeDescInput.value);
    if (previewEmbedCard && welcomeColorInput) previewEmbedCard.style.borderLeftColor = welcomeColorInput.value;
    if (previewFooter && welcomeFooterInput) previewFooter.textContent = formatText(welcomeFooterInput.value);
  }

  // Dynamic Tag Inserter Chips
  const tagChips = document.querySelectorAll('.tag-chip[data-target]');
  tagChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const targetInput = document.getElementById(chip.getAttribute('data-target'));
      const tag = chip.getAttribute('data-tag');
      if (targetInput && tag) {
        const start = targetInput.selectionStart || targetInput.value.length;
        const end = targetInput.selectionEnd || targetInput.value.length;
        const text = targetInput.value;
        targetInput.value = text.substring(0, start) + tag + text.substring(end);
        targetInput.focus();
        targetInput.setSelectionRange(start + tag.length, start + tag.length);
        
        if (targetInput.hasAttribute('data-model')) {
          setNestedValue(currentState, targetInput.getAttribute('data-model'), targetInput.value);
        }
        renderLiveDiscordPreview();
        updateDirtyUI();
      }
    });
  });

  // Emergency Panic Room Action
  const panicBtn = document.getElementById('triggerPanicBtn');
  if (panicBtn) {
    panicBtn.addEventListener('click', async () => {
      const sName = activeGuildData ? activeGuildData.name : 'this server';
      const confirmPanic = confirm(`🚨 ACTIVATE EMERGENCY PANIC MODE FOR ${sName.toUpperCase()}?\n\nThis will immediately lock all invites, lock channel permissions, freeze server roles, and restrict all non-whitelisted actions.`);
      if (confirmPanic) {
        try {
          const baseUrl = getApiBaseUrl();
          const res = await apiFetch(`${baseUrl}/guild/${currentGuildId}/panic`, { method: 'POST' });
          if (res.ok) {
            showToast('🚨 PANIC MODE ENGAGED! Server locked down.', 'ban');
            panicBtn.innerHTML = `<img src="${EMOJI.ban}" class="discord-emoji"> 🔒 PANIC ENGAGED (LOCKED)`;
            panicBtn.classList.remove('btn-danger');
            panicBtn.classList.add('btn-primary');
          } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || 'Failed to activate panic mode on Discord.', 'error');
          }
        } catch (e) {
          showToast('Failed to trigger emergency panic mode: ' + (e.message || e), 'error');
        }
      }
    });
  }

  // Quick Action & Tab Navigation Links
  const gotoElements = document.querySelectorAll('[data-goto]');
  gotoElements.forEach(el => {
    el.addEventListener('click', () => {
      const target = el.getAttribute('data-goto');
      if (target) switchTab(target);
    });
  });

  // Modal Open / Close Logic
  function closeModals() {
    if (searchModal) searchModal.classList.remove('open');
    if (serverPickerModal) serverPickerModal.classList.remove('open');
    if (authLoginModal) authLoginModal.classList.remove('open');
    if (hostSettingsModal) hostSettingsModal.classList.remove('open');
    if (ticketPanelModal) ticketPanelModal.classList.remove('open');
    if (levelRewardModal) levelRewardModal.classList.remove('open');
    if (giveawayModal) giveawayModal.classList.remove('open');
    if (warnTierModal) warnTierModal.classList.remove('open');
    if (reactionRoleModal) reactionRoleModal.classList.remove('open');
    if (trialConfirmModal) trialConfirmModal.classList.remove('open');
    if (posterLightboxModal) posterLightboxModal.classList.remove('open');
    if (whitelistModal) whitelistModal.classList.remove('open');
    if (assignRoleModal) assignRoleModal.classList.remove('open');
    if (addBannedWordModal) addBannedWordModal.classList.remove('open');
  }

  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', closeModals);
  });

  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModals();
    });
  });

  openSearchBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (searchModal) {
        searchModal.classList.add('open');
        const input = document.getElementById('searchModalInput');
        if (input) { input.value = ''; input.focus(); }
      }
    });
  });

  openServerPickerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (serverPickerModal) {
        serverPickerModal.classList.add('open');
        renderServerPicker();
      }
    });
  });

  if (userProfilePill) {
    userProfilePill.addEventListener('click', () => {
      if (authLoginModal) authLoginModal.classList.add('open');
    });
  }

  const openHostSettingsBtns = document.querySelectorAll('.trigger-host-settings');
  openHostSettingsBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (hostSettingsModal) {
        const urlInput = document.getElementById('hostApiUrlInput');
        if (urlInput) urlInput.value = localStorage.getItem('flarex_remote_bot_url') || '/api';
        hostSettingsModal.classList.add('open');
      }
    });
  });

  // Test Host Ping & Latency
  const testHostPingBtn = document.getElementById('testHostPingBtn');
  const pingResultBadge = document.getElementById('pingResultBadge');
  if (testHostPingBtn) {
    testHostPingBtn.addEventListener('click', async () => {
      const urlInput = document.getElementById('hostApiUrlInput');
      let target = (urlInput ? urlInput.value.trim() : '') || '/api';
      target = target.replace(/\/$/, '');

      if (pingResultBadge) {
        pingResultBadge.textContent = '● Pinging...';
        pingResultBadge.style.color = '#fbbf24';
        pingResultBadge.style.background = 'rgba(251, 191, 36, 0.15)';
      }

      try {
        const t0 = performance.now();
        const res = await apiFetch(`${target}/bot/status`);
        const latency = Math.round(performance.now() - t0);

        if (res.ok) {
          if (pingResultBadge) {
            pingResultBadge.textContent = `✓ Connected (${latency}ms)`;
            pingResultBadge.style.color = '#4ade80';
            pingResultBadge.style.background = 'rgba(74, 222, 128, 0.15)';
          }
          showToast(`Host online: ${latency}ms latency`, 'success');
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (err) {
        if (pingResultBadge) {
          pingResultBadge.textContent = '✕ Unreachable';
          pingResultBadge.style.color = '#f87171';
          pingResultBadge.style.background = 'rgba(239, 68, 68, 0.15)';
        }
        showToast('Could not reach remote bot host: ' + (err.message || err), 'error');
      }
    });
  }

  const saveHostConfigBtn = document.getElementById('saveHostConfigBtn');
  if (saveHostConfigBtn) {
    saveHostConfigBtn.addEventListener('click', () => {
      const urlInput = document.getElementById('hostApiUrlInput');
      const targetUrl = urlInput ? urlInput.value.trim() : '';

      if (targetUrl) {
        localStorage.setItem('flarex_remote_bot_url', targetUrl);
      } else {
        localStorage.removeItem('flarex_remote_bot_url');
      }

      closeModals();
      showToast('Bot host settings updated!', 'settings');
      loadInitialData();
    });
  }

  const presetCloudflareBtn = document.getElementById('presetCloudflareBtn') || document.getElementById('presetVercelBtn');
  const presetLocalBtn = document.getElementById('presetLocalBtn');
  if (presetCloudflareBtn) {
    presetCloudflareBtn.addEventListener('click', () => {
      const urlInput = document.getElementById('hostApiUrlInput');
      if (urlInput) urlInput.value = '/api';
    });
  }
  if (presetLocalBtn) {
    presetLocalBtn.addEventListener('click', () => {
      const urlInput = document.getElementById('hostApiUrlInput');
      if (urlInput) urlInput.value = 'http://localhost:8080';
    });
  }

  // =========================================================
  // TICKET PANEL & LEVEL REWARD MODAL SUBMISSION HANDLERS
  // =========================================================

  const addNewTicketPanelBtn = document.getElementById('addNewTicketPanelBtn');
  if (addNewTicketPanelBtn) {
    addNewTicketPanelBtn.addEventListener('click', openAddTicketPanelModal);
  }

  const saveTicketPanelModalBtn = document.getElementById('saveTicketPanelModalBtn');
  if (saveTicketPanelModalBtn) {
    saveTicketPanelModalBtn.addEventListener('click', () => {
      const idVal = document.getElementById('ticketPanelIdInput').value;
      const name = document.getElementById('ticketPanelNameInput').value.trim();
      const emoji = document.getElementById('ticketPanelEmojiInput').value.trim() || '🎫';
      const roleSelect = document.getElementById('ticketPanelRoleSelect');
      const roleId = roleSelect ? roleSelect.value : '';
      const roleName = roleSelect && roleSelect.selectedIndex >= 0 ? roleSelect.options[roleSelect.selectedIndex].text : '';
      const channelSelect = document.getElementById('ticketPanelChannelSelect');
      const channelId = channelSelect ? channelSelect.value : '';
      const catSelect = document.getElementById('ticketPanelCategorySelect');
      const catId = catSelect ? catSelect.value : '';
      const enabled = document.getElementById('ticketPanelActiveCheckbox').checked;

      if (!name) {
        showToast('Please enter a panel category name.', 'warning');
        return;
      }

      if (!currentState.tickets) {
        currentState.tickets = { enabled: true, panels: [] };
      }
      if (!currentState.tickets.panels) currentState.tickets.panels = [];

      if (idVal) {
        const id = Number(idVal);
        const existing = currentState.tickets.panels.find(x => Number(x.id) === id);
        if (existing) {
          existing.name = name;
          existing.emoji = emoji;
          existing.enabled = enabled;
          existing.channel_id = channelId;
          existing.category_id = catId;
          if (roleId) {
            existing.support_roles = [roleId];
            existing.role = roleName;
          }
        }
      } else {
        const maxId = currentState.tickets.panels.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0);
        const newId = maxId + 1;
        currentState.tickets.panels.push({
          id: newId,
          name: name,
          emoji: emoji,
          role: roleName || 'None',
          support_roles: roleId ? [roleId] : [],
          channel_id: channelId,
          category_id: catId,
          ticket_limit: 1,
          rating_survey: true,
          enabled: enabled
        });
      }

      currentState.tickets.enabled = currentState.tickets.panels.some(x => x.enabled);
      renderTicketPanels(currentState.tickets.panels);
      closeModals();
      updateDirtyUI();
      showToast('Ticket panel updated! Click "Save Changes" to apply.', 'success');
    });
  }

  const addNewLevelRewardBtn = document.getElementById('addNewLevelRewardBtn');
  if (addNewLevelRewardBtn) {
    addNewLevelRewardBtn.addEventListener('click', openAddLevelRewardModal);
  }

  const saveLevelRewardModalBtn = document.getElementById('saveLevelRewardModalBtn');
  if (saveLevelRewardModalBtn) {
    saveLevelRewardModalBtn.addEventListener('click', () => {
      const idxVal = document.getElementById('levelRewardIndexInput').value;
      const level = parseInt(document.getElementById('levelRewardLevelInput').value, 10);
      const roleSelect = document.getElementById('levelRewardRoleSelect');
      const roleId = roleSelect ? roleSelect.value : '';
      const roleName = roleSelect && roleSelect.selectedIndex >= 0 ? roleSelect.options[roleSelect.selectedIndex].text : '';

      if (isNaN(level) || level < 1) {
        showToast('Please enter a valid target level (>= 1).', 'warning');
        return;
      }
      if (!roleId) {
        showToast('Please select a role to reward.', 'warning');
        return;
      }

      if (!currentState.leveling) {
        currentState.leveling = { enabled: true, rewards: [] };
      }
      if (!currentState.leveling.rewards) currentState.leveling.rewards = [];

      if (idxVal !== '') {
        const idx = Number(idxVal);
        if (currentState.leveling.rewards[idx]) {
          currentState.leveling.rewards[idx] = { level, role: roleName, role_id: roleId };
        }
      } else {
        currentState.leveling.rewards.push({ level, role: roleName, role_id: roleId });
      }

      currentState.leveling.rewards.sort((a, b) => a.level - b.level);
      renderLevelingRewards(currentState.leveling.rewards);
      closeModals();
      updateDirtyUI();
      showToast('Role milestone updated! Click "Save Changes" to apply.', 'success');
    });
  }

  // =========================================================
  // GIVEAWAY MODAL SUBMISSION HANDLERS
  // =========================================================

  const launchGiveawayBtn = document.getElementById('launchGiveawayBtn');
  if (launchGiveawayBtn) {
    launchGiveawayBtn.addEventListener('click', openAddGiveawayModal);
  }

  const saveGiveawayModalBtn = document.getElementById('saveGiveawayModalBtn');
  if (saveGiveawayModalBtn) {
    saveGiveawayModalBtn.addEventListener('click', async () => {
      if (!currentGuildId) {
        showToast('Please select a server first.', 'warning');
        return;
      }

      const prize = document.getElementById('giveawayPrizeInput').value.trim();
      const duration = document.getElementById('giveawayDurationInput').value.trim();
      const winners = parseInt(document.getElementById('giveawayWinnersInput').value, 10) || 1;
      const channelSelect = document.getElementById('giveawayChannelSelect');
      const channel_id = channelSelect ? channelSelect.value : '';
      const roleSelect = document.getElementById('giveawayRequiredRoleSelect');
      const required_role = roleSelect ? roleSelect.value : '';
      const min_level = parseInt(document.getElementById('giveawayMinLevelInput').value, 10) || 0;

      if (!prize) {
        showToast('Please enter a giveaway prize.', 'warning');
        return;
      }
      if (!duration) {
        showToast('Please enter a duration (e.g. 1d, 12h, 30m).', 'warning');
        return;
      }

      saveGiveawayModalBtn.disabled = true;
      const originalText = saveGiveawayModalBtn.innerHTML;
      saveGiveawayModalBtn.innerHTML = `<img src="${EMOJI.loading}" class="discord-emoji small"> Launching...`;

      const baseUrl = getApiBaseUrl();
      const headers = getApiHeaders();

      try {
        const res = await apiFetch(`${baseUrl}/guild/${currentGuildId}/giveaway/create`, {
          method: 'POST',
          body: JSON.stringify({
            prize,
            duration,
            winners,
            channel_id,
            required_role,
            min_level
          })
        });

        if (res.ok) {
          closeModals();
          showToast(`Giveaway for "${prize}" launched on Discord!`, 'success');
          
          // Refresh config to get the new giveaway in the list
          try {
            const cfgRes = await apiFetch(`${baseUrl}/guild/${currentGuildId}/config`);
            if (cfgRes.ok) {
              const data = await cfgRes.json();
              if (data.config && data.config.giveaways) {
                if (!currentState.giveaways) currentState.giveaways = { enabled: true, list: [] };
                currentState.giveaways.list = data.config.giveaways.list || [];
                renderGiveaways(currentState.giveaways.list);
              }
            } else {
              showToast(`Failed to refresh giveaways (HTTP ${cfgRes.status}).`, 'warning');
            }
          } catch (e) {
            showToast('Failed to refresh giveaways: ' + (e.message || e), 'warning');
          }

          fetchGuildActivity(currentGuildId);
        } else {
          const errData = await res.json().catch(() => ({}));
          showToast(errData.error || `Failed to launch giveaway (HTTP ${res.status}).`, 'error');
        }
      } catch (err) {
        showToast('Error communicating with bot: ' + (err.message || err), 'error');
      } finally {
        saveGiveawayModalBtn.disabled = false;
        saveGiveawayModalBtn.innerHTML = originalText;
      }
    });
  }

  // =========================================================
  // WARN TIER & REACTION ROLE MODAL SUBMISSION HANDLERS
  // =========================================================

  const addWarnTierBtn = document.getElementById('addWarnTierBtn');
  if (addWarnTierBtn) {
    addWarnTierBtn.addEventListener('click', openAddWarnTierModal);
  }

  const saveWarnTierModalBtn = document.getElementById('saveWarnTierModalBtn');
  if (saveWarnTierModalBtn) {
    saveWarnTierModalBtn.addEventListener('click', () => {
      const warns = parseInt(document.getElementById('warnTierThresholdInput').value, 10);
      const action = document.getElementById('warnTierActionSelect').value;
      const duration = document.getElementById('warnTierDurationInput').value.trim() || '5m';

      if (isNaN(warns) || warns < 1) {
        showToast('Please enter a valid warning threshold (>= 1).', 'warning');
        return;
      }

      if (!currentState.warn_config) {
        currentState.warn_config = { enabled: true, decay_days: 30, default_reason: 'Violation of server rules', tiers: [] };
      }
      if (!currentState.warn_config.tiers) currentState.warn_config.tiers = [];

      const existingIdx = currentState.warn_config.tiers.findIndex(t => Number(t.warns || t.threshold) === warns);
      if (existingIdx >= 0) {
        currentState.warn_config.tiers[existingIdx] = { warns, threshold: warns, action, duration };
      } else {
        currentState.warn_config.tiers.push({ warns, threshold: warns, action, duration });
      }

      currentState.warn_config.tiers.sort((a, b) => (Number(a.warns || a.threshold) - Number(b.warns || b.threshold)));
      renderWarnTiers(currentState.warn_config.tiers);
      closeModals();
      updateDirtyUI();
      showToast('Warning escalation tier updated! Click "Save Changes" to apply.', 'success');
    });
  }

  const addReactionRoleBtn = document.getElementById('addReactionRoleBtn');
  if (addReactionRoleBtn) {
    addReactionRoleBtn.addEventListener('click', openAddReactionRoleModal);
  }

  const saveReactionRoleModalBtn = document.getElementById('saveReactionRoleModalBtn');
  if (saveReactionRoleModalBtn) {
    saveReactionRoleModalBtn.addEventListener('click', () => {
      const channelSelect = document.getElementById('reactionRoleChannelSelect');
      const channel_id = channelSelect ? channelSelect.value : '';
      const message_id = document.getElementById('reactionRoleMessageIdInput').value.trim();
      const emoji = document.getElementById('reactionRoleEmojiInput').value.trim() || '⭐';
      const roleSelect = document.getElementById('reactionRoleRoleSelect');
      const role_id = roleSelect ? roleSelect.value : '';
      const role_name = roleSelect && roleSelect.selectedIndex >= 0 ? roleSelect.options[roleSelect.selectedIndex].text : '';
      const mode = document.getElementById('reactionRoleModeSelect').value || 'toggle';

      if (!role_id) {
        showToast('Please select a role to assign.', 'warning');
        return;
      }

      if (!currentState.reaction_roles) {
        currentState.reaction_roles = { enabled: true, entries: [] };
      }
      if (!currentState.reaction_roles.entries) currentState.reaction_roles.entries = [];

      currentState.reaction_roles.entries.push({
        channel_id: channel_id || (activeGuildData && activeGuildData.channels && activeGuildData.channels[0] ? activeGuildData.channels[0].id : ''),
        message_id: message_id || String(Date.now()),
        emoji,
        role_id,
        role_name: role_name.replace(/^@/, ''),
        mode
      });

      renderReactionRoles(currentState.reaction_roles.entries);
      closeModals();
      updateDirtyUI();
      showToast('Reaction role binding added! Click "Save Changes" to apply.', 'success');
    });
  }

  const refreshCasesBtn = document.getElementById('refreshCasesBtn');
  if (refreshCasesBtn) {
    refreshCasesBtn.addEventListener('click', async () => {
      if (!currentGuildId) {
        showToast('Please select a server first.', 'warning');
        return;
      }
      showToast('Refreshing moderation cases...', 'loading');
      const baseUrl = getApiBaseUrl();
      try {
        const res = await apiFetch(`${baseUrl}/guild/${currentGuildId}/config`);
        if (res.ok) {
          const data = await res.json();
          const cases = (data.config && data.config.cases && data.config.cases.recent_cases) || [];
          if (currentState && currentState.cases) {
            currentState.cases.recent_cases = cases;
          }
          renderCases(cases);
          showToast('Moderation cases refreshed.', 'success');
        } else {
          showToast(`Failed to refresh cases (HTTP ${res.status}).`, 'warning');
        }
      } catch (e) {
        showToast('Error refreshing cases: ' + (e.message || e), 'warning');
      }
    });
  }

  // =========================================================
  // WHITELIST & AUTOROLE MODAL SUBMISSION HANDLERS
  // =========================================================

  const addNewWhitelistBtn = document.getElementById('addNewWhitelistBtn');
  if (addNewWhitelistBtn) {
    addNewWhitelistBtn.addEventListener('click', () => openAddWhitelistModal(-1));
  }

  const saveWhitelistModalBtn = document.getElementById('saveWhitelistModalBtn');
  if (saveWhitelistModalBtn) {
    saveWhitelistModalBtn.addEventListener('click', () => {
      const editIdx = parseInt(document.getElementById('whitelistEditIndex').value, 10);
      const name = document.getElementById('whitelistNameInput').value.trim();
      const id = document.getElementById('whitelistIdInput').value.trim();
      const designation = document.getElementById('whitelistDesignationSelect').value;
      const scope = document.getElementById('whitelistScopeSelect').value;

      if (!id) {
        showToast('Please enter a valid Discord User ID or Role ID.', 'warning');
        return;
      }
      if (!name) {
        showToast('Please enter a display name for this whitelist entry.', 'warning');
        return;
      }

      if (!currentState) currentState = deepClone(savedState) || getDefaultConfig();
      if (!currentState.antinuke) {
        currentState.antinuke = { enabled: true, whitelist: [] };
      }
      if (!currentState.antinuke.whitelist) currentState.antinuke.whitelist = [];

      const newEntry = { id, name, designation, scope };

      if (editIdx >= 0 && currentState.antinuke.whitelist[editIdx]) {
        currentState.antinuke.whitelist[editIdx] = newEntry;
      } else {
        currentState.antinuke.whitelist.push(newEntry);
      }

      renderWhitelists(currentState.antinuke.whitelist);
      closeModals();
      updateDirtyUI();
      showToast('Whitelisted user/bot updated! Click "Save Changes" to apply.', 'success');
    });
  }

  const addNewAutoroleBtn = document.getElementById('addNewAutoroleBtn');
  if (addNewAutoroleBtn) {
    addNewAutoroleBtn.addEventListener('click', openAssignRoleModal);
  }

  const saveAssignRoleModalBtn = document.getElementById('saveAssignRoleModalBtn');
  if (saveAssignRoleModalBtn) {
    saveAssignRoleModalBtn.addEventListener('click', () => {
      const select = document.getElementById('assignRoleSelect');
      const roleId = select ? select.value : '';
      const roleName = select && select.selectedIndex >= 0 ? select.options[select.selectedIndex].text : '';

      if (!roleId) {
        showToast('Please select a role from the list.', 'warning');
        return;
      }

      if (!currentState) currentState = deepClone(savedState) || getDefaultConfig();
      if (!currentState.welcomer) {
        currentState.welcomer = { enabled: true, autoroles: [] };
      }
      if (!currentState.welcomer.autoroles) currentState.welcomer.autoroles = [];

      if (!currentState.welcomer.autoroles.includes(roleId)) {
        currentState.welcomer.autoroles.push(roleId);
        renderAutoroles(currentState.welcomer.autoroles);
        closeModals();
        updateDirtyUI();
        showToast(`Added ${roleName} to join auto-roles! Click "Save Changes" to apply.`, 'success');
      } else {
        showToast('This role is already assigned in auto-roles.', 'warning');
      }
    });
  }

  // =========================================================
  // BANNED WORDS & COMMAND DIRECTORY EVENT LISTENERS
  // =========================================================

  const addBannedWordBtn = document.getElementById('addBannedWordBtn');
  if (addBannedWordBtn) {
    addBannedWordBtn.addEventListener('click', openAddBannedWordModal);
  }

  const saveBannedWordModalBtn = document.getElementById('saveBannedWordModalBtn');
  if (saveBannedWordModalBtn) {
    saveBannedWordModalBtn.addEventListener('click', saveBannedWord);
  }

  const newBannedWordInput = document.getElementById('newBannedWordInput');
  if (newBannedWordInput) {
    newBannedWordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveBannedWord();
      }
    });
  }

  const cmdDirectorySearchInput = document.getElementById('cmdDirectorySearchInput');
  if (cmdDirectorySearchInput) {
    cmdDirectorySearchInput.addEventListener('input', (e) => {
      const q = (e.target.value || '').toLowerCase().trim();
      const mult = (currentState && currentState.command_access && currentState.command_access.cooldown_multiplier) || 1.0;
      renderCommandDirectory(mult, q);
    });
  }

  // =========================================================
  // FLAREX PREMIUM ENGINE & SUBSCRIPTION MANAGER
  // =========================================================

  let premiumData = null;
  let countdownIntervalId = null;

  function formatTimeRemaining(seconds) {
    if (seconds <= 0) return '0d 0h 0m 0s';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  }

  function startCountdown(remainingSeconds, expiryTimestamp) {
    if (countdownIntervalId) {
      clearInterval(countdownIntervalId);
      countdownIntervalId = null;
    }

    const countdownText = document.getElementById('premiumCountdownText');
    const timerBox = document.getElementById('premiumTimerBox');
    const expiryDateText = document.getElementById('premiumExpiryDateText');

    if (!timerBox) return;

    if (!remainingSeconds || remainingSeconds <= 0) {
      timerBox.style.display = 'none';
      return;
    }

    timerBox.style.display = 'block';

    if (expiryDateText && expiryTimestamp) {
      const expDate = new Date(expiryTimestamp * 1000);
      expiryDateText.textContent = `Expires: ${expDate.toLocaleDateString()} at ${expDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    let currentSec = remainingSeconds;
    if (countdownText) {
      countdownText.textContent = formatTimeRemaining(currentSec);
    }

    countdownIntervalId = setInterval(() => {
      currentSec--;
      if (currentSec <= 0) {
        clearInterval(countdownIntervalId);
        countdownIntervalId = null;
        if (countdownText) countdownText.textContent = 'Expired';
        if (premiumData) {
          premiumData.is_active = false;
          premiumData.trial_available = false;
          premiumData.trial_used = true;
          updatePremiumUI(premiumData);
        }
        showToast('Your 7-day free trial has expired.', 'warning');
      } else {
        if (countdownText) countdownText.textContent = formatTimeRemaining(currentSec);
      }
    }, 1000);
  }

  function updatePremiumUI(data) {
    const sName = activeGuildData ? activeGuildData.name : 'Current Server';
    const serverNameEl = document.getElementById('premiumServerNameText');
    if (serverNameEl) serverNameEl.textContent = sName;

    const tierTitleEl = document.getElementById('premiumCurrentTierTitle');
    const statusBadgeEl = document.getElementById('premiumStatusBadge');
    const statusIndicatorEl = document.getElementById('premiumStatusIndicator');
    const statusDetailsEl = document.getElementById('premiumStatusDetails');
    const claimHeroBtn = document.getElementById('claimTrialHeroBtn');
    const claimGoldBtn = document.getElementById('claimGoldTierBtn');
    const goldTrialBadge = document.getElementById('goldTrialBadge');

    // Sidebar & Header & Overview elements
    const sidebarPlanVal = document.getElementById('sidebarPlanVal');
    const headerPremiumBtnText = document.getElementById('headerPremiumBtnText');
    const overviewGuildTitle = document.getElementById('overviewPremiumGuildTitle');
    const overviewBadge = document.getElementById('overviewPremiumBadge');
    const overviewDesc = document.getElementById('overviewPremiumDesc');
    const overviewClaimBtn = document.getElementById('overviewClaimTrialBtn');

    if (!data || !data.is_active) {
      // Free / Expired State
      const isExpired = Boolean(data && data.trial_used);
      if (tierTitleEl) tierTitleEl.textContent = isExpired ? 'Free Plan (Trial Expired)' : 'Free Plan';
      if (statusBadgeEl) {
        statusBadgeEl.textContent = isExpired ? 'TRIAL EXPIRED' : 'STANDARD';
        statusBadgeEl.style.background = isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)';
        statusBadgeEl.style.color = isExpired ? '#f87171' : 'var(--text-secondary)';
      }
      if (statusIndicatorEl) {
        statusIndicatorEl.style.background = isExpired ? '#f87171' : 'var(--text-muted)';
        statusIndicatorEl.style.boxShadow = 'none';
      }
      if (statusDetailsEl) {
        statusDetailsEl.textContent = isExpired
          ? 'Your 7-day free trial has expired. Upgrade your server to Diamond or Obsidian to unlock unlimited power.'
          : 'No active subscription for this server. Start your 7-day free trial or upgrade to unlock elite perks.';
      }

      // Sidebar Right
      if (sidebarPlanVal) {
        sidebarPlanVal.textContent = isExpired ? 'Free (Trial Expired)' : 'Free Plan';
        sidebarPlanVal.style.color = isExpired ? 'var(--text-muted)' : '#facc15';
      }

      // Header Button
      if (headerPremiumBtnText) {
        headerPremiumBtnText.textContent = isExpired ? 'Upgrade' : 'Free Trial';
      }

      // Overview Banner
      if (overviewGuildTitle) {
        overviewGuildTitle.textContent = `${sName} • Premium Engine`;
      }
      if (overviewBadge) {
        overviewBadge.textContent = isExpired ? 'TRIAL EXPIRED' : '7-DAY FREE TRIAL';
        overviewBadge.style.background = isExpired ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.2)';
        overviewBadge.style.color = isExpired ? '#f87171' : '#facc15';
      }
      if (overviewDesc) {
        overviewDesc.textContent = isExpired
          ? 'Your 7-day trial has ended. Upgrade to Diamond or Obsidian for unrestricted server power and backups.'
          : 'Unlock 24/7 Music Uptime, +5 Limits Boost, 1.25x XP Multiplier & No-Prefix Mode with 1-click.';
      }
      if (overviewClaimBtn) {
        if (isExpired) {
          overviewClaimBtn.innerHTML = '✕ Trial Used';
          overviewClaimBtn.disabled = true;
          overviewClaimBtn.style.opacity = '0.6';
          overviewClaimBtn.style.cursor = 'not-allowed';
        } else {
          overviewClaimBtn.innerHTML = '⚡ Start 7-Day Free Trial';
          overviewClaimBtn.disabled = false;
          overviewClaimBtn.style.opacity = '1';
          overviewClaimBtn.style.cursor = 'pointer';
        }
      }

      // Button states in Premium Tab
      if (isExpired) {
        if (claimHeroBtn) {
          claimHeroBtn.innerHTML = '✕ Trial Already Used';
          claimHeroBtn.disabled = true;
          claimHeroBtn.style.opacity = '0.6';
          claimHeroBtn.style.cursor = 'not-allowed';
        }
        if (claimGoldBtn) {
          claimGoldBtn.innerHTML = '✕ Trial Used';
          claimGoldBtn.disabled = true;
          claimGoldBtn.style.opacity = '0.6';
          claimGoldBtn.style.cursor = 'not-allowed';
        }
        if (goldTrialBadge) {
          goldTrialBadge.textContent = 'TRIAL USED';
          goldTrialBadge.style.background = 'rgba(239,68,68,0.15)';
          goldTrialBadge.style.color = '#f87171';
        }
      } else {
        if (claimHeroBtn) {
          claimHeroBtn.innerHTML = '⚡ Start 7-Day Free Trial';
          claimHeroBtn.disabled = false;
          claimHeroBtn.style.opacity = '1';
          claimHeroBtn.style.cursor = 'pointer';
        }
        if (claimGoldBtn) {
          claimGoldBtn.innerHTML = 'Start 7-Day Free Trial';
          claimGoldBtn.disabled = false;
          claimGoldBtn.style.opacity = '1';
          claimGoldBtn.style.cursor = 'pointer';
        }
        if (goldTrialBadge) {
          goldTrialBadge.textContent = '7-DAY TRIAL AVAILABLE';
          goldTrialBadge.style.background = 'rgba(234, 179, 8, 0.2)';
          goldTrialBadge.style.color = '#facc15';
        }
      }

      startCountdown(0, null);
      return;
    }

    // Active Subscription / Trial State
    const tierName = (data.plan_name || data.subscription || 'Gold').toUpperCase();
    const isTrial = Boolean(data.is_trial);

    if (tierTitleEl) {
      tierTitleEl.innerHTML = isTrial 
        ? `<span style="color: var(--accent-copper-light);">Gold Tier</span> <span style="font-size: 14px; color: var(--text-secondary);">(7-Day Free Trial)</span>`
        : `<span style="color: ${tierName.includes('OBSIDIAN') ? '#F3E6D8' : tierName.includes('DIAMOND') ? 'var(--accent-copper-light)' : 'var(--accent-copper)'};">${escapeHtml(data.plan_name || tierName)}</span>`;
    }

    if (statusBadgeEl) {
      statusBadgeEl.textContent = isTrial ? '7-DAY TRIAL ACTIVE' : 'PREMIUM ACTIVE';
      statusBadgeEl.style.background = isTrial ? 'rgba(184, 137, 99, 0.25)' : 'rgba(74, 222, 128, 0.2)';
      statusBadgeEl.style.color = isTrial ? 'var(--accent-copper-light)' : '#4ade80';
    }

    if (statusIndicatorEl) {
      statusIndicatorEl.style.background = isTrial ? 'var(--accent-copper-light)' : '#4ade80';
      statusIndicatorEl.style.boxShadow = isTrial ? '0 0 10px rgba(184, 137, 99, 0.7)' : '0 0 10px rgba(74, 222, 128, 0.7)';
    }

    if (statusDetailsEl) {
      statusDetailsEl.innerHTML = `Active perks: <strong>+${data.limits_boost || 5} Limits Boost</strong>, <strong>${data.xp_multiplier || 1.25}x XP</strong>, <strong>${data.cooldown_multiplier || 0.5}x Cooldowns</strong>, 24/7 Voice Stay, and No-Prefix mode.`;
    }

    // Sidebar Right
    if (sidebarPlanVal) {
      sidebarPlanVal.textContent = isTrial ? 'Gold (7-Day Trial)' : (data.plan_name || tierName);
      sidebarPlanVal.style.color = isTrial ? 'var(--accent-copper-light)' : tierName.includes('OBSIDIAN') ? '#F3E6D8' : tierName.includes('DIAMOND') ? 'var(--accent-copper-light)' : 'var(--status-online)';
    }

    // Header Button
    if (headerPremiumBtnText) {
      headerPremiumBtnText.textContent = isTrial ? 'Gold Trial' : (data.plan_name || 'Active');
    }

    // Overview Banner
    if (overviewGuildTitle) {
      overviewGuildTitle.textContent = `${sName} • ${isTrial ? 'Gold Trial Active' : (data.plan_name || 'Premium Active')}`;
    }
    if (overviewBadge) {
      overviewBadge.textContent = isTrial ? '7-DAY TRIAL ACTIVE' : 'PRO ACTIVE';
      overviewBadge.style.background = isTrial ? 'rgba(184, 137, 99, 0.25)' : 'rgba(74, 222, 128, 0.2)';
      overviewBadge.style.color = isTrial ? 'var(--accent-copper-light)' : '#4ade80';
    }
    if (overviewDesc) {
      overviewDesc.innerHTML = `Server currently has <strong>+${data.limits_boost || 5} Limits Boost</strong>, <strong>${data.xp_multiplier || 1.25}x XP Multiplier</strong>, and <strong>24/7 Music Stay</strong> active.`;
    }
    if (overviewClaimBtn) {
      overviewClaimBtn.innerHTML = '✓ Active on Server';
      overviewClaimBtn.disabled = true;
      overviewClaimBtn.style.opacity = '0.85';
      overviewClaimBtn.style.cursor = 'default';
    }

    if (claimHeroBtn) {
      claimHeroBtn.innerHTML = '✓ Gold Trial Active';
      claimHeroBtn.disabled = true;
      claimHeroBtn.style.opacity = '0.85';
      claimHeroBtn.style.cursor = 'default';
    }

    startCountdown(data.remaining_seconds, data.subscription_end);

    // Sync Command Access speed and rate limits with premium tier
    updateCommandAccessTierUI();
    const activeCooldownMult = (currentState && currentState.command_access && currentState.command_access.cooldown_multiplier) || data.cooldown_multiplier || 1.0;
    renderCommandDirectory(activeCooldownMult);
  }

  async function fetchPremiumStatus(guildId) {
    if (!guildId) return null;
    const baseUrl = getApiBaseUrl();

    try {
      const res = await apiFetch(`${baseUrl}/guild/${guildId}/premium`);
      if (res.ok) {
        premiumData = await res.json();
        updatePremiumUI(premiumData);
        return premiumData;
      }
    } catch (e) {
      console.warn('Failed to fetch premium status:', e);
    }
    return null;
  }

  function openTrialConfirmModal() {
    if (!currentGuildId) {
      showToast('Please select a server first.', 'warning');
      return;
    }

    if (premiumData && premiumData.is_active) {
      showToast('This server already has an active premium subscription.', 'crown');
      return;
    }

    if (premiumData && premiumData.trial_used) {
      showToast('The free trial has already been used on this server.', 'warning');
      return;
    }

    const modalGuildName = document.getElementById('trialModalGuildName');
    if (modalGuildName) {
      modalGuildName.textContent = activeGuildData ? activeGuildData.name : 'Selected Server';
    }

    if (trialConfirmModal) {
      trialConfirmModal.classList.add('open');
    }
  }

  async function executeClaimTrial() {
    if (!currentGuildId) {
      showToast('Please select a server first.', 'warning');
      return;
    }

    const confirmBtn = document.getElementById('confirmStartTrialBtn');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `<img src="${EMOJI.loading}" class="discord-emoji small"> Activating...`;
    }

    const baseUrl = getApiBaseUrl();

    try {
      const res = await apiFetch(`${baseUrl}/guild/${currentGuildId}/premium/trial`, {
        method: 'POST'
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        closeModals();
        showToast('🎉 7-day Gold Trial activated successfully!', 'crown');
        await fetchPremiumStatus(currentGuildId);
        // Also refresh guild config to sync updated limits
        await performSync(false);
      } else {
        showToast(data.error || `Could not activate trial (HTTP ${res.status}).`, 'error');
      }
    } catch (e) {
      showToast('Error activating trial: ' + (e.message || e), 'error');
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = 'Confirm &amp; Activate';
      }
    }
  }

  // Lightbox handlers for Gold, Diamond & Obsidian posters
  function openPosterLightbox(type) {
    if (!posterLightboxModal) return;
    const imgEl = document.getElementById('lightboxPosterImg');
    const captionEl = document.getElementById('lightboxPosterCaption');

    if (type === 'unified' || !type) {
      if (imgEl) {
        imgEl.src = 'assets/premium_tiers_poster.jpg';
        imgEl.alt = 'Flarex Premium Plans: Gold Trial, Diamond Tier 1, and Obsidian Tier 2';
      }
      if (captionEl) {
        captionEl.innerHTML = '<strong>Flarex Premium Tiers</strong> • Gold (Trial Experience), Diamond (Tier 1 - Core Premium), and Obsidian (Tier 2 - The Ultimate Experience)';
      }
    } else if (type === 'gold') {
      if (imgEl) {
        imgEl.src = 'assets/gold_poster.png';
        imgEl.alt = 'Flarex Premium Trial Tier: Gold Edition Artwork';
      }
      if (captionEl) {
        captionEl.innerHTML = '<strong>Flarex Trial Tier: Gold (The Trial Experience)</strong> • XP Boost (1.25x), Cooldowns (0.50x / 2x Faster), Limits (+5 Slots), Moderation, Automation &amp; Welcomer';
      }
    } else if (type === 'diamond') {
      if (imgEl) {
        imgEl.src = 'assets/diamond_poster.jpg';
        imgEl.alt = 'Flarex Tier 1: Diamond Edition Artwork';
      }
      if (captionEl) {
        captionEl.innerHTML = '<strong>Flarex Tier 1: Diamond (Core Premium)</strong> • XP Boost (1.5x), Cooldowns (0.25x), Limits (+20), Greetings &amp; Music Engine';
      }
    } else if (type === 'obsidian') {
      if (imgEl) {
        imgEl.src = 'assets/obsidian_poster.jpg';
        imgEl.alt = 'Flarex Tier 2: Obsidian Edition Artwork';
      }
      if (captionEl) {
        captionEl.innerHTML = '<strong>Flarex Tier 2: Obsidian (The Ultimate Experience)</strong> • XP Boost (2.0x), Cooldowns (0.1x), Limits (+50), Custom Avatar/Footer &amp; Ghost Mode';
      }
    }

    posterLightboxModal.classList.add('open');
  }

  // Premium Button Event Listeners
  const claimTrialHeroBtn = document.getElementById('claimTrialHeroBtn');
  if (claimTrialHeroBtn) {
    claimTrialHeroBtn.addEventListener('click', openTrialConfirmModal);
  }

  const overviewClaimTrialBtn = document.getElementById('overviewClaimTrialBtn');
  if (overviewClaimTrialBtn) {
    overviewClaimTrialBtn.addEventListener('click', openTrialConfirmModal);
  }

  // Handle all .trigger-gold-trial-btn
  document.querySelectorAll('.trigger-gold-trial-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openTrialConfirmModal();
    });
  });

  const headerPremiumQuickBtn = document.getElementById('headerPremiumQuickBtn');
  if (headerPremiumQuickBtn) {
    headerPremiumQuickBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('premium');
    });
  }

  const sidebarTierRow = document.getElementById('sidebarTierRow');
  if (sidebarTierRow) {
    sidebarTierRow.addEventListener('click', () => {
      switchTab('premium');
    });
  }

  const confirmStartTrialBtn = document.getElementById('confirmStartTrialBtn');
  if (confirmStartTrialBtn) {
    confirmStartTrialBtn.addEventListener('click', executeClaimTrial);
  }

  const openPremiumTiersPosterBtn = document.getElementById('openPremiumTiersPosterBtn');
  if (openPremiumTiersPosterBtn) {
    openPremiumTiersPosterBtn.addEventListener('click', () => openPosterLightbox('unified'));
  }

  const openGoldPosterBtn = document.getElementById('openGoldPosterBtn');
  if (openGoldPosterBtn) {
    openGoldPosterBtn.addEventListener('click', () => openPosterLightbox('gold'));
  }

  const openDiamondPosterBtn = document.getElementById('openDiamondPosterBtn');
  if (openDiamondPosterBtn) {
    openDiamondPosterBtn.addEventListener('click', () => openPosterLightbox('diamond'));
  }

  const openObsidianPosterBtn = document.getElementById('openObsidianPosterBtn');
  if (openObsidianPosterBtn) {
    openObsidianPosterBtn.addEventListener('click', () => openPosterLightbox('obsidian'));
  }

  // =========================================================
  // DISCORD OAUTH2 & AUTHENTICATION
  // =========================================================

  function getDiscordClientId() {
    if (botConfiguredClientId && botConfiguredClientId !== '123456789012345678') return botConfiguredClientId;
    const custom = localStorage.getItem('flarex_discord_client_id');
    if (custom && custom.trim().length > 5 && custom.trim() !== '123456789012345678') return custom.trim();
    return '1525310645031931904';
  }

  function getDiscordRedirectUri() {
    return window.location.origin + window.location.pathname;
  }

  function loginWithDiscordOAuth() {
    const baseUrl = getApiBaseUrl();
    showToast('Redirecting to Discord Authorization...', 'loading');
    window.location.href = `${baseUrl}/auth/login`;
  }

  async function logoutDiscord() {
    try {
      const baseUrl = getApiBaseUrl();
      await apiFetch(`${baseUrl}/auth/logout`, {
        method: 'POST'
      });
    } catch (e) {}

    currentUser = null;
    allGuilds = [];
    currentGuildId = null;
    activeGuildData = null;
    savedState = null;
    currentState = null;

    updateAuthUI();
    renderServerPicker();
    updateDirtyUI();
    showToast('Signed out of Discord successfully.', 'error');
    if (authLoginModal) authLoginModal.classList.add('open');
  }

  function updateAuthUI() {
    const navLoggedOut = document.getElementById('navUserLoggedOut');
    const navLoggedIn = document.getElementById('navUserLoggedIn');
    const navAvatarImg = navLoggedIn ? navLoggedIn.querySelector('.user-avatar-img') : null;
    const navNameSpan = navLoggedIn ? navLoggedIn.querySelector('.user-name') : null;
    const navBadgeSpan = document.getElementById('userServerCountBadge');

    const authLoggedOutView = document.getElementById('authLoggedOutView');
    const authLoggedInView = document.getElementById('authLoggedInView');
    const modalAvatar = document.getElementById('modalUserAvatar');
    const modalGlobalName = document.getElementById('modalUserGlobalName');
    const modalHandle = document.getElementById('modalUserHandle');
    const modalIdBadge = document.getElementById('modalUserIdBadge');
    const modalGuildsCount = document.getElementById('modalUserGuildsCount');
    const authBoxTitle = document.getElementById('authBoxTitle');
    const authBoxDesc = document.getElementById('authBoxDesc');
    const redirectTextEl = document.getElementById('currentRedirectUriText');
    if (redirectTextEl) redirectTextEl.textContent = getDiscordRedirectUri();

    if (currentUser) {
      if (navLoggedOut) navLoggedOut.style.display = 'none';
      if (navLoggedIn) navLoggedIn.style.display = 'flex';
      if (navAvatarImg) navAvatarImg.src = currentUser.avatar;
      if (navNameSpan) navNameSpan.textContent = currentUser.global_name || currentUser.username;
      if (navBadgeSpan) navBadgeSpan.textContent = `${allGuilds.length} Servers`;

      if (authLoggedOutView) authLoggedOutView.style.display = 'none';
      if (authLoggedInView) authLoggedInView.style.display = 'block';
      if (modalAvatar) modalAvatar.src = currentUser.avatar;
      if (modalGlobalName) modalGlobalName.textContent = currentUser.global_name || currentUser.username;
      if (modalHandle) modalHandle.textContent = `@${currentUser.username}`;
      if (modalIdBadge) modalIdBadge.textContent = `ID: ${currentUser.id}`;
      if (modalGuildsCount) modalGuildsCount.textContent = `${allGuilds.length} Permitted Server${allGuilds.length === 1 ? '' : 's'}`;

      if (authBoxTitle) authBoxTitle.textContent = 'Account Synchronized';
      if (authBoxDesc) authBoxDesc.textContent = `Signed in as @${currentUser.username}. Only servers where you have Administrator or Server Owner permissions are displayed.`;
    } else {
      if (navLoggedOut) navLoggedOut.style.display = 'flex';
      if (navLoggedIn) navLoggedIn.style.display = 'none';

      if (authLoggedOutView) authLoggedOutView.style.display = 'block';
      if (authLoggedInView) authLoggedInView.style.display = 'none';

      if (authBoxTitle) authBoxTitle.textContent = 'Sign in with Discord';
      if (authBoxDesc) authBoxDesc.textContent = 'Connect your real Discord account to locate your servers. Only servers where you hold Administrator or Server Owner permissions will be visible.';
    }
  }

  const discordOAuthBtn = document.getElementById('discordOAuthBtn');
  if (discordOAuthBtn) {
    discordOAuthBtn.addEventListener('click', loginWithDiscordOAuth);
  }

  const copyRedirectUriBtn = document.getElementById('copyRedirectUriBtn');
  if (copyRedirectUriBtn) {
    copyRedirectUriBtn.addEventListener('click', () => {
      const uri = getDiscordRedirectUri();
      navigator.clipboard.writeText(uri).then(() => {
        showToast('Redirect URI copied to clipboard!', 'success');
      }).catch((err) => {
        showToast(`URI: ${uri}`, 'crown');
      });
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutDiscord);
  }

  async function syncDiscordServers() {
    if (!currentUser) {
      showToast('Please sign in with Discord first to sync servers.', 'error');
      if (authLoginModal) authLoginModal.classList.add('open');
      return;
    }
    const syncBtn = document.getElementById('syncGuildsModalBtn');
    if (syncBtn) {
      syncBtn.disabled = true;
      syncBtn.innerHTML = `<img src="${EMOJI.loading}" class="discord-emoji small"> Syncing...`;
    }
    showToast('Syncing Discord servers with Flarex...', 'loading');
    try {
      const baseUrl = getApiBaseUrl();
      const res = await apiFetch(`${baseUrl}/guilds?sync=true`);
      if (res.ok) {
        const data = await res.json();
        allGuilds = data.guilds || [];
        updateAuthUI();
        renderServerPicker();
        showToast(`✨ Synchronized ${allGuilds.length} Discord servers!`, 'success');
        if (allGuilds.length > 0 && !currentGuildId) {
          const activeServer = allGuilds.find(g => g.bot_present) || allGuilds[0];
          if (activeServer) selectGuild(activeServer.id);
        }
      } else {
        showToast(`Failed to sync servers (HTTP ${res.status})`, 'error');
      }
    } catch (e) {
      showToast('Error syncing servers: ' + (e.message || e), 'error');
    } finally {
      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.innerHTML = `<img src="${EMOJI.success}" class="discord-emoji small"> Sync Servers`;
      }
    }
  }

  const syncGuildsModalBtn = document.getElementById('syncGuildsModalBtn');
  if (syncGuildsModalBtn) {
    syncGuildsModalBtn.addEventListener('click', syncDiscordServers);
  }

  document.querySelectorAll('.server-filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.server-filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderServerPicker(tab.getAttribute('data-filter'));
    });
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (searchModal) searchModal.classList.add('open');
    }
    if (e.key === 'Escape') closeModals();
  });

  const searchInput = document.getElementById('searchModalInput');
  const searchResults = document.getElementById('searchResults');
  const searchableItems = [
    { title: 'Server Overview & Vitals', desc: 'Real-time activity feed, member counts, and quick actions', tab: 'overview', emoji: EMOJI.settings },
    { title: 'Flarex Premium Hub', desc: 'Manage subscriptions, claim 7-day free trial, and explore tiers', tab: 'premium', emoji: EMOJI.crown },
    { title: 'Raid Protection & Lockdown', desc: 'Join burst rate limits, lockdown modes, auto-kick new accounts', tab: 'raid', emoji: EMOJI.antinuke },
    { title: 'Antinuke Panic Shield', desc: 'Real-time guild protection, rate limits, panic lockdown room', tab: 'antinuke', emoji: EMOJI.antinuke },
    { title: 'Automod Word Filter', desc: 'Manage banned phrases, slurs, invite detection, and spam caps', tab: 'automod', emoji: EMOJI.automod },
    { title: 'Warn Config & Escalation', desc: 'Warning decay periods and progressive auto-punishment ladders', tab: 'warn_config', emoji: EMOJI.automod },
    { title: 'Jail & Isolation Chamber', desc: 'Quarantine members, strip/restore roles, sentence durations', tab: 'jail', emoji: EMOJI.automod },
    { title: 'Member Verification Gate', desc: 'Interactive button or CAPTCHA validation and auto-kick timers', tab: 'verification', emoji: EMOJI.welcomer },
    { title: 'Welcomer & Embed Studio', desc: 'Arrival messages, canvas cards, autoroles, and goodbye alerts', tab: 'welcomer', emoji: EMOJI.welcomer },
    { title: 'Reaction & Button Roles', desc: 'Assign and toggle roles with emoji reactions or button menus', tab: 'reaction_roles', emoji: EMOJI.roles },
    { title: 'Starboard Showcase', desc: 'Community spotlight channel and star reaction thresholds', tab: 'starboard', emoji: EMOJI.roles },
    { title: 'Leveling & XP Rewards', desc: 'Set XP multipliers, rank cards, and role milestone rewards', tab: 'leveling', emoji: EMOJI.leveling },
    { title: 'Music Voice Engine', desc: '24/7 Voice channel, filters, equalizer, and DJ permissions', tab: 'music', emoji: EMOJI.music },
    { title: 'Economy & Mini-Games', desc: 'Casino payouts, robbery rates, work cooldowns, and server shop', tab: 'economy', emoji: EMOJI.economy },
    { title: 'Ticket Panels & Transcripts', desc: 'Support categories, staff roles, and rating surveys', tab: 'tickets', emoji: EMOJI.tickets },
    { title: 'Giveaways Hub', desc: 'Launch giveaways with role and account age requirements', tab: 'giveaways', emoji: EMOJI.giveaways },
    { title: 'Server Audit Logs & Webhooks', desc: 'Route incident, voice, message, and security audit logs', tab: 'logs', emoji: EMOJI.logs },
    { title: 'Command Access & Permissions', desc: 'Disable specific commands server-wide and manage admin bypass', tab: 'command_access', emoji: EMOJI.staff },
    { title: 'Moderation Cases & Modlogs', desc: 'Live mod cases, reason enforcement, and automated DM alerts', tab: 'cases', emoji: EMOJI.logs },
    { title: 'Staff Roles & Permissions', desc: 'Manage admin, mod, and bypass permissions hierarchy', tab: 'staff', emoji: EMOJI.staff },
    { title: 'General Bot Settings', desc: 'Prefix configuration, colors, timezone, and server nickname', tab: 'settings', emoji: EMOJI.settings }
  ];

  function renderSearchResults(query) {
    if (!searchResults) return;
    const q = query.toLowerCase().trim();
    const filtered = searchableItems.filter(item => 
      item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
      searchResults.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted);">No matching modules or settings found.</div>`;
      return;
    }

    searchResults.innerHTML = filtered.map(item => `
      <div class="search-result-item" data-goto="${escapeHtml(item.tab)}">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${item.emoji}" class="discord-emoji" alt="icon">
          <div>
            <div style="color: var(--text-primary); font-weight: 600; font-size: 13.5px;">${escapeHtml(item.title)}</div>
            <div style="color: var(--text-muted); font-size: 11.5px;">${escapeHtml(item.desc)}</div>
          </div>
        </div>
        <span style="color: var(--accent-copper); font-size: 13px;">➔</span>
      </div>
    `).join('');

    searchResults.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const tab = el.getAttribute('data-goto');
        closeModals();
        if (tab) switchTab(tab);
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => renderSearchResults(e.target.value));
  }

  function drawServerChart() {
    const canvas = document.getElementById('serverStatsCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    const data = [60, 48, 85, 65, 110, 80, 125];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxVal = 150;
    const minVal = 0;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(223, 155, 109, 0.08)';
    ctx.lineWidth = 1;
    [0.2, 0.5, 0.8].forEach(yFrac => {
      ctx.beginPath();
      ctx.moveTo(30, h * yFrac);
      ctx.lineTo(w - 10, h * yFrac);
      ctx.stroke();
    });

    const paddingLeft = 30;
    const paddingRight = 15;
    const paddingTop = 12;
    const paddingBottom = 22;

    const chartW = w - paddingLeft - paddingRight;
    const chartH = h - paddingTop - paddingBottom;

    const points = data.map((val, idx) => {
      const x = paddingLeft + (idx / (data.length - 1)) * chartW;
      const y = paddingTop + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;
      return { x, y, val, label: labels[idx] };
    });

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mx = (p0.x + p1.x) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, mx, (p0.y + p1.y) / 2);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

    ctx.strokeStyle = '#df9b6d';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.lineTo(points[points.length - 1].x, h - paddingBottom);
    ctx.lineTo(points[0].x, h - paddingBottom);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, paddingTop, 0, h - paddingBottom);
    grad.addColorStop(0, 'rgba(223, 155, 109, 0.25)');
    grad.addColorStop(1, 'rgba(223, 155, 109, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#df9b6d';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#73655b';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, p.x, h - 6);
    });
  }

  // =========================================================
  // INITIALIZATION
  // =========================================================

  async function loadInitialData() {
    initModelEventHandlers();

    const baseUrl = getApiBaseUrl();

    // 1. Fetch Dynamic Emojis
    try {
      const emojiRes = await apiFetch(`${baseUrl}/emojis`);
      if (emojiRes.ok) {
        const emojiData = await emojiRes.json();
        if (emojiData.emojis) {
          Object.assign(EMOJI, emojiData.emojis);
        }
      }
    } catch (e) {}

    // 2. Fetch Bot Client ID
    try {
      const authCfgRes = await apiFetch(`${baseUrl}/auth/config`);
      if (authCfgRes.ok) {
        const authCfg = await authCfgRes.json();
        if (authCfg.client_id) {
          botConfiguredClientId = authCfg.client_id;
        }
      }
    } catch (e) {}

    // 3. Verify Server-Side Session via GET /api/auth/me
    try {
      const meRes = await apiFetch(`${baseUrl}/auth/me`);
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.authenticated && meData.user) {
          currentUser = meData.user;
          // Fetch user's permitted guilds
          const guildsRes = await apiFetch(`${baseUrl}/guilds`);
          if (guildsRes.ok) {
            const gData = await guildsRes.json();
            allGuilds = gData.guilds || [];
          }
        }
      } else {
        currentUser = null;
        allGuilds = [];
      }
    } catch (e) {
      currentUser = null;
      allGuilds = [];
    }

    updateAuthUI();
    renderServerPicker();
    drawServerChart();

    // Check URL parameters for auth errors
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get('auth_error');
    if (authError) {
      showToast(decodeURIComponent(authError).replace(/_/g, " ") || "Discord authentication failed. Please try logging in again.", "error");
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }

    // 4. Initial Sync with Bot Gateway
    await performSync(false);

    // 5. Select active server
    if (allGuilds && allGuilds.length > 0) {
      const activeServer = allGuilds.find(g => g.bot_present) || allGuilds[0];
      if (activeServer) {
        selectGuild(activeServer.id);
      }
    } else {
      const defaultCfg = getDefaultConfig();
      savedState = deepClone(defaultCfg);
      currentState = deepClone(defaultCfg);
      populateForm(currentState);
      updateDirtyUI();

      if (!currentUser) {
        setTimeout(() => {
          if (authLoginModal) authLoginModal.classList.add('open');
        }, 600);
      }
    }
  }

  // Initialize Engine
  loadInitialData();
});
