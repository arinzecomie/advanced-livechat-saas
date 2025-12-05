# 🔊 Real-Time Features Implementation Guide

## 🎯 Overview
This guide provides comprehensive implementation for advanced real-time features including visitor arrival sound alerts, magic typing sneak peek, and browser-compliant audio handling for the Advanced Live Chat SaaS platform.

---

## 🔧 Technology Stack

### Backend Dependencies
```bash
npm install howler node-audiorecorder wav audio-context-polyfill
```

### Frontend Dependencies
```bash
npm install howler lodash.debounce throttle-debounce
```

---

## 🔊 Step 1: Sound Architecture Implementation

### 1.1 Browser-Compliant Audio Service
```javascript
// frontend/src/services/AudioService.js
import { Howl, Howler } from 'howler';

class AudioService {
  constructor() {
    this.sounds = {};
    this.isInitialized = false;
    this.audioContext = null;
    this.continuousOscillator = null;
    this.continuousGain = null;
    this.userInteracted = false;
    
    // Sound configurations
    this.soundConfigs = {
      visitorArrival: {
        src: ['/sounds/visitor-arrival.mp3'],
        volume: 0.7,
        preload: true,
        loop: false
      },
      newMessage: {
        src: ['/sounds/new-message.mp3'],
        volume: 0.5,
        preload: true,
        loop: false
      },
      typingIndicator: {
        src: ['/sounds/typing.mp3'],
        volume: 0.3,
        preload: true,
        loop: false
      },
      continuousBeep: {
        frequency: 800,
        volume: 0.1,
        type: 'sine'
      }
    };
    
    this.initializeAudioContext();
    this.setupUserInteractionHandlers();
  }

  initializeAudioContext() {
    // Create Web Audio Context for advanced audio features
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  setupUserInteractionHandlers() {
    // Browser requires user interaction before playing audio
    const handleFirstInteraction = async () => {
      if (!this.userInteracted) {
        this.userInteracted = true;
        
        // Resume audio context if suspended
        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        
        // Initialize Howler sounds
        this.initializeSounds();
        
        // Remove event listeners after first interaction
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
      }
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
  }

  initializeSounds() {
    // Initialize Howl sounds
    Object.keys(this.soundConfigs).forEach(soundName => {
      const config = this.soundConfigs[soundName];
      
      if (config.src) {
        this.sounds[soundName] = new Howl({
          src: config.src,
          volume: config.volume,
          preload: config.preload,
          loop: config.loop,
          html5: true // Use HTML5 Audio for better performance
        });
      }
    });
    
    this.isInitialized = true;
  }

  async playSound(soundName, options = {}) {
    if (!this.isInitialized || !this.userInteracted) {
      console.warn('Audio not initialized or user has not interacted');
      return false;
    }

    const { 
      loop = false, 
      volume = 1.0, 
      continuous = false,
      frequency = null 
    } = options;

    try {
      if (continuous && frequency) {
        // Play continuous tone using Web Audio API
        this.startContinuousTone(frequency, volume);
      } else if (this.sounds[soundName]) {
        // Play preloaded sound
        const sound = this.sounds[soundName];
        sound.volume(volume);
        sound.loop(loop);
        
        // Stop any existing playback and play from beginning
        sound.stop();
        sound.play();
      } else {
        console.warn(`Sound ${soundName} not found`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error playing sound:', error);
      return false;
    }
  }

  startContinuousTone(frequency, volume) {
    if (!this.audioContext) return false;

    // Stop any existing continuous tone
    this.stopContinuousTone();

    try {
      // Create oscillator for continuous tone
      this.continuousOscillator = this.audioContext.createOscillator();
      this.continuousGain = this.audioContext.createGain();

      // Configure oscillator
      this.continuousOscillator.type = 'sine';
      this.continuousOscillator.frequency.setValueAtTime(
        frequency, 
        this.audioContext.currentTime
      );

      // Configure gain (volume)
      this.continuousGain.gain.setValueAtTime(
        volume * 0.1, // Scale down for comfort
        this.audioContext.currentTime
      );

      // Connect nodes
      this.continuousOscillator.connect(this.continuousGain);
      this.continuousGain.connect(this.audioContext.destination);

      // Start the tone
      this.continuousOscillator.start();
      
      return true;
    } catch (error) {
      console.error('Error starting continuous tone:', error);
      return false;
    }
  }

  stopContinuousTone() {
    if (this.continuousOscillator) {
      try {
        this.continuousOscillator.stop();
        this.continuousOscillator = null;
        this.continuousGain = null;
      } catch (error) {
        console.error('Error stopping continuous tone:', error);
      }
    }
  }

  stopSound(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].stop();
    }
    
    if (soundName === 'continuousBeep') {
      this.stopContinuousTone();
    }
  }

  setVolume(soundName, volume) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].volume(volume);
    }
  }

  fadeOut(soundName, duration = 1000) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].fade(
        this.sounds[soundName].volume(), 
        0, 
        duration
      );
      
      setTimeout(() => {
        this.stopSound(soundName);
      }, duration);
    }
  }

  // Check if audio is supported and available
  isAudioSupported() {
    return !!(window.AudioContext || window.webkitAudioContext || window.Audio);
  }

  // Get current audio context state
  getAudioContextState() {
    return this.audioContext ? this.audioContext.state : 'not-supported';
  }

  // Cleanup method
  destroy() {
    this.stopContinuousTone();
    
    Object.values(this.sounds).forEach(sound => {
      sound.unload();
    });
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export default new AudioService();
```

