INSERT INTO faq_items (
  question, 
  answer, 
  category, 
  order_index, 
  is_published
) VALUES (
  'How does AYN''s emotional eye work?',
  'AYN''s eye changes color based on the conversation mood:

| Emotion | Color | When It Shows |
|---------|-------|---------------|
| 😌 Calm | Blue | Default state |
| 🤗 Comfort | Rose | When you need support |
| 💪 Supportive | Beige | When encouraging you |
| 😊 Happy | Gold | Celebrating with you |
| 🤩 Excited | Coral | High energy moments |
| 🤔 Thinking | Indigo | Processing your question |
| 🧐 Curious | Magenta | Exploring ideas |
| 😢 Sad | Lavender | Acknowledging sadness |
| 😤 Frustrated | Orange | Facing challenges |
| 😠 Mad | Crimson | Rare, serious moments |
| 😑 Bored | Slate | Low activity |

AYN responds with empathy - if you''re sad, AYN shows comfort, not sadness.',
  'features',
  12,
  true
);