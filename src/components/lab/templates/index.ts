// Marketing Template Components for LAB Mode
export { SocialPostPreview, type SocialPostData } from './SocialPostPreview';
export { CampaignAnalytics, type CampaignData } from './CampaignAnalytics';
export { ContentCalendar, type ContentCalendarData } from './ContentCalendar';
export { BrandKitDisplay, type BrandKitData } from './BrandKitDisplay';
export { MarketingReportCard, type MarketingReportData } from './MarketingReportCard';

// Template type detection helper
export type MarketingTemplateType = 
  | 'social_post' 
  | 'campaign' 
  | 'calendar' 
  | 'content_calendar'
  | 'brand_kit' 
  | 'brand'
  | 'report' 
  | 'marketing_report';

export interface MarketingTemplateData {
  type: MarketingTemplateType;
  [key: string]: unknown;
}

export const detectTemplateType = (data: Record<string, unknown>): MarketingTemplateType | null => {
  // Check explicit type field first
  if (data.type && typeof data.type === 'string') {
    const type = data.type.toLowerCase();
    if (['social_post', 'campaign', 'calendar', 'content_calendar', 'brand_kit', 'brand', 'report', 'marketing_report'].includes(type)) {
      return type as MarketingTemplateType;
    }
  }

  // Check for contentType (n8n format)
  if (data.contentType && typeof data.contentType === 'string') {
    const contentType = data.contentType.toLowerCase();
    if (contentType === 'social') return 'social_post';
    if (contentType === 'campaign') return 'campaign';
    if (contentType === 'calendar' || contentType === 'content_calendar') return 'calendar';
    if (contentType === 'brand' || contentType === 'brand_kit') return 'brand_kit';
    if (contentType === 'report' || contentType === 'marketing_report') return 'report';
  }

  // Detect based on structure
  const keys = Object.keys(data);
  const lowerKeys = keys.map(k => k.toLowerCase());

  // Social Post Detection
  if (
    lowerKeys.includes('platform') && 
    (lowerKeys.includes('caption') || lowerKeys.includes('content')) &&
    (lowerKeys.includes('hashtags') || lowerKeys.includes('engagement'))
  ) {
    return 'social_post';
  }

  // Campaign Analytics Detection
  if (
    lowerKeys.includes('metrics') && 
    (lowerKeys.includes('reach') || lowerKeys.includes('impressions') || lowerKeys.includes('engagement'))
  ) {
    return 'campaign';
  }

  // Content Calendar Detection
  if (lowerKeys.includes('posts') && Array.isArray(data.posts)) {
    const posts = data.posts as Array<Record<string, unknown>>;
    if (posts.length > 0 && posts[0].date && posts[0].platform) {
      return 'calendar';
    }
  }

  // Brand Kit Detection
  if (
    lowerKeys.includes('colors') && 
    (lowerKeys.includes('fonts') || lowerKeys.includes('logo') || lowerKeys.includes('voice'))
  ) {
    return 'brand_kit';
  }

  // Marketing Report Detection
  if (
    (lowerKeys.includes('highlights') || lowerKeys.includes('insights') || lowerKeys.includes('recommendations')) &&
    (lowerKeys.includes('title') || lowerKeys.includes('summary'))
  ) {
    return 'report';
  }

  return null;
};