### 1.2 Admin Sound Settings Component
```javascript
// frontend/src/components/Admin/AdminSoundSettings.jsx
import React, { useState, useEffect } from 'react';
import { FaVolumeUp, FaVolumeMute, FaCog } from 'react-icons/fa';
import AudioService from '../../services/AudioService';

const AdminSoundSettings = () => {
  const [settings, setSettings] = useState({
    visitorArrival: {
      enabled: true,
      type: 'continuous', // 'continuous' | 'beep' | 'off'
      volume: 0.7,
      frequency: 800
    },
    newMessage: {
      enabled: true,
      volume: 0.5
    },
    typingIndicator: {
      enabled: false,
      volume: 0.3
    }
  });
  
  const [audioSupported, setAudioSupported] = useState(true);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    // Check audio support
    const supported = AudioService.isAudioSupported();
    setAudioSupported(supported);
    
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('adminSoundSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('adminSoundSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const testSound = (soundType) => {
    if (!audioSupported) {
      alert('Audio is not supported in your browser');
      return;
    }

    const config = settings[soundType];
    if (!config.enabled) {
      alert(`${soundType} sounds are disabled`);
      return;
    }

    if (soundType === 'visitorArrival' && config.type === 'continuous') {
      if (testMode) {
        AudioService.stopContinuousTone();
        setTestMode(false);
      } else {
        AudioService.startContinuousTone(config.frequency, config.volume);
        setTestMode(true);
        
        // Auto-stop after 3 seconds
        setTimeout(() => {
          AudioService.stopContinuousTone();
          setTestMode(false);
        }, 3000);
      }
    } else {
      AudioService.playSound(soundType, { volume: config.volume });
    }
  };

  if (!audioSupported) {
    return (
      <div className="sound-settings unsupported">
        <FaVolumeMute />
        <p>Audio notifications are not supported in your browser</p>
      </div>
    );
  }

  return (
    <div className="sound-settings">
      <div className="settings-header">
        <FaCog />
        <h3>Sound Notifications</h3>
      </div>

      <div className="setting-group">
        <div className="setting-title">
          <FaVolumeUp />
          <span>Visitor Arrival Alert</span>
        </div>
        
        <div className="setting-controls">
          <label>
            <input
              type="checkbox"
              checked={settings.visitorArrival.enabled}
              onChange={(e) => updateSetting('visitorArrival', 'enabled', e.target.checked)}
            />
            Enable
          </label>
          
          <select
            value={settings.visitorArrival.type}
            onChange={(e) => updateSetting('visitorArrival', 'type', e.target.value)}
            disabled={!settings.visitorArrival.enabled}
          >
            <option value="off">Off</option>
            <option value="beep">Short Beep</option>
            <option value="continuous">Continuous Loop</option>
          </select>
          
          <div className="volume-control">
            <label>Volume: {Math.round(settings.visitorArrival.volume * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.visitorArrival.volume}
              onChange={(e) => updateSetting('visitorArrival', 'volume', parseFloat(e.target.value))}
              disabled={!settings.visitorArrival.enabled}
            />
          </div>
          
          {settings.visitorArrival.type === 'continuous' && (
            <div className="frequency-control">
              <label>Frequency: {settings.visitorArrival.frequency}Hz</label>
              <input
                type="range"
                min="400"
                max="1200"
                step="50"
                value={settings.visitorArrival.frequency}
                onChange={(e) => updateSetting('visitorArrival', 'frequency', parseInt(e.target.value))}
                disabled={!settings.visitorArrival.enabled}
              />
            </div>
          )}
          
          <button
            onClick={() => testSound('visitorArrival')}
            className={`test-button ${testMode ? 'active' : ''}`}
            disabled={!settings.visitorArrival.enabled}
          >
            {testMode ? 'Stop Test' : 'Test Sound'}
          </button>
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-title">
          <FaVolumeUp />
          <span>New Message Alert</span>
        </div>
        
        <div className="setting-controls">
          <label>
            <input
              type="checkbox"
              checked={settings.newMessage.enabled}
              onChange={(e) => updateSetting('newMessage', 'enabled', e.target.checked)}
            />
            Enable
          </label>
          
          <div className="volume-control">
            <label>Volume: {Math.round(settings.newMessage.volume * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.newMessage.volume}
              onChange={(e) => updateSetting('newMessage', 'volume', parseFloat(e.target.value))}
              disabled={!settings.newMessage.enabled}
            />
          </div>
          
          <button
            onClick={() => testSound('newMessage')}
            className="test-button"
            disabled={!settings.newMessage.enabled}
          >
            Test Sound
          </button>
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-title">
          <FaVolumeUp />
          <span>Typing Indicator</span>
        </div>
        
        <div className="setting-controls">
          <label>
            <input
              type="checkbox"
              checked={settings.typingIndicator.enabled}
              onChange={(e) => updateSetting('typingIndicator', 'enabled', e.target.checked)}
            />
            Enable
          </label>
          
          <div className="volume-control">
            <label>Volume: {Math.round(settings.typingIndicator.volume * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.typingIndicator.volume}
              onChange={(e) => updateSetting('typingIndicator', 'volume', parseFloat(e.target.value))}
              disabled={!settings.typingIndicator.enabled}
            />
          </div>
          
          <button
            onClick={() => testSound('typingIndicator')}
            className="test-button"
            disabled={!settings.typingIndicator.enabled}
          >
            Test Sound
          </button>
        </div>
      </div>

      <div className="audio-status">
        <p>Audio Context: {AudioService.getAudioContextState()}</p>
      </div>
    </div>
  );
};

export default AdminSoundSettings;
```

