/**
 * Shared maintenance mode guard.
 * Activates maintenance mode when AI credits are exhausted (402)
 * or all models fail, so users never see credit-related errors.
 */
import { sendTelegramMessage } from "./telegramHelper.ts";
import { logAynActivity } from "./aynLogger.ts";

export async function activateMaintenanceMode(
  supabase: any,
  reason: string
): Promise<void> {
  try {
    // 1. Flip maintenance_mode to true
    await supabase
      .from('system_config')
      .update({ value: true, updated_at: new Date().toISOString() })
      .eq('key', 'maintenance_mode');

    // 2. Set a clean maintenance message (no credit info)
    await supabase
      .from('system_config')
      .update({ value: "We're performing a quick system update. Back shortly!", updated_at: new Date().toISOString() })
      .eq('key', 'maintenance_message');

    // 3. Send Telegram alert
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      await sendTelegramMessage(
        TELEGRAM_BOT_TOKEN,
        TELEGRAM_CHAT_ID,
        `🚨 CRITICAL: Maintenance mode activated automatically.\n\nReason: ${reason}\nTime: ${new Date().toISOString()}\n\nUsers now see the maintenance screen. Fix the issue and disable maintenance mode from admin panel.`
      );
    }

    // 4. Log to ayn_activity_log
    await logAynActivity(supabase, 'maintenance_activated', `Auto-maintenance: ${reason}`, {
      details: { reason, activated_at: new Date().toISOString(), auto: true },
      triggered_by: 'system',
    });

    console.log('[maintenanceGuard] Maintenance mode activated:', reason);
  } catch (e) {
    console.error('[maintenanceGuard] Failed to activate maintenance mode:', e);
  }
}

/**
 * Checks if a gateway response is a 402 (credits exhausted) and activates maintenance mode.
 * Returns true if maintenance was activated (caller should return a generic error).
 */
export async function handleGateway402(
  response: Response,
  supabase: any,
  functionName: string
): Promise<boolean> {
  if (response.status === 402) {
    await activateMaintenanceMode(supabase, `AI credits exhausted (402 from ${functionName})`);
    return true;
  }
  return false;
}
