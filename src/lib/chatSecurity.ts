/**
 * Chat security utilities for user isolation and session management
 */

import { supabase } from "@/integrations/supabase/client";

export interface SecurityValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates that a user owns a specific session
 */
export async function validateSessionOwnership(
  userId: string,
  sessionId: string
): Promise<SecurityValidationResult> {
  try {
    const { data: isOwner, error } = await supabase.rpc('validate_session_ownership', {
      _user_id: userId,
      _session_id: sessionId
    });

    if (error) {
      console.error('Session ownership validation error:', error);
      return { isValid: false, error: error.message };
    }

    return { isValid: !!isOwner };
  } catch (error) {
    console.error('Session validation failed:', error);
    return { isValid: false, error: 'Session validation failed' };
  }
}

/**
 * Safely deletes user chat sessions with ownership validation
 */
export async function deleteUserSessions(
  userId: string,
  sessionIds: string[]
): Promise<SecurityValidationResult> {
  try {
    if (!sessionIds || sessionIds.length === 0) {
      return { isValid: false, error: 'No session IDs provided' };
    }

    const { data: success, error } = await supabase.rpc('delete_user_chat_sessions', {
      _user_id: userId,
      _session_ids: sessionIds
    });

    if (error) {
      console.error('Session deletion error:', error);
      return { isValid: false, error: error.message };
    }

    return { isValid: !!success };
  } catch (error) {
    console.error('Session deletion failed:', error);
    return { isValid: false, error: 'Session deletion failed' };
  }
}

/**
 * Logs security events for chat operations
 */
export async function logChatSecurityEvent(
  action: string,
  sessionId?: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    await supabase.rpc('log_chat_security_event', {
      _action: action,
      _session_id: sessionId || null,
      _details: details || {}
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't throw - logging failures shouldn't break app functionality
  }
}

/**
 * Validates that a user has proper access to perform chat operations
 */
export async function validateUserAccess(userId: string): Promise<SecurityValidationResult> {
  try {
    if (!userId) {
      return { isValid: false, error: 'User ID required' };
    }

    // Check if user has active access
    const { data: hasAccess, error } = await supabase.rpc('has_active_access', {
      _user_id: userId
    });

    if (error) {
      console.error('Access validation error:', error);
      return { isValid: false, error: error.message };
    }

    return { isValid: !!hasAccess };
  } catch (error) {
    console.error('User access validation failed:', error);
    return { isValid: false, error: 'Access validation failed' };
  }
}

/**
 * Sanitizes chat content before processing
 */
export function sanitizeChatContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Remove potentially dangerous content
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}