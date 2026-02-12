// Intent detection for routing requests

export function detectIntent(message: string): string {
  const lower = message.toLowerCase();
  
  // Document generation keywords (all languages)
  const documentKeywords = [
    'create pdf', 'make pdf', 'generate pdf', 'pdf report', 'pdf document',
    'create excel', 'make excel', 'excel sheet', 'spreadsheet', 'xlsx file',
    'export as pdf', 'export as excel', 'make a report', 'generate report',
    'document about', 'create a document', 'make me a', 'give me a pdf',
    'اعمل pdf', 'انشئ pdf', 'ملف pdf', 'تقرير pdf', 'وثيقة pdf',
    'اعمل اكسل', 'جدول بيانات', 'ملف اكسل', 'تقرير عن', 'انشئ تقرير',
    'اعمل لي', 'سوي لي', 'اعطني ملف', 'حمل لي',
    'créer pdf', 'faire pdf', 'rapport pdf', 'document pdf', 'générer pdf',
    'créer excel', 'feuille excel', 'tableur', 'rapport sur', 'faire un rapport'
  ];
  

  const engineeringKeywords = [
    'beam', 'column', 'foundation', 'slab', 'retaining wall', 'grading',
    'calculate', 'structural', 'load', 'stress', 'reinforcement', 'concrete',
    'steel', 'moment', 'shear', 'deflection', 'design', 'span', 'kn', 'mpa', 'engineering'
  ];
  
  const searchKeywords = ['search', 'find', 'look up', 'what is the latest', 'current', 'today', 'news', 'recent'];
  const fileKeywords = ['uploaded', 'file', 'analyze this', 'summarize this'];
  const imageKeywords = [
    'generate image', 'create image', 'draw', 'picture of',
    'image of', 'make image', 'make a picture', 'make me a picture',
    'show me an image', 'photo of', 'illustration of', 'visualize',
    'render a', 'render an',
    'صورة', 'ارسم', 'ارسم لي', 'اعطني صورة',
    'image de', 'dessine', 'montre moi', 'genere une image'
  ];

  if (documentKeywords.some(kw => lower.includes(kw))) return 'document';
  if (imageKeywords.some(kw => lower.includes(kw))) return 'image';
  if (fileKeywords.some(kw => lower.includes(kw))) return 'files';
  if (searchKeywords.some(kw => lower.includes(kw))) return 'search';
  if (engineeringKeywords.some(kw => lower.includes(kw))) return 'engineering';
  
  return 'chat';
}
