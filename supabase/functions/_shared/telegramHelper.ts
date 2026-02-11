/**
 * Shared Telegram messaging helper with HTML formatting.
 */

function markdownToTelegramHtml(text: string): string {
  // 1. Escape HTML special chars
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Convert **bold** to <b>bold</b>
  html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

  // 3. Convert *italic* to <i>italic</i> (but not inside <b> tags)
  html = html.replace(/(?<!<b|<\/b)\*(.+?)\*/g, '<i>$1</i>');

  // 4. Convert markdown headers (### Header) to bold
  html = html.replace(/^#{1,4}\s+(.+)$/gm, '<b>$1</b>');

  // 5. Ensure paragraph spacing (double newlines become visible breaks)
  html = html.replace(/\n{3,}/g, '\n\n');

  return html;
}

export async function sendTelegramMessage(token: string, chatId: string, text: string) {
  const formatted = markdownToTelegramHtml(text);
  const truncated = formatted.length > 4000 ? formatted.slice(0, 3990) + '\n...truncated' : formatted;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: truncated, parse_mode: 'HTML' }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Telegram send failed (HTML mode):', err);
    // Fallback: retry without parse_mode
    const fallback = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text.length > 4000 ? text.slice(0, 3990) + '\n...truncated' : text }),
    });
    if (!fallback.ok) {
      console.error('Telegram fallback also failed:', await fallback.text());
    }
  }
}
