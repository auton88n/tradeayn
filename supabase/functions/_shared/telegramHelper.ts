/**
 * Shared Telegram messaging helper.
 */
export async function sendTelegramMessage(token: string, chatId: string, text: string) {
  const truncated = text.length > 4000 ? text.slice(0, 3990) + '\n...truncated' : text;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: truncated }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Telegram send failed:', err);
  }
}