### 1.3 Backend Sound Event Handler
```javascript
// backend/services/SoundService.js
class SoundService {
  constructor() {
    this.adminSoundSettings = new Map(); // Store per-admin settings
    this.activeAlerts = new Map(); // Track active alerts
  }

  async handleVisitorArrival(siteId, visitorData) {
    try {
      // Get online admins for this site
      const onlineAdmins = await this.getOnlineAdmins(siteId);
      
      for (const admin of onlineAdmins) {
        const settings = await this.getAdminSoundSettings(admin.id);
        
        if (settings.visitorArrival.enabled) {
          const alertData = {
            type: 'visitor_arrival',
            visitorId: visitorData.visitorId,
            settings: {
              type: settings.visitorArrival.type,
              volume: settings.visitorArrival.volume,
              frequency: settings.visitorArrival.frequency
            }
          };
          
          // Send sound alert to specific admin
          this.sendSoundAlert(admin.socketId, alertData);
          
          // Track active alert
          this.activeAlerts.set(`${admin.id}-${visitorData.visitorId}`, {
            adminId: admin.id,
            visitorId: visitorData.visitorId,
            startTime: Date.now(),
            settings: alertData.settings
          });
        }
      }
    } catch (error) {
      console.error('Failed to handle visitor arrival sound:', error);
    }
  }

  async getAdminSoundSettings(adminId) {
    // Default settings
    const defaultSettings = {
      visitorArrival: {
        enabled: true,
        type: 'continuous',
        volume: 0.7,
        frequency: 800
      },
      newMessage: {
        enabled: true,
        volume: 0.5
      },
      typingIndicator: {
        enabled: false,
        volume: 0.3
      }
    };
    
    // Get from database or cache
    const savedSettings = await AdminSettingsModel.getSoundSettings(adminId);
    return savedSettings || defaultSettings;
  }

  sendSoundAlert(socketId, alertData) {
    const io = global.io;
    if (io && socketId) {
      io.to(socketId).emit('sound_alert', alertData);
    }
  }

  async stopVisitorAlert(adminId, visitorId) {
    const alertKey = `${adminId}-${visitorId}`;
    const alert = this.activeAlerts.get(alertKey);
    
    if (alert) {
      const io = global.io;
      const admin = await this.getAdminById(adminId);
      
      if (admin && admin.socketId) {
        io.to(admin.socketId).emit('stop_sound_alert', {
          type: 'visitor_arrival',
          visitorId: visitorId
        });
      }
      
      this.activeAlerts.delete(alertKey);
    }
  }

  async getOnlineAdmins(siteId) {
    // Implementation to get online admins for a site
    const admins = await AdminModel.findOnlineBySite(siteId);
    return admins.filter(admin => admin.socketId && admin.isOnline);
  }
}

module.exports = SoundService;
```

