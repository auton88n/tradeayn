import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a simple device fingerprint from browser data
 */
const generateFingerprint = (): string => {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.platform
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

/**
 * Parse user agent to extract browser and OS names
 */
const parseUserAgent = (ua: string) => {
  // Detect browser
  let browser = 'Unknown Browser';
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    const match = ua.match(/Chrome\/(\d+)/);
    browser = match ? `Chrome ${match[1]}` : 'Chrome';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    const match = ua.match(/Version\/(\d+)/);
    browser = match ? `Safari ${match[1]}` : 'Safari';
  } else if (ua.includes('Firefox')) {
    const match = ua.match(/Firefox\/(\d+)/);
    browser = match ? `Firefox ${match[1]}` : 'Firefox';
  } else if (ua.includes('Edg')) {
    const match = ua.match(/Edg\/(\d+)/);
    browser = match ? `Edge ${match[1]}` : 'Edge';
  }

  // Detect OS
  let os = 'Unknown OS';
  if (ua.includes('Mac OS X')) {
    os = 'macOS';
  } else if (ua.includes('Windows NT 10')) {
    os = 'Windows';
  } else if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Linux') && !ua.includes('Android')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
  } else if (ua.includes('iPhone')) {
    os = 'iOS';
  } else if (ua.includes('iPad')) {
    os = 'iPadOS';
  }

  // Detect device type
  let type = 'desktop';
  if (ua.includes('Mobile') || ua.includes('Android') && !ua.includes('Tablet')) {
    type = 'mobile';
  } else if (ua.includes('iPad') || ua.includes('Tablet')) {
    type = 'tablet';
  }

  return { browser, os, type };
};

/**
 * Get device information from browser
 */
const getDeviceInfo = () => {
  const { browser, os, type } = parseUserAgent(navigator.userAgent);
  return {
    browser,
    os,
    type,
    platform: navigator.platform,
    language: navigator.language,
    screen: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

/**
 * Track device login - creates or updates device fingerprint and updates profile
 */
export const trackDeviceLogin = async (userId: string) => {
  try {
    const fingerprintHash = generateFingerprint();
    const deviceInfo = getDeviceInfo();
    
    // Check if device exists
    const { data: existing } = await supabase
      .from('device_fingerprints')
      .select('*')
      .eq('user_id', userId)
      .eq('fingerprint_hash', fingerprintHash)
      .single();
    
    if (existing) {
      // Update existing device
      await supabase
        .from('device_fingerprints')
        .update({
          last_seen: new Date().toISOString(),
          login_count: (existing.login_count ?? 0) + 1,
          device_info: deviceInfo
        })
        .eq('id', existing.id);
    } else {
      // Insert new device
      await supabase
        .from('device_fingerprints')
        .insert({
          user_id: userId,
          fingerprint_hash: fingerprintHash,
          device_info: deviceInfo,
          is_trusted: false
        });
    }
    
    // Get current profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_sessions')
      .eq('user_id', userId)
      .single();
    
    // Update last_login and total_sessions in profiles
    await supabase
      .from('profiles')
      .update({
        last_login: new Date().toISOString(),
        total_sessions: (profile?.total_sessions || 0) + 1
      })
      .eq('user_id', userId);
    
  } catch (error) {
    console.error('Error tracking device login:', error);
    // Don't throw - tracking shouldn't break login flow
  }
};
