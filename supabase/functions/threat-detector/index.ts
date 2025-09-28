import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ThreatEvent {
  source_ip: string
  threat_type: string
  severity: string
  details: any
  endpoint?: string
  user_agent?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { source_ip, threat_type, severity, details, endpoint, user_agent }: ThreatEvent = await req.json()

    console.log(`Threat detected: ${threat_type} from ${source_ip} (${severity})`)

    // Validate input
    if (!source_ip || !threat_type || !severity) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Check if IP should be auto-blocked
    const shouldBlock = await checkAndBlockIP(supabaseClient, source_ip, threat_type, severity, details)

    // Insert threat detection record
    const { error: insertError } = await supabaseClient
      .from('threat_detection')
      .insert({
        source_ip,
        threat_type,
        severity,
        details: details || {},
        endpoint,
        user_agent,
        is_blocked: shouldBlock,
        blocked_until: shouldBlock ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
      })

    if (insertError) {
      console.error('Failed to insert threat detection:', insertError)
      throw insertError
    }

    // If critical threat, trigger emergency alert
    if (severity === 'critical') {
      await triggerEmergencyAlert(supabaseClient, threat_type, details)
    }

    // Send notification if threat level is high or critical
    if (severity === 'high' || severity === 'critical') {
      await sendThreatNotification(supabaseClient, {
        source_ip,
        threat_type,
        severity,
        details,
        blocked: shouldBlock
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        blocked: shouldBlock,
        message: `Threat ${threat_type} processed successfully` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Threat detection error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function checkAndBlockIP(
  supabaseClient: any, 
  sourceIp: string, 
  threatType: string, 
  severity: string,
  details: any
): Promise<boolean> {
  try {
    // Check recent threats from this IP in the last hour
    const { data: recentThreats, error } = await supabaseClient
      .from('threat_detection')
      .select('id')
      .eq('source_ip', sourceIp)
      .gte('detected_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

    if (error) {
      console.error('Error checking recent threats:', error)
      return false
    }

    const threatCount = recentThreats?.length || 0

    // Auto-block conditions
    const shouldBlock = 
      severity === 'critical' ||
      threatCount >= 5 ||
      (threatType === 'ddos' && threatCount >= 3) ||
      (threatType === 'failed_login' && threatCount >= 5)

    if (shouldBlock) {
      // Insert or update IP block
      const { error: blockError } = await supabaseClient
        .from('ip_blocks')
        .upsert({
          ip_address: sourceIp,
          block_reason: `Automatic block: ${threatCount + 1} ${threatType} threats detected`,
          blocked_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          block_type: 'automatic',
          threat_level: severity,
          metadata: { 
            threat_count: threatCount + 1,
            latest_threat: threatType,
            auto_blocked_at: new Date().toISOString(),
            details 
          },
          is_active: true
        }, { 
          onConflict: 'ip_address',
          ignoreDuplicates: false 
        })

      if (blockError) {
        console.error('Error blocking IP:', blockError)
        return false
      }

      console.log(`IP ${sourceIp} auto-blocked due to ${threatType} (count: ${threatCount + 1})`)
    }

    return shouldBlock
  } catch (error) {
    console.error('Error in checkAndBlockIP:', error)
    return false
  }
}

async function triggerEmergencyAlert(supabaseClient: any, threatType: string, details: any) {
  try {
    const { error } = await supabaseClient
      .from('emergency_alerts')
      .insert({
        alert_level: 'critical',
        alert_type: 'security_threat',
        trigger_reason: `Critical ${threatType} threat detected`,
        auto_triggered: true,
        threat_assessment: {
          threat_type: threatType,
          severity: 'critical',
          details,
          auto_generated: true,
          timestamp: new Date().toISOString()
        }
      })

    if (error) {
      console.error('Failed to trigger emergency alert:', error)
    } else {
      console.log('Emergency alert triggered for critical threat')
    }
  } catch (error) {
    console.error('Error triggering emergency alert:', error)
  }
}

async function sendThreatNotification(supabaseClient: any, threatData: any) {
  try {
    // Call notification service
    await supabaseClient.functions.invoke('send-notifications', {
      body: {
        type: 'security_threat',
        message: `Security Threat Detected: ${threatData.threat_type}`,
        details: {
          source_ip: threatData.source_ip,
          severity: threatData.severity,
          blocked: threatData.blocked,
          timestamp: new Date().toISOString(),
          ...threatData.details
        },
        alert_level: threatData.severity === 'critical' ? 'critical' : 'high'
      }
    })

    console.log('Threat notification sent')
  } catch (error) {
    console.error('Failed to send threat notification:', error)
  }
}