---

## 👁️ Step 2: Magic Typing Sneak Peek Implementation

### 2.1 Socket.IO Typing Preview Events
```javascript
// backend/services/TypingPreviewService.js
const { debounce } = require('lodash');

class TypingPreviewService {
  constructor() {
    this.typingPreviews = new Map(); // Store current typing previews
    this.debounceDelays = {
      preview: 100,  // Send preview updates every 100ms
      clear: 1000    // Clear preview after 1s of inactivity
    };
  }

  handleTypingPreview(socket) {
    // Handle incoming typing preview from client
    socket.on('typing_preview', debounce((data) => {
      this.processTypingPreview(socket, data);
    }, this.debounceDelays.preview));

    // Handle typing stop
    socket.on('stop_typing_preview', (data) => {
      this.clearTypingPreview(socket, data);
    });

    // Handle socket disconnection
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  processTypingPreview(socket, data) {
    const { siteId, sessionId, text, isAdmin, senderId, senderName } = data;
    
    if (!siteId || !sessionId || text === undefined) {
      return;
    }

    const previewKey = `${sessionId}-${isAdmin ? 'admin' : 'visitor'}`;
    const timestamp = Date.now();

    // Store typing preview
    this.typingPreviews.set(previewKey, {
      sessionId,
      text: text.substring(0, 200), // Limit preview length
      isAdmin,
      senderId,
      senderName,
      timestamp,
      socketId: socket.id
    });

    // Determine target audience
    const targetEvent = isAdmin ? 'admin_typing_preview' : 'visitor_typing_preview';
    const room = `site_${siteId}`;

    // Broadcast to appropriate audience
    const io = global.io;
    if (io) {
      // Don't send preview back to sender
      socket.to(room).emit(targetEvent, {
        sessionId,
        text: text.substring(0, 200),
        isAdmin,
        senderId,
        senderName,
        timestamp
      });
    }

    // Set up auto-clear
    this.schedulePreviewClear(previewKey, siteId, sessionId, isAdmin);
  }

  schedulePreviewClear(previewKey, siteId, sessionId, isAdmin) {
    // Clear any existing timer
    if (this.clearTimers && this.clearTimers[previewKey]) {
      clearTimeout(this.clearTimers[previewKey]);
    }

    // Schedule new clear timer
    const timer = setTimeout(() => {
      this.clearTypingPreviewByKey(previewKey, siteId, sessionId, isAdmin);
    }, this.debounceDelays.clear);

    if (!this.clearTimers) this.clearTimers = {};
    this.clearTimers[previewKey] = timer;
  }

  clearTypingPreview(socket, data) {
    const { siteId, sessionId, isAdmin } = data;
    const previewKey = `${sessionId}-${isAdmin ? 'admin' : 'visitor'}`;
    
    this.clearTypingPreviewByKey(previewKey, siteId, sessionId, isAdmin);
  }

  clearTypingPreviewByKey(previewKey, siteId, sessionId, isAdmin) {
    // Remove from storage
    this.typingPreviews.delete(previewKey);
    
    // Clear timer
    if (this.clearTimers && this.clearTimers[previewKey]) {
      clearTimeout(this.clearTimers[previewKey]);
      delete this.clearTimers[previewKey];
    }

    // Notify clients to clear preview
    const targetEvent = isAdmin ? 'admin_typing_cleared' : 'visitor_typing_cleared';
    const room = `site_${siteId}`;
    
    const io = global.io;
    if (io) {
      io.to(room).emit(targetEvent, {
        sessionId,
        isAdmin,
        clearedAt: Date.now()
      });
    }
  }

  handleDisconnect(socket) {
    // Clean up typing previews from disconnected socket
    const disconnectedPreviews = [];
    
    this.typingPreviews.forEach((preview, key) => {
      if (preview.socketId === socket.id) {
        disconnectedPreviews.push({ key, preview });
      }
    });

    // Clear previews from disconnected user
    disconnectedPreviews.forEach(({ key, preview }) => {
      this.clearTypingPreviewByKey(
        key, 
        preview.siteId, 
        preview.sessionId, 
        preview.isAdmin
      );
    });
  }

  getTypingPreviews(siteId, sessionId = null) {
    const previews = [];
    
    this.typingPreviews.forEach((preview) => {
      if (preview.siteId === siteId) {
        if (!sessionId || preview.sessionId === sessionId) {
          previews.push(preview);
        }
      }
    });
    
    return previews;
  }

  // Throttle typing preview updates to prevent spam
  throttleTypingPreview(socket, data) {
    const throttleKey = `${data.siteId}-${data.sessionId}-${data.isAdmin}`;
    
    if (!this.throttleTimers) this.throttleTimers = {};
    
    // Clear existing throttle
    if (this.throttleTimers[throttleKey]) {
      clearTimeout(this.throttleTimers[throttleKey]);
    }
    
    // Set new throttle
    this.throttleTimers[throttleKey] = setTimeout(() => {
      this.processTypingPreview(socket, data);
      delete this.throttleTimers[throttleKey];
    }, 100); // 100ms throttle
  }
}

module.exports = TypingPreviewService;
```

