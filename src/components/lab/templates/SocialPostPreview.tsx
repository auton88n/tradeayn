import { memo, useState } from 'react';
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
  Image as ImageIcon
} from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';

export interface SocialPostData {
  type: 'social_post';
  platform: 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
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

const SocialPostPreviewComponent = ({ data, className }: SocialPostPreviewProps) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const platform = platformConfig[data.platform] || platformConfig.instagram;
  const PlatformIcon = platform.icon;

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

  return (
    <motion.div
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
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Image/Media Area */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        {data.content.imageUrl ? (
          <img 
            src={data.content.imageUrl} 
            alt="Post media"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="w-16 h-16 mb-3 opacity-30" />
            {data.content.imagePrompt && (
              <p className="text-sm text-center px-6 opacity-60 italic">
                "{data.content.imagePrompt}"
              </p>
            )}
          </div>
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

      {/* Caption */}
      <div className="px-4 pb-3">
        <p className="text-sm">
          <span className="font-semibold mr-1">
            {data.profile?.username || 'yourbrand'}
          </span>
          {data.content.caption}
        </p>
        
        {/* Hashtags */}
        {data.content.hashtags && data.content.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {data.content.hashtags.map((tag, i) => (
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
          </div>
        )}

        {/* Call to Action */}
        {data.content.callToAction && (
          <p className="mt-2 text-sm text-muted-foreground">
            {data.content.callToAction}
          </p>
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
