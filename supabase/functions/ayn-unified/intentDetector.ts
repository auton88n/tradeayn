// Intent detection for routing requests

export function detectIntent(message: string): string {
  const lower = message.toLowerCase();
  
  // === IMAGE detection FIRST (prevents "make me a" hijacking) ===
  const imagePatterns = [
    /generate\s+(an?\s+)?image/,
    /create\s+(an?\s+)?image/,
    /make\s+(an?\s+)?image/,
    /make\s+me\s+(an?\s+)?picture/,
    /make\s+me\s+(an?\s+)?photo/,
    /make\s+me\s+(an?\s+)?image/,
    /generate\s+(an?\s+)?picture/,
    /create\s+(an?\s+)?picture/,
    /show\s+me\s+(an?\s+)?(image|picture|photo)/,
    /give\s+me\s+(an?\s+)?(image|picture|photo)/,
    /draw\s/,
    /picture\s+of/,
    /image\s+of/,
    /photo\s+of/,
    /illustration\s+of/,
    /render\s+(an?\s+)?/,
    /visualize/,
    // Broader: "I want/need an image about X"
    /(?:i\s+(?:want|need)\s+(?:an?\s+)?)?(?:image|picture|photo)\s+(?:about|of|for)/,
    /صورة/, /ارسم/, /ارسم لي/, /اعطني صورة/, /ابي\s*صورة/, /سوي\s*صورة/,
    /image\s+de/, /dessine/, /montre\s+moi/, /genere\s+une\s+image/,
    // Retry patterns specific to images
    /try\s+again.*image/, /retry.*image/, /another\s+image/, /new\s+image/, /new\s+picture/,
    /أعد.*صورة/, /صورة.*مرة/, /réessayer.*image/,
  ];
  
  if (imagePatterns.some(rx => rx.test(lower))) return 'image';

  // === DOCUMENT detection (PDF / Excel) ===
  const documentPatterns = [
    /create\s+(an?\s+)?pdf/,
    /make\s+(an?\s+)?pdf/,
    /generate\s+(an?\s+)?pdf/,
    /give\s+me\s+(an?\s+)?pdf/,
    /export\s+as\s+pdf/,
    /pdf\s+(report|document|about|for|of)/,
    // Broader: "I want/need a pdf about X", "can you make a pdf"
    /(?:i\s+(?:want|need)\s+(?:an?\s+)?)?pdf\s+(?:about|for|on)/,
    /(?:can\s+you\s+)?(?:make|create|get)\s+(?:me\s+)?(?:an?\s+)?pdf/,
    /create\s+(an?\s+)?(excel|exel|excell|exsel|ecxel|exl)/,
    /make\s+(an?\s+)?(excel|exel|excell|exsel|ecxel|exl)/,
    /give\s+me\s+(an?\s+)?(excel|exel|excell|exsel|ecxel|exl)/,
    /(excel|exel|excell|exsel|ecxel|exl)\s+(sheet|about|for|of)/,
    /spreadsheet/,
    /xlsx\s+file/,
    // Broader: "I want/need excel about X"
    /(?:i\s+(?:want|need)\s+(?:an?\s+)?)?(?:excel|spreadsheet)\s+(?:about|for|on)/,
    /create\s+(an?\s+)?report/,
    /make\s+(an?\s+)?report/,
    /generate\s+(an?\s+)?report/,
    /create\s+(an?\s+)?table/,
    /table\s+(about|of)/,
    /data\s+(about|overview)/,
    /document\s+about/,
    /create\s+(an?\s+)?document/,
    // Arabic
    /اعمل\s*pdf/, /انشئ\s*pdf/, /ملف\s*pdf/, /تقرير\s*pdf/, /وثيقة\s*pdf/,
    /اعمل\s*(اكسل|لي)/, /جدول\s*بيانات/, /ملف\s*اكسل/, /تقرير\s*عن/, /انشئ\s*تقرير/,
    /سوي\s*لي/, /اعطني\s*ملف/, /حمل\s*لي/,
    /جدول\s*عن/, /بيانات\s*عن/, /اكسل\s*عن/, /اكسل\s*لـ/,
    /ابي\s*(?:pdf|اكسل|ملف)/, /اعطني\s*(?:تقرير|ملف|جدول)/, /سوي\s*(?:pdf|اكسل|ملف)/,
    // French
    /créer\s+(un\s+)?pdf/, /faire\s+(un\s+)?pdf/, /rapport\s+pdf/, /document\s+pdf/, /générer\s+(un\s+)?pdf/,
    /créer\s+(un\s+)?excel/, /feuille\s+excel/, /tableur/, /rapport\s+sur/, /faire\s+un\s+rapport/,
    /excel\s+sur/, /excel\s+de/, /tableau\s+de/, /données\s+sur/,
  ];
  
  if (documentPatterns.some(rx => rx.test(lower))) return 'document';

  // === Other intents ===
  const engineeringKeywords = [
    'beam', 'column', 'foundation', 'slab', 'retaining wall', 'grading',
    'calculate', 'structural', 'load', 'stress', 'reinforcement', 'concrete',
    'steel', 'moment', 'shear', 'deflection', 'design', 'span', 'kn', 'mpa', 'engineering'
  ];
  
  const searchKeywords = ['search', 'find', 'look up', 'what is the latest', 'current', 'today', 'news', 'recent'];
  const fileKeywords = ['uploaded', 'file', 'analyze this', 'summarize this'];

  if (fileKeywords.some(kw => lower.includes(kw))) return 'files';
  if (searchKeywords.some(kw => lower.includes(kw))) return 'search';
  if (engineeringKeywords.some(kw => lower.includes(kw))) return 'engineering';
  
  return 'chat';
}