### 2.2 Frontend Typing Preview Hook
```javascript
// frontend/src/hooks/useTypingPreview.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';

const useTypingPreview = (socket, sessionId, isAdmin = false) => {
  const [typingPreviews, setTypingPreviews] = useState(new Map());
  const [ownTypingText, setOwnTypingText] = useState('');
  const typingTimer = useRef(null);
  const lastSentText = useRef('');

  // Send typing preview with debouncing
  const sendTypingPreview = useCallback(
    debounce((text) => {
      if (!socket || !sessionId || text === lastSentText.current) return;
      
      lastSentText.current = text;
      
      socket.emit('typing_preview', {
        siteId: sessionId.split('-')[0], // Extract siteId from sessionId
        sessionId: sessionId,
        text: text,
        isAdmin: isAdmin,
        timestamp: Date.now()
      });
    }, 100),
    [socket, sessionId, isAdmin]
  );

  // Handle own typing
  const handleOwnTyping = (text) => {
    setOwnTypingText(text);
    
    if (text.trim().length > 0) {
      sendTypingPreview(text);
      
      // Clear typing indicator after 1 second of inactivity
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
      
      typingTimer.current = setTimeout(() => {
        handleStopTyping();
      }, 1000);
    } else {
      handleStopTyping();
    }
  };

  const handleStopTyping = () => {
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }
    
    if (lastSentText.current !== '') {
      socket?.emit('stop_typing_preview', {
        siteId: sessionId.split('-')[0],
        sessionId: sessionId,
        isAdmin: isAdmin
      });
      
      lastSentText.current = '';
    }
  };

  // Listen for typing previews from others
  useEffect(() => {
    if (!socket || !sessionId) return;

    const handleTypingPreview = (data) => {
      if (data.sessionId === sessionId && data.isAdmin !== isAdmin) {
        setTypingPreviews(prev => {
          const newPreviews = new Map(prev);
          newPreviews.set(data.senderId || 'unknown', {
            text: data.text,
            senderName: data.senderName || 'Anonymous',
            timestamp: data.timestamp,
            isAdmin: data.isAdmin
          });
          return newPreviews;
        });
      }
    };

    const handleTypingCleared = (data) => {
      if (data.sessionId === sessionId && data.isAdmin !== isAdmin) {
        setTypingPreviews(prev => {
          const newPreviews = new Map(prev);
          newPreviews.delete(data.senderId || 'unknown');
          return newPreviews;
        });
      }
    };

    const eventName = isAdmin ? 'visitor_typing_preview' : 'admin_typing_preview';
    const clearEventName = isAdmin ? 'visitor_typing_cleared' : 'admin_typing_cleared';
    
    socket.on(eventName, handleTypingPreview);
    socket.on(clearEventName, handleTypingCleared);

    return () => {
      socket.off(eventName, handleTypingPreview);
      socket.off(clearEventName, handleTypingCleared);
      
      // Clean up on unmount
      handleStopTyping();
    };
  }, [socket, sessionId, isAdmin]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
      handleStopTyping();
    };
  }, []);

  return {
    typingPreviews: Array.from(typingPreviews.values()),
    ownTypingText,
    handleOwnTyping,
    handleStopTyping
  };
};

export default useTypingPreview;
```

