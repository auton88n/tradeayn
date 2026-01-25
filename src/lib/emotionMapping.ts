import type { AYNEmotion } from '@/contexts/AYNEmotionContext';

// Score-based emotion detection - analyzes response for all 11 emotions
export const analyzeResponseEmotion = (response: string): AYNEmotion => {
  const lower = response.toLowerCase();
  const scores: Record<AYNEmotion, number> = {
    calm: 0, happy: 0, excited: 0, thinking: 0, curious: 0,
    frustrated: 0, supportive: 0, comfort: 0, sad: 0, mad: 0, bored: 0
  };
  
  // EXCITED - high energy positive (strong indicators)
  const excitedPatterns = [
    /amazing/g, /incredible/g, /fantastic/g, /wonderful/g, /excellent/g,
    /brilliant/g, /outstanding/g, /wow/g, /awesome/g, /great news/g,
    /congratulations/g, /well done/g, /great job/g, /nailed it/g, /perfect/g,
    /love it/g, /so cool/g, /exciting/g, /can't wait/g, /thrilled/g,
    /🎉/g, /🎊/g, /✨/g, /🚀/g, /مذهل/g, /رائع جداً/g, /متحمس/g, /ممتاز/g
  ];
  excitedPatterns.forEach(p => { const m = lower.match(p); if (m) scores.excited += m.length * 3; });
  
  // HAPPY - positive but calmer
  const happyPatterns = [
    /glad/g, /happy to/g, /pleased/g, /good/g, /nice/g, /great/g,
    /sure thing/g, /of course/g, /absolutely/g, /definitely/g, /yes/g,
    /done/g, /completed/g, /success/g, /worked/g, /fixed/g, /solved/g,
    /here you go/g, /there you go/g, /enjoy/g, /hope this helps/g,
    /😊/g, /👍/g, /رائع/g, /تمام/g, /حسناً/g, /جيد/g, /مرحباً/g
  ];
  happyPatterns.forEach(p => { const m = lower.match(p); if (m) scores.happy += m.length * 2; });
  
  // THINKING - analytical/processing
  const thinkingPatterns = [
    /let me/g, /i'll/g, /checking/g, /looking/g, /analyzing/g,
    /processing/g, /calculating/g, /considering/g, /evaluating/g, /researching/g,
    /finding/g, /searching/g, /hmm/g, /let's see/g, /one moment/g,
    /working on/g, /figuring out/g, /determining/g, /assessing/g,
    /based on/g, /according to/g, /the result/g, /calculation/g,
    /أفكر/g, /أحلل/g, /دعني/g, /سأبحث/g, /أتحقق/g
  ];
  thinkingPatterns.forEach(p => { const m = lower.match(p); if (m) scores.thinking += m.length * 2; });
  
  // CURIOUS - interested/questioning
  const curiousPatterns = [
    /interesting/g, /fascinating/g, /intriguing/g, /curious/g, /wonder/g,
    /tell me more/g, /what about/g, /how about/g, /what if/g, /have you tried/g,
    /have you considered/g, /could you explain/g, /i'd love to know/g,
    /\?/g, /مثير للاهتمام/g, /أتساءل/g, /ما رأيك/g, /أخبرني/g
  ];
  curiousPatterns.forEach(p => { const m = lower.match(p); if (m) scores.curious += m.length * 2; });
  
  // SUPPORTIVE - empathetic, here to help
  const supportivePatterns = [
    /here to help/g, /i'm here/g, /i understand/g, /i get it/g, /makes sense/g,
    /you're not alone/g, /we can/g, /let's work/g, /together/g, /support/g,
    /i can help/g, /happy to help/g, /glad to help/g, /count on me/g,
    /got you/g, /i've got/g, /absolutely can/g, /أنا هنا/g, /أفهمك/g, /معك/g
  ];
  supportivePatterns.forEach(p => { const m = lower.match(p); if (m) scores.supportive += m.length * 2; });
  
  // COMFORT - reassuring
  const comfortPatterns = [
    /don't worry/g, /no worries/g, /it's okay/g, /it's fine/g, /no problem/g,
    /take your time/g, /no rush/g, /you've got this/g, /you can do/g,
    /everything will/g, /it'll be/g, /it's normal/g, /happens to/g,
    /totally fine/g, /all good/g, /لا تقلق/g, /لا مشكلة/g, /خذ وقتك/g
  ];
  comfortPatterns.forEach(p => { const m = lower.match(p); if (m) scores.comfort += m.length * 2; });
  
  // FRUSTRATED - difficulty, issues
  const frustratedPatterns = [
    /unfortunately/g, /however/g, /issue/g, /problem/g,
    /difficult/g, /challenging/g, /tricky/g, /complex/g, /complicated/g,
    /error/g, /failed/g, /unable/g, /can't/g, /cannot/g, /couldn't/g,
    /doesn't work/g, /not working/g, /broken/g, /stuck/g,
    /للأسف/g, /لا أستطيع/g, /مشكلة/g, /صعب/g, /معقد/g
  ];
  frustratedPatterns.forEach(p => { const m = lower.match(p); if (m) scores.frustrated += m.length * 2; });
  
  // SAD - apologetic, bad news
  const sadPatterns = [
    /sorry/g, /apologize/g, /apologies/g, /regret/g, /sad to/g,
    /bad news/g, /i'm afraid/g, /disappointed/g,
    /miss/g, /lost/g, /gone/g, /آسف/g, /حزين/g, /أعتذر/g
  ];
  sadPatterns.forEach(p => { const m = lower.match(p); if (m) scores.sad += m.length * 2; });
  
  // MAD - strong anger (rare)
  const madPatterns = [
    /angry/g, /furious/g, /outrageous/g, /unacceptable/g, /ridiculous/g,
    /terrible/g, /awful/g, /worst/g, /hate/g, /غاضب/g, /مستفز/g
  ];
  madPatterns.forEach(p => { const m = lower.match(p); if (m) scores.mad += m.length * 3; });
  
  // BORED - low energy (rare)
  const boredPatterns = [
    /whatever/g, /i guess/g, /if you say/g, /meh/g, /boring/g,
    /dull/g, /same old/g, /nothing new/g, /ممل/g, /عادي/g
  ];
  boredPatterns.forEach(p => { const m = lower.match(p); if (m) scores.bored += m.length * 2; });
  
  // Find highest scoring emotion
  let maxEmotion: AYNEmotion = 'calm';
  let maxScore = 0;
  
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxEmotion = emotion as AYNEmotion;
    }
  }
  
  // Only return non-calm if score is significant (threshold of 2)
  return maxScore >= 2 ? maxEmotion : 'calm';
};

