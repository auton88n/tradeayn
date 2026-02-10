import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Send, Edit3, Trash2, Loader2, CheckCircle, Clock } from 'lucide-react';

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
  posted: { icon: CheckCircle, className: 'bg-primary/10 text-primary border-primary/20' },
};

export const CampaignGallery = ({ posts, isPosting, onPost, onEdit, onDelete }: CampaignGalleryProps) => {
  const postsWithImages = posts.filter((p) => p.image_url);

  if (postsWithImages.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-sm">No creatives yet. Generate images from the Creative Studio tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{postsWithImages.length} Creatives</h3>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {postsWithImages.map((post) => {
          const StatusIcon = statusConfig[post.status]?.icon || Clock;
          return (
            <Card
              key={post.id}
              className="shrink-0 w-64 snap-start overflow-hidden group relative"
            >
              <div className="relative">
                <img
                  src={post.image_url!}
                  alt="Campaign creative"
                  className="w-64 h-64 object-cover"
                  loading="lazy"
                />
                {/* Status Badge */}
                <Badge
                  variant="outline"
                  className={`absolute top-2 right-2 text-[10px] ${statusConfig[post.status]?.className || ''}`}
                >
                  <StatusIcon className="w-2.5 h-2.5 mr-1" />
                  {post.status}
                </Badge>
              </div>

              {/* Text Overlay */}
              <div className="p-3 space-y-2">
                <p className="text-xs leading-relaxed line-clamp-3">{post.content}</p>
                <div className="flex items-center gap-1">
                  {post.status === 'draft' && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
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
                        variant="outline"
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
            </Card>
          );
        })}
      </div>
    </div>
  );
};