### 2.3 Typing Preview UI Component
```javascript
// frontend/src/components/ChatPanel/TypingPreview.jsx
import React from 'react';
import { FaEye } from 'react-icons/fa';

const TypingPreview = ({ previews, currentUserId }) => {
  if (!previews || previews.length === 0) return null;

  return (
    <div className="typing-preview-container">
      {previews.map((preview, index) => (
        <div key={index} className="typing-preview-item">
          <div className="preview-header">
            <FaEye className="preview-icon" />
            <span className="preview-sender">
              {preview.senderName || 'Visitor'}
            </span>
            <span className="preview-label">typing:</span>
          </div>
          
          <div className="preview-content">
            <div className="preview-text">
              {preview.text}
              <span className="typing-cursor">|</span>
            </div>
          </div>
          
          <div className="preview-timestamp">
            {new Date(preview.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TypingPreview;
```

---

## 📊 Step 3: Real-Time Dashboard Integration

### 3.1 Enhanced Chat Panel Component
```javascript
// frontend/src/components/ChatPanel/EnhancedChatPanel.jsx
import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import useTypingPreview from '../../hooks/useTypingPreview';
import TypingPreview from './TypingPreview';
import MessageInput from './MessageInput';
import MessageList from './MessageList';

const EnhancedChatPanel = ({ siteId, sessionId, visitorData }) => {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const {
    typingPreviews,
    ownTypingText,
    handleOwnTyping,
    handleStopTyping
  } = useTypingPreview(socket, sessionId, true); // isAdmin = true

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (data.sessionId === sessionId) {
        setMessages(prev => [...prev, data]);
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, sessionId]);

  // Send message with typing stop
  const sendMessage = (text) => {
    if (!socket || !text.trim()) return;

    // Stop typing preview
    handleStopTyping();

    // Send message
    socket.emit('send_message', {
      siteId,
      sessionId,
      text: text.trim(),
      senderType: 'admin',
      timestamp: Date.now()
    });
  };

  return (
    <div className="enhanced-chat-panel">
      <div className="chat-header">
        <h3>Chat with Visitor</h3>
        <div className="connection-status">
          {isConnected ? '🟢' : '🔴'}
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="chat-content">
        <MessageList 
          messages={messages} 
          visitorData={visitorData}
        />
        
        <TypingPreview 
          previews={typingPreviews}
          currentUserId={visitorData?.id}
        />
      </div>

      <div className="chat-input-area">
        <MessageInput
          onSendMessage={sendMessage}
          onTyping={handleOwnTyping}
          onStopTyping={handleStopTyping}
          placeholder="Type your message..."
        />
      </div>
    </div>
  );
};

export default EnhancedChatPanel;
```

### 3.2 Message Input with Typing Detection
```javascript
// frontend/src/components/ChatPanel/MessageInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

const MessageInput = ({ onSendMessage, onTyping, onStopTyping, placeholder }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const typingTimer = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    // Send typing preview
    onTyping(value);
    
    // Reset typing timer
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }
    
    // Stop typing after 1 second of inactivity
    typingTimer.current = setTimeout(() => {
      onStopTyping();
    }, 1000);
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      onStopTyping();
      
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
      onStopTyping();
    };
  }, []);

  return (
    <div className="message-input">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="message-textarea"
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={!message.trim()}
        className="send-button"
      >
        <FaPaperPlane />
      </button>
    </div>
  );
};

export default MessageInput;
```

