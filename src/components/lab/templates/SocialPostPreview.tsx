import { memo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Instagram,
  Twitter,
  Linkedin,
  Play,
  Sparkles,
  Download,
  Loader2
} from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';

export interface SocialPostData {
  type: 'social_post';
  platform: 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
  headline?: string;
  body?: string;
  cta?: string;
  content: {
    caption: string;
    hashtags?: string[];
    imagePrompt?: string;
    imageUrl?: string;
    callToAction?: string;
    mentions?: string[];
  };
  profile?: {
    username: string;
    displayName: string;
    avatarUrl?: string;
    verified?: boolean;
  };
  engagement?: {
    likes?: number | string;
    comments?: number | string;
    shares?: number | string;
    estimatedLikes?: string;
    bestTimeToPost?: string;
  };
}

interface SocialPostPreviewProps {
  data: SocialPostData;
  className?: string;
}

const platformConfig = {
  instagram: {
    icon: Instagram,
    gradient: 'from-purple-500 via-pink-500 to-orange-400',
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
    border: 'border-pink-200/50 dark:border-pink-800/30',
  },
  twitter: {
    icon: Twitter,
    gradient: 'from-blue-400 to-blue-600',
    bg: 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30',
    border: 'border-blue-200/50 dark:border-blue-800/30',
  },
  linkedin: {
    icon: Linkedin,
    gradient: 'from-blue-600 to-blue-800',
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
    border: 'border-blue-200/50 dark:border-blue-800/30',
  },
  tiktok: {
    icon: Play,
    gradient: 'from-black via-pink-500 to-cyan-400',
    bg: 'bg-gradient-to-br from-gray-50 to-pink-50 dark:from-gray-950/30 dark:to-pink-950/30',
    border: 'border-gray-200/50 dark:border-gray-800/30',
  },
};

// Smart theme detection based on content keywords
const getThemeGradient = (text: string): string => {
  const lowerText = text.toLowerCase();
  
  // Nature themes
  if (lowerText.includes('forest') || lowerText.includes('tree') || lowerText.includes('leaf') || lowerText.includes('green') || lowerText.includes('nature') || lowerText.includes('plant')) {
    return 'from-emerald-600 via-green-700 to-teal-800';
  }
  if (lowerText.includes('ocean') || lowerText.includes('sea') || lowerText.includes('water') || lowerText.includes('wave') || lowerText.includes('beach')) {
    return 'from-blue-500 via-cyan-600 to-teal-700';
  }
  if (lowerText.includes('sunset') || lowerText.includes('sunrise') || lowerText.includes('warm') || lowerText.includes('fire') || lowerText.includes('summer')) {
    return 'from-orange-500 via-red-500 to-pink-600';
  }
  if (lowerText.includes('night') || lowerText.includes('dark') || lowerText.includes('space') || lowerText.includes('star') || lowerText.includes('galaxy')) {
    return 'from-indigo-900 via-purple-900 to-slate-900';
  }
  if (lowerText.includes('winter') || lowerText.includes('snow') || lowerText.includes('ice') || lowerText.includes('cold') || lowerText.includes('frost')) {
    return 'from-slate-400 via-blue-300 to-cyan-200';
  }
  if (lowerText.includes('flower') || lowerText.includes('bloom') || lowerText.includes('spring') || lowerText.includes('garden') || lowerText.includes('rose')) {
    return 'from-pink-500 via-rose-500 to-fuchsia-600';
  }
  if (lowerText.includes('mountain') || lowerText.includes('rock') || lowerText.includes('earth') || lowerText.includes('desert')) {
    return 'from-amber-700 via-stone-600 to-slate-700';
  }
  
  // Mood themes
  if (lowerText.includes('love') || lowerText.includes('heart') || lowerText.includes('romantic')) {
    return 'from-rose-500 via-pink-500 to-red-500';
  }
  if (lowerText.includes('energy') || lowerText.includes('power') || lowerText.includes('strong') || lowerText.includes('motivation')) {
    return 'from-yellow-500 via-orange-500 to-red-600';
  }
  if (lowerText.includes('calm') || lowerText.includes('peace') || lowerText.includes('zen') || lowerText.includes('relax')) {
    return 'from-teal-500 via-cyan-500 to-blue-500';
  }
  if (lowerText.includes('luxury') || lowerText.includes('premium') || lowerText.includes('gold') || lowerText.includes('elegant')) {
    return 'from-amber-500 via-yellow-600 to-orange-600';
  }
  
  // Default beautiful gradient
  return 'from-purple-600 via-pink-500 to-orange-400';
};

