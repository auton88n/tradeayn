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
 * Get device information from browser
 */
const getDeviceInfo = () => ({
  browser: navigator.userAgent,
  platform: navigator.platform,
  language: navigator.language,
  screen: `${window.screen.width}x${window.screen.height}`,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  colorDepth: screen.colorDepth
});

/**
 * Track device login - creates or updates device fingerprint and updates profile
 */
export const trackDeviceLogin = async (userId: string) => {
  try {
    const fingerprintHash = generateFingerprint();
    const deviceInfo = getDeviceInfo();
    
    console.log('Tracking device login:', { userId, fingerprintHash });
    
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
          login_count: existing.login_count + 1,
          device_info: deviceInfo
        })
        .eq('id', existing.id);
      
      console.log('Updated existing device');
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
      
      console.log('Created new device fingerprint');
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
    
    console.log('Updated profile login tracking');
    
  } catch (error) {
    console.error('Error tracking device login:', error);
    // Don't throw - tracking shouldn't break login flow
  }
};
