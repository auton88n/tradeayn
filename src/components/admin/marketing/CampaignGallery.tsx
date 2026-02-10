import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Send, Edit3, Trash2, Loader2, CheckCircle, Clock, Brain, Sparkles } from 'lucide-react';

interface TwitterPost {
  id: string;
  content: string;
  status: string;
  psychological_strategy: string | null;
  target_audience: string | null;
  content_type: string | null;
  quality_score: Record<string, number> | null;
  tweet_id: string | null;
  error_message: string | null;
  posted_at: string | null;
  created_at: string;
  image_url: string | null;
}

interface CampaignGalleryProps {
  posts: TwitterPost[];
  isPosting: string | null;
  onPost: (post: TwitterPost) => void;
  onEdit: (post: TwitterPost) => void;
  onDelete: (id: string) => void;
}

const statusConfig: Record<string, { icon: typeof CheckCircle; className: string }> = {
  draft: { icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' },
  posted: { icon: CheckCircle, className: 'bg-[hsl(199,89%,48%)]/10 text-[hsl(199,89%,48%)] border-[hsl(199,89%,48%)]/20' },
};

export const CampaignGallery = ({ posts, isPosting, onPost, onEdit, onDelete }: CampaignGalleryProps) => {
  const postsWithImages = posts.filter((p) => p.image_url);

  if (postsWithImages.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center relative shadow-lg">
            <Brain className="w-8 h-8 text-background" />
            <Sparkles className="w-4 h-4 text-[hsl(199,89%,48%)] absolute -top-1.5 -right-1.5" />
          </div>
          <div>
            <p className="text-sm font-medium">No creatives yet</p>
            <p className="text-xs text-muted-foreground mt-1">Generate images from the Creative Studio tab</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{postsWithImages.length} Creatives</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {postsWithImages.map((post) => {
          const StatusIcon = statusConfig[post.status]?.icon || Clock;
          return (
            <Card
              key={post.id}
              className="overflow-hidden group relative"
            >
              <div className="relative">
                <img
                  src={post.image_url!}
                  alt="Campaign creative"
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                />
                {/* Status Badge */}
                <Badge
                  variant="outline"
                  className={`absolute top-2 right-2 text-[10px] backdrop-blur-sm ${statusConfig[post.status]?.className || ''}`}
                >
                  <StatusIcon className="w-2.5 h-2.5 mr-1" />
                  {post.status}
                </Badge>

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                  <div className="w-full p-3 space-y-2">
                    <p className="text-xs text-background leading-relaxed line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-1">
                      {post.status === 'draft' && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs gap-1 flex-1"
                            onClick={() => onPost(post)}
                            disabled={isPosting === post.id}
                          >
                            {isPosting === post.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            Post
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0"
                            onClick={() => onEdit(post)}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive/80"
                        onClick={() => onDelete(post.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
