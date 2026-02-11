/**
 * Shared Telegram messaging helper with HTML formatting.
 */

function markdownToTelegramHtml(text: string): string {
  let html = text;

  // 0. Strip horizontal rules (---, ___, ***)
  html = html.replace(/^[\-_\*]{3,}\s*$/gm, '');

  // 1. Strip empty bold/italic markers: ****, ***, **, *
  html = html.replace(/\*{4,}/g, '');        // **** or more
  html = html.replace(/\*{2,3}(?=\s|$)/g, ''); // trailing ** or ***
  html = html.replace(/(?:^|\s)\*{2,3}/g, (m) => m.replace(/\*/g, '')); // leading ** or ***

  // 2. Escape HTML special chars
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 3. Convert ***bold italic*** to <b><i>text</i></b>
  html = html.replace(/\*{3}(.+?)\*{3}/g, '<b><i>$1</i></b>');

  // 4. Convert **bold** to <b>bold</b>
  html = html.replace(/\*{2}(.+?)\*{2}/g, '<b>$1</b>');

  // 5. Convert *italic* to <i>italic</i>
  html = html.replace(/\*([^\s*][^*]*?)\*/g, '<i>$1</i>');

  // 6. Convert markdown headers (### Header) to bold
  html = html.replace(/^#{1,4}\s+(.+)$/gm, '<b>$1</b>');

  // 7. Strip any remaining stray asterisks (not inside tags)
  html = html.replace(/(?<![<\/\w])\*+(?![>\w])/g, '');

  // 8. Ensure paragraph spacing
  html = html.replace(/\n{3,}/g, '\n\n');

  // 9. Clean up extra whitespace from removals
  html = html.replace(/^ +$/gm, '');
  html = html.replace(/\n{3,}/g, '\n\n');

  return html.trim();
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
