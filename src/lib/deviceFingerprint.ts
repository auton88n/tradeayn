/**
 * Device Fingerprinting for Enhanced Security
 */

export interface DeviceInfo {
  userAgent: string;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
  };
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string | null;
  canvas?: string;
  webgl?: string;
}

/**
 * Generate a unique device fingerprint based on browser characteristics
 */
export async function generateDeviceFingerprint(): Promise<string> {
  const deviceInfo = await collectDeviceInfo();
  
  // Create a string combining all device characteristics
  const fingerprint = [
    deviceInfo.userAgent,
    `${deviceInfo.screen.width}x${deviceInfo.screen.height}x${deviceInfo.screen.colorDepth}`,
    deviceInfo.timezone,
    deviceInfo.language,
    deviceInfo.platform,
    deviceInfo.cookieEnabled.toString(),
    deviceInfo.doNotTrack || 'null',
    deviceInfo.canvas || '',
    deviceInfo.webgl || ''
  ].join('|');

  // Generate hash of the fingerprint
  return await hashString(fingerprint);
}

/**
 * Collect device information for fingerprinting
 */
export async function collectDeviceInfo(): Promise<DeviceInfo> {
  const info: DeviceInfo = {
    userAgent: navigator.userAgent,
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack
  };

  // Add canvas fingerprinting
  try {
    info.canvas = await generateCanvasFingerprint();
  } catch (error) {
    console.warn('Canvas fingerprinting failed:', error);
  }

  // Add WebGL fingerprinting
  try {
    info.webgl = generateWebGLFingerprint();
  } catch (error) {
    console.warn('WebGL fingerprinting failed:', error);
  }

  return info;
}

/**
 * Generate canvas-based fingerprint
 */
async function generateCanvasFingerprint(): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';

  // Draw some text and shapes
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.fillText('Device fingerprinting 🔒', 2, 15);
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillText('Security enhanced', 4, 45);

  // Get canvas data
  const canvasData = canvas.toDataURL();
  return await hashString(canvasData);
}

/**
 * Generate WebGL-based fingerprint
 */
function generateWebGLFingerprint(): string {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
  
  if (!gl) return '';

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
  
  return `${vendor}|${renderer}`;
}

/**
 * Hash a string using Web Crypto API
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if device is trusted based on fingerprint history
 */
export function isDeviceTrusted(fingerprint: string, trustedFingerprints: string[]): boolean {
  return trustedFingerprints.includes(fingerprint);
}

/**
 * Validate device info for suspicious characteristics
 */
export function validateDeviceInfo(info: DeviceInfo): { isValid: boolean; risks: string[] } {
  const risks: string[] = [];

  // Check for automation tools
  if (info.userAgent.includes('HeadlessChrome') || 
      info.userAgent.includes('PhantomJS') || 
      info.userAgent.includes('Selenium')) {
    risks.push('Automated browser detected');
  }

  // Check for suspicious screen dimensions
  if (info.screen.width === 0 || info.screen.height === 0) {
    risks.push('Invalid screen dimensions');
  }

  // Check for missing canvas support (common in bots)
  if (!info.canvas) {
    risks.push('Canvas fingerprinting unavailable');
  }

  // Check for disabled cookies (unusual for normal users)
  if (!info.cookieEnabled) {
    risks.push('Cookies disabled');
  }

  return {
    isValid: risks.length === 0,
    risks
  };
}