// Extract headline from caption if not provided
const extractHeadline = (caption: string): string => {
  // Look for emoji-bordered headlines
  const emojiMatch = caption.match(/^[^\n]*?[\p{Emoji}].*?[\p{Emoji}][^\n]*/u);
  if (emojiMatch) return emojiMatch[0];
  
  // First sentence
  const firstSentence = caption.split(/[.!?]\s/)[0];
  if (firstSentence.length < 80) return firstSentence;
  
  // First 60 chars
  return caption.slice(0, 60) + '...';
};

const SocialPostPreviewComponent = ({ data, className }: SocialPostPreviewProps) => {
  const postRef = useRef<HTMLDivElement>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const platform = platformConfig[data.platform] || platformConfig.instagram;
  const PlatformIcon = platform.icon;

  const downloadAsPNG = async () => {
    if (!postRef.current || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(postRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      const filename = `${data.platform}_post_${Date.now()}.png`;
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      hapticFeedback('success');
    } catch (error) {
      console.error('Failed to download PNG:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleLike = () => {
    hapticFeedback('light');
    setLiked(!liked);
  };

  const handleSave = () => {
    hapticFeedback('light');
    setSaved(!saved);
  };

  const formatNumber = (num: number | string | undefined): string => {
    if (!num) return '0';
    if (typeof num === 'string') return num;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Get the content for the visual
  const headline = data.headline || extractHeadline(data.content.caption);
  const body = data.body || data.content.caption;
  const cta = data.cta || data.content.callToAction;
  const fullText = `${headline} ${body} ${data.content.hashtags?.join(' ') || ''}`;
  const themeGradient = getThemeGradient(fullText);

  return (
    <motion.div
      ref={postRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl overflow-hidden shadow-xl",
        platform.bg,
        platform.border,
        "border",
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            `bg-gradient-to-br ${platform.gradient}`
          )}>
            {data.profile?.avatarUrl ? (
              <img 
                src={data.profile.avatarUrl} 
                alt={data.profile.displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-sm">
                {data.profile?.displayName?.[0] || 'U'}
              </span>
            )}
          </div>
          
          {/* Username */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm text-foreground">
                {data.profile?.displayName || 'Your Brand'}
              </span>
              {data.profile?.verified && (
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-[8px]">✓</span>
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              @{data.profile?.username || 'yourbrand'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-lg",
            `bg-gradient-to-br ${platform.gradient}`
          )}>
            <PlatformIcon className="w-4 h-4 text-white" />
          </div>
          
          {/* PNG Download Button */}
          <button
            onClick={downloadAsPNG}
            disabled={isDownloading}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 active:scale-95",
              "bg-green-100 dark:bg-green-900/40",
              "hover:bg-green-200 dark:hover:bg-green-800/50",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            title="Download as PNG"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-green-600 dark:text-green-400" />
            ) : (
              <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
            )}
          </button>
          
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Premium Visual Area with Text Overlay */}
      <div className="relative min-h-[280px] overflow-hidden">
        {data.content.imageUrl ? (
          // If we have an actual image, show it
          <img 
            src={data.content.imageUrl} 
            alt="Post media"
            className="w-full h-full object-cover"
          />
        ) : (
          // Premium gradient background with decorative elements
          <>
            {/* Dynamic gradient background */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br",
              themeGradient
            )} />
            
            {/* Decorative floating shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div 
                className="absolute top-[10%] right-[10%] w-32 h-32 rounded-full bg-white/10 blur-2xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute bottom-[20%] left-[5%] w-48 h-48 rounded-full bg-white/5 blur-3xl"
                animate={{ 
                  scale: [1.2, 1, 1.2],
                  opacity: [0.05, 0.15, 0.05]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute top-[40%] left-[60%] w-24 h-24 rounded-full bg-black/10 blur-2xl"
                animate={{ 
                  y: [0, -20, 0],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* Sparkle accents */}
            <div className="absolute top-4 right-4">
              <Sparkles className="w-6 h-6 text-white/40" />
            </div>
            
            {/* Text Overlay Container */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8 text-center">
              {/* Headline with premium typography */}
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight mb-4"
                style={{ 
                  textShadow: '0 2px 10px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                {headline}
              </motion.h2>
              
              {/* Body text - truncated for visual */}
              {body !== headline && (
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm md:text-base text-white/90 max-w-xs leading-relaxed mb-4"
                  style={{ 
                    textShadow: '0 1px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  {body.length > 120 ? body.slice(0, 120) + '...' : body}
                </motion.p>
              )}
              
              {/* Frosted glass CTA button */}
              {cta && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className={cn(
                    "mt-2 px-6 py-2.5 rounded-full",
                    "bg-white/20 backdrop-blur-md",
                    "border border-white/30",
                    "text-white font-medium text-sm",
                    "hover:bg-white/30 transition-all duration-300",
                    "shadow-lg"
                  )}
                  style={{
                    textShadow: '0 1px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  {cta}
                </motion.button>
              )}
            </div>
            
            {/* Subtle gradient overlays for depth and text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
          </>
        )}
      </div>

      {/* Action Bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button 
            onClick={handleLike}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-1"
          >
            <Heart 
              className={cn(
                "w-6 h-6 transition-colors",
                liked ? "fill-red-500 text-red-500" : "text-foreground hover:text-red-500"
              )} 
            />
          </motion.button>
          <button className="hover:text-blue-500 transition-colors">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button className="hover:text-green-500 transition-colors">
            <Share2 className="w-6 h-6" />
          </button>
        </div>
        <motion.button 
          onClick={handleSave}
          whileTap={{ scale: 0.9 }}
        >
          <Bookmark 
            className={cn(
              "w-6 h-6 transition-colors",
              saved ? "fill-foreground" : "hover:text-yellow-500"
            )} 
          />
        </motion.button>
      </div>

      {/* Engagement Stats */}
      {data.engagement && (
        <div className="px-4 pb-2">
          <p className="font-semibold text-sm">
            {formatNumber(data.engagement.likes || data.engagement.estimatedLikes)} likes
          </p>
        </div>
      )}

      {/* Caption - Condensed version */}
      <div className="px-4 pb-3">
        <p className="text-sm line-clamp-2">
          <span className="font-semibold mr-1">
            {data.profile?.username || 'yourbrand'}
          </span>
          {data.content.caption.length > 100 
            ? data.content.caption.slice(0, 100) + '...' 
            : data.content.caption
          }
        </p>
        
        {/* Hashtags */}
        {data.content.hashtags && data.content.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {data.content.hashtags.slice(0, 5).map((tag, i) => (
              <span 
                key={i} 
                className={cn(
                  "text-sm font-medium",
                  "text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                )}
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
            {data.content.hashtags.length > 5 && (
              <span className="text-sm text-muted-foreground">
                +{data.content.hashtags.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Best Time to Post */}
      {data.engagement?.bestTimeToPost && (
        <div className="px-4 pb-3 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              🕐 Best time to post: {data.engagement.bestTimeToPost}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const SocialPostPreview = memo(SocialPostPreviewComponent);