---

## 🧪 Step 4: Testing Implementation

### 4.1 Audio Service Tests
```javascript
// frontend/tests/AudioService.test.js
import AudioService from '../services/AudioService';

describe('AudioService', () => {
  beforeEach(() => {
    // Mock browser APIs
    global.AudioContext = jest.fn().mockImplementation(() => ({
      createOscillator: jest.fn(() => ({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { setValueAtTime: jest.fn() }
      })),
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: { setValueAtTime: jest.fn() }
      })),
      destination: {},
      state: 'running',
      resume: jest.fn()
    }));
    
    global.Howl = jest.fn().mockImplementation(() => ({
      play: jest.fn(),
      stop: jest.fn(),
      volume: jest.fn(),
      loop: jest.fn(),
      unload: jest.fn(),
      fade: jest.fn()
    }));
  });

  test('should initialize audio context', () => {
    expect(AudioService.audioContext).toBeDefined();
  });

  test('should handle user interaction requirement', async () => {
    const mockClick = new Event('click');
    document.dispatchEvent(mockClick);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(AudioService.userInteracted).toBe(true);
  });

  test('should play continuous tone', async () => {
    AudioService.userInteracted = true;
    AudioService.isInitialized = true;
    
    const result = await AudioService.startContinuousTone(800, 0.5);
    expect(result).toBe(true);
    expect(AudioService.continuousOscillator).toBeDefined();
  });
});
```

### 4.2 Typing Preview Integration Tests
```javascript
// backend/tests/typingPreview.test.js
const TypingPreviewService = require('../services/TypingPreviewService');

describe('TypingPreviewService', () => {
  let service;
  let mockSocket;
  let mockIO;

  beforeEach(() => {
    service = new TypingPreviewService();
    mockSocket = {
      id: 'test-socket-id',
      to: jest.fn(() => ({ emit: jest.fn() }))
    };
    
    mockIO = {
      to: jest.fn(() => ({ emit: jest.fn() }))
    };
    
    global.io = mockIO;
  });

  test('should process typing preview', () => {
    const data = {
      siteId: 'test-site',
      sessionId: 'test-session',
      text: 'Hello world',
      isAdmin: false,
      senderId: 'visitor-1',
      senderName: 'John'
    };

    service.processTypingPreview(mockSocket, data);
    
    expect(service.typingPreviews.size).toBe(1);
    const preview = service.typingPreviews.get('test-session-visitor');
    expect(preview.text).toBe('Hello world');
    expect(preview.senderName).toBe('John');
  });

  test('should clear typing preview', () => {
    const data = {
      siteId: 'test-site',
      sessionId: 'test-session',
      text: 'Hello',
      isAdmin: false
    };

    service.processTypingPreview(mockSocket, data);
    expect(service.typingPreviews.size).toBe(1);

    service.clearTypingPreview(mockSocket, {
      siteId: 'test-site',
      sessionId: 'test-session',
      isAdmin: false
    });

    expect(service.typingPreviews.size).toBe(0);
  });

  test('should handle disconnection cleanup', () => {
    const data = {
      siteId: 'test-site',
      sessionId: 'test-session',
      text: 'Hello',
      isAdmin: false,
      socketId: 'test-socket-id'
    };

    service.processTypingPreview(mockSocket, data);
    expect(service.typingPreviews.size).toBe(1);

    service.handleDisconnect(mockSocket);
    expect(service.typingPreviews.size).toBe(0);
  });
});
```

---

## 📈 Step 5: Performance Optimization

### 5.1 Throttling and Debouncing
```javascript
// frontend/src/utils/performance.js
export class PerformanceOptimizer {
  static typingThrottle(callback, delay = 100) {
    let timeoutId;
    let lastExecTime = 0;
    
    return function (...args) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        callback.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          callback.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  static batchUpdates(updates, batchSize = 10) {
    const batches = [];
    for (let i = 0; i < updates.length; i += batchSize) {
      batches.push(updates.slice(i, i + batchSize));
    }
    return batches;
  }

  static optimizeSocketEvents(events, maxEventsPerSecond = 50) {
    const eventQueue = [];
    let processing = false;
    
    return function (event) {
      eventQueue.push(event);
      
      if (!processing) {
        processing = true;
        setTimeout(() => {
          const eventsToProcess = eventQueue.splice(0, maxEventsPerSecond);
          eventsToProcess.forEach(e => events(e));
          processing = false;
        }, 1000);
      }
    };
  }
}
```

