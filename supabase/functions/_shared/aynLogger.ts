/**
 * Shared AYN activity logger.
 * Logs every action AYN takes to ayn_activity_log for audit trail.
 */
export async function logAynActivity(
  supabase: any,
  action_type: string,
  summary: string,
  opts: {
    target_id?: string;
    target_type?: string;
    details?: Record<string, unknown>;
    triggered_by?: string;
  } = {}
) {
  try {
    await supabase.from('ayn_activity_log').insert({
      action_type,
      target_id: opts.target_id || null,
      target_type: opts.target_type || null,
      summary,
      details: opts.details || {},
      triggered_by: opts.triggered_by || 'system',
    });
  } catch (e) {
    console.error('Failed to log AYN activity:', e);
  }
}