// Get emotion from message type
export const getEmotionFromMessageType = (type: 'thinking' | 'speaking' | 'question' | 'excited' | 'uncertain'): AYNEmotion => {
  const mapping: Record<string, AYNEmotion> = {
    thinking: 'thinking',
    speaking: 'calm',
    question: 'curious',
    excited: 'excited',
    uncertain: 'frustrated',
  };
  return mapping[type] || 'calm';
};

// Bubble type based on content
export type BubbleType = 'thinking' | 'speaking' | 'question' | 'excited' | 'uncertain';

export const getBubbleType = (content: string): BubbleType => {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('?') || lowerContent.includes('tell me') || lowerContent.includes('could you')) {
    return 'question';
  }
  if (lowerContent.includes('!') && (lowerContent.includes('great') || lowerContent.includes('perfect') || lowerContent.includes('amazing'))) {
    return 'excited';
  }
  if (lowerContent.includes('thinking') || lowerContent.includes('analyzing') || lowerContent.includes('processing')) {
    return 'thinking';
  }
  if (lowerContent.includes('unfortunately') || lowerContent.includes('unable') || lowerContent.includes('error')) {
    return 'uncertain';
  }
  return 'speaking';
};

// Emotion colors - psychology-based palette matching eye colors
export const getEmotionColor = (emotion: AYNEmotion): string => {
  const colors: Record<AYNEmotion, string> = {
    calm: 'hsl(195, 35%, 47%)',      // soft ocean blue
    happy: 'hsl(38, 100%, 65%)',     // warm peach-gold
    excited: 'hsl(0, 100%, 67%)',    // electric coral
    thinking: 'hsl(239, 84%, 61%)',  // royal indigo
    curious: 'hsl(280, 50%, 62%)',   // bright magenta
    frustrated: 'hsl(9, 78%, 56%)',  // hot orange-red
    sad: 'hsl(265, 10%, 63%)',       // muted lavender
    mad: 'hsl(354, 80%, 43%)',       // deep crimson
    bored: 'hsl(200, 8%, 57%)',      // muted slate-blue
    comfort: 'hsl(344, 58%, 65%)',   // deep warm rose
    supportive: 'hsl(15, 62%, 75%)', // soft rose-beige
  };
  return colors[emotion];
};
