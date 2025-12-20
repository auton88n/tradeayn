import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VisitData {
  visitor_id: string;
  page_path: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  session_id?: string;
  screen_width?: number;
  screen_height?: number;
  user_agent?: string;
}

// Detect device type from user agent
function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/.test(ua)) return 'mobile';
  return 'desktop';
}

// Detect browser from user agent
function getBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
  return 'Other';
}

// Detect OS from user agent
function getOS(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os') || ua.includes('macos')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  return 'Other';
}

// Get geolocation from IP using free API
async function getGeoLocation(ip: string): Promise<{ country: string; country_code: string; city: string; region: string }> {
  try {
    // Skip for localhost/private IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return { country: 'Local', country_code: 'XX', city: 'Local', region: 'Local' };
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || 'Unknown',
        country_code: data.countryCode || 'XX',
        city: data.city || 'Unknown',
        region: data.regionName || 'Unknown'
      };
    }
  } catch (error) {
    console.error('Geolocation error:', error);
  }
  
  return { country: 'Unknown', country_code: 'XX', city: 'Unknown', region: 'Unknown' };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const visitData: VisitData = await req.json();
    
    // Get client IP from headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || 'Unknown';
    
    // Get user agent
    const userAgent = visitData.user_agent || req.headers.get('user-agent') || '';
    
    // Parse device info
    const deviceType = getDeviceType(userAgent);
    const browser = getBrowser(userAgent);
    const os = getOS(userAgent);
    
    // Get geolocation
    const geo = await getGeoLocation(clientIp);
    
    console.log(`Tracking visit: ${visitData.page_path} from ${geo.country} (${geo.city})`);

    // Insert analytics record
    const { error } = await supabase.from('visitor_analytics').insert({
      visitor_id: visitData.visitor_id,
      page_path: visitData.page_path,
      referrer: visitData.referrer || null,
      country: geo.country,
      country_code: geo.country_code,
      city: geo.city,
      region: geo.region,
      device_type: deviceType,
      browser: browser,
      os: os,
      utm_source: visitData.utm_source || null,
      utm_medium: visitData.utm_medium || null,
      utm_campaign: visitData.utm_campaign || null,
      session_id: visitData.session_id || null
    });

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Track visit error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
