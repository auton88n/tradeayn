import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Instagram,
  Twitter,
  Linkedin,
  Play,
  Clock,
  Check,
  Edit3
} from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { hapticFeedback } from '@/lib/haptics';

export interface ContentCalendarData {
  type: 'calendar' | 'content_calendar';
  startDate?: string;
  posts: Array<{
    id?: string;
    date: string;
    time?: string;
    platform: 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
    content: string;
    status?: 'draft' | 'scheduled' | 'published';
    hashtags?: string[];
    mediaType?: 'image' | 'video' | 'carousel' | 'story';
  }>;
  theme?: string;
}

interface ContentCalendarProps {
  data: ContentCalendarData;
  className?: string;
}

const platformConfig = {
  instagram: {
    icon: Instagram,
    color: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
    text: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-100 dark:bg-pink-900/30',
  },
  twitter: {
    icon: Twitter,
    color: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  linkedin: {
    icon: Linkedin,
    color: 'bg-blue-700',
    text: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  tiktok: {
    icon: Play,
    color: 'bg-black',
    text: 'text-gray-800 dark:text-gray-200',
    bg: 'bg-gray-100 dark:bg-gray-800',
  },
};

const statusConfig = {
  draft: {
    icon: Edit3,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Draft',
  },
  scheduled: {
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Scheduled',
  },
  published: {
    icon: Check,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    label: 'Published',
  },
};

const ContentCalendarComponent = ({ data, className }: ContentCalendarProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    return startOfWeek(startDate, { weekStartsOn: 1 });
  });
  const [selectedPost, setSelectedPost] = useState<typeof data.posts[0] | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getPostsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return data.posts.filter(post => {
      const postDate = post.date.split('T')[0];
      return postDate === dateStr;
    });
  };

  const handlePrevWeek = () => {
    hapticFeedback('light');
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    hapticFeedback('light');
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/20",
        "border border-purple-200/50 dark:border-purple-800/30",
        "shadow-xl",
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Content Calendar</h3>
              {data.theme && (
                <p className="text-sm text-muted-foreground">Theme: {data.theme}</p>
              )}
            </div>
          </div>
          
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {weekDays.map((day) => (
            <div 
              key={format(day, 'yyyy-MM-dd')} 
              className="text-center pb-2 border-b border-gray-200/50 dark:border-gray-700/50"
            >
              <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
              <p className={cn(
                "text-lg font-semibold mt-1",
                format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') 
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-foreground"
              )}>
                {format(day, 'd')}
              </p>
            </div>
          ))}

          {/* Day Content */}
          {weekDays.map((day) => {
            const dayPosts = getPostsForDay(day);
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            
            return (
              <div 
                key={`content-${format(day, 'yyyy-MM-dd')}`}
                className={cn(
                  "min-h-[120px] p-2 rounded-xl transition-colors",
                  isToday 
                    ? "bg-purple-100/50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700" 
                    : "bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/50"
                )}
              >
                <div className="space-y-2">
                  {dayPosts.map((post, idx) => {
                    const platform = platformConfig[post.platform] || platformConfig.instagram;
                    const PlatformIcon = platform.icon;
                    const status = statusConfig[post.status || 'scheduled'];
                    
                    return (
                      <motion.button
                        key={post.id || idx}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          hapticFeedback('light');
                          setSelectedPost(post === selectedPost ? null : post);
                        }}
                        className={cn(
                          "w-full p-2 rounded-lg text-left transition-all",
                          platform.bg,
                          "border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1 rounded", platform.color)}>
                            <PlatformIcon className="w-3 h-3 text-white" />
                          </div>
                          {post.time && (
                            <span className="text-[10px] text-muted-foreground">
                              {post.time}
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-1 line-clamp-2 text-foreground">
                          {post.content}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Post Detail */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
          >
            <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="flex items-start gap-3">
                {(() => {
                  const platform = platformConfig[selectedPost.platform];
                  const PlatformIcon = platform.icon;
                  const status = statusConfig[selectedPost.status || 'scheduled'];
                  const StatusIcon = status.icon;
                  
                  return (
                    <>
                      <div className={cn("p-2 rounded-lg", platform.color)}>
                        <PlatformIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold capitalize">{selectedPost.platform}</span>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                            status.bg, status.color
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                          {selectedPost.time && (
                            <span className="text-sm text-muted-foreground">
                              {selectedPost.time}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{selectedPost.content}</p>
                        {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedPost.hashtags.map((tag, i) => (
                              <span 
                                key={i} 
                                className="text-xs text-blue-600 dark:text-blue-400"
                              >
                                {tag.startsWith('#') ? tag : `#${tag}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Footer */}
      <div className="px-6 py-3 bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {data.posts.length} posts scheduled
          </span>
          <div className="flex items-center gap-4">
            {Object.entries(
              data.posts.reduce((acc, post) => {
                acc[post.platform] = (acc[post.platform] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([platform, count]) => {
              const config = platformConfig[platform as keyof typeof platformConfig];
              const Icon = config?.icon || CalendarIcon;
              return (
                <div key={platform} className="flex items-center gap-1 text-muted-foreground">
                  <Icon className="w-4 h-4" />
                  <span>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const ContentCalendar = memo(ContentCalendarComponent);
