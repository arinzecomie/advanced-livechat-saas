/**
 * Fingerprint Utility - generates browser fingerprints
 * Simple fingerprinting for visitor identification
 */


export default class Fingerprint {
  static generate() {
    // Simple fingerprint based on timestamp and random data
    // In production, you'd want more sophisticated fingerprinting
    const components = [
      navigator.userAgent || '',
      navigator.language || '',
      screen.width || '',
      screen.height || '',
      new Date().getTimezoneOffset(),
      Math.random().toString(36).substr(2, 9)
    ];

    return this.hash(components.join('|'));
  }

  static hash(input) {
    let hash = 0;
    if (input.length === 0) return hash.toString(36);
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  static generateSessionId() {
    return 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  static generateVisitorId() {
    return 'visitor_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }
}