### 5.2 Memory Management
```javascript
// backend/services/MemoryManager.js
class MemoryManager {
  constructor() {
    this.cleanupInterval = 5 * 60 * 1000; // 5 minutes
    this.maxTypingPreviews = 1000;
    this.maxActiveAlerts = 500;
    
    this.startCleanupTimer();
  }

  startCleanupTimer() {
    setInterval(() => {
      this.cleanupTypingPreviews();
      this.cleanupActiveAlerts();
      this.cleanupSocketConnections();
    }, this.cleanupInterval);
  }

  cleanupTypingPreviews() {
    const now = Date.now();
    const maxAge = 2 * 60 * 1000; // 2 minutes
    
    if (global.typingService) {
      const previews = global.typingService.typingPreviews;
      
      for (const [key, preview] of previews) {
        if (now - preview.timestamp > maxAge) {
          previews.delete(key);
        }
      }
      
      // Log cleanup stats
      console.log(`Cleaned up typing previews. Remaining: ${previews.size}`);
    }
  }

  cleanupActiveAlerts() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    if (global.soundService) {
      const alerts = global.soundService.activeAlerts;
      
      for (const [key, alert] of alerts) {
        if (now - alert.startTime > maxAge) {
          alerts.delete(key);
        }
      }
      
      console.log(`Cleaned up active alerts. Remaining: ${alerts.size}`);
    }
  }

  cleanupSocketConnections() {
    if (global.io) {
      const sockets = global.io.sockets.sockets;
      const now = Date.now();
      const maxInactiveTime = 30 * 60 * 1000; // 30 minutes
      
      for (const [socketId, socket] of sockets) {
        if (socket.lastActivity && now - socket.lastActivity > maxInactiveTime) {
          socket.disconnect(true);
        }
      }
    }
  }
}

module.exports = MemoryManager;
```

---

## 🎯 Success Metrics & Monitoring

### Key Performance Indicators
- **Audio Latency**: < 100ms from event to sound playback
- **Typing Preview Latency**: < 100ms end-to-end
- **Browser Compatibility**: 95%+ of modern browsers
- **Memory Usage**: < 50MB for real-time features
- **Connection Stability**: < 1% disconnection rate

### Monitoring Implementation
```javascript
// backend/services/RealtimeMetricsService.js
class RealtimeMetricsService {
  constructor() {
    this.metrics = {
      typingPreviewsSent: 0,
      typingPreviewsReceived: 0,
      soundAlertsTriggered: 0,
      audioPlaybackErrors: 0,
      averageTypingLatency: 0,
      peakConnections: 0
    };
  }

  recordTypingPreviewSent() {
    this.metrics.typingPreviewsSent++;
  }

  recordTypingPreviewReceived() {
    this.metrics.typingPreviewsReceived++;
  }

  recordSoundAlert() {
    this.metrics.soundAlertsTriggered++;
  }

  recordAudioError(error) {
    this.metrics.audioPlaybackErrors++;
    console.error('Audio playback error:', error);
  }

  recordTypingLatency(latency) {
    // Calculate running average
    const currentAvg = this.metrics.averageTypingLatency;
    const count = this.metrics.typingPreviewsReceived;
    this.metrics.averageTypingLatency = 
      (currentAvg * (count - 1) + latency) / count;
  }

  updatePeakConnections(currentConnections) {
    this.metrics.peakConnections = Math.max(
      this.metrics.peakConnections, 
      currentConnections
    );
  }

  getMetrics() {
    return {
      ...this.metrics,
      typingEfficiency: this.metrics.typingPreviewsReceived / this.metrics.typingPreviewsSent,
      audioSuccessRate: 1 - (this.metrics.audioPlaybackErrors / this.metrics.soundAlertsTriggered)
    };
  }
}

module.exports = RealtimeMetricsService;
```

This comprehensive implementation guide provides production-ready real-time features with proper browser compatibility, performance optimization, and monitoring capabilities.