import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sparkles, Send, RefreshCw, Loader2, Clock, CheckCircle, XCircle, 
  Brain, Target, BarChart3, Trash2, Edit3, Camera, Download, X
} from 'lucide-react';

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

const statusColors: Record<string, string> = {
  draft: 'bg-warning/10 text-warning border-warning/20',
  posted: 'bg-primary/10 text-primary border-primary/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
  rejected: 'bg-muted text-muted-foreground border-border',
};

const contentTypeIcons: Record<string, string> = {
  value: '💡',
  engagement: '🔥',
  feature: '⚡',
  personality: '😎',
};

export const TwitterMarketingPanel = () => {
  const [posts, setPosts] = useState<TwitterPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [filterContentType, setFilterContentType] = useState<string>('all');
  const [filterAudience, setFilterAudience] = useState<string>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('twitter_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts((data as unknown as TwitterPost[]) || []);
    } catch (err) {
      console.error('Failed to fetch tweets:', err);
      toast.error('Failed to load tweets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const body: Record<string, string> = {};
      if (filterContentType !== 'all') body.content_type = filterContentType;
      if (filterAudience !== 'all') body.target_audience = filterAudience;

      const { data, error } = await supabase.functions.invoke('twitter-auto-market', {
        body,
      });

      if (error) throw error;
      toast.success('Tweet generated!');
      fetchPosts();
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Failed to generate tweet');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePost = async (post: TwitterPost) => {
    setIsPosting(post.id);
    try {
      const { data, error } = await supabase.functions.invoke('twitter-post', {
        body: { text: post.content, post_id: post.id },
      });

      if (error) throw error;
      toast.success('Tweet posted to X!');
      fetchPosts();
    } catch (err) {
      console.error('Post error:', err);
      toast.error('Failed to post tweet');
    } finally {
      setIsPosting(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('twitter_posts').delete().eq('id', id);
      if (error) throw error;
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Tweet deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (editContent.length > 280) {
      toast.error('Tweet exceeds 280 characters');
      return;
    }
    try {
      const { error } = await supabase
        .from('twitter_posts')
        .update({ content: editContent })
        .eq('id', id);
      if (error) throw error;
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, content: editContent } : p))
      );
      setEditingId(null);
      toast.success('Tweet updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleGenerateImage = async (post: TwitterPost) => {
    setIsGeneratingImage(post.id);
    try {
      const { data, error } = await supabase.functions.invoke('twitter-generate-image', {
        body: { post_id: post.id, tweet_text: post.content },
      });
      if (error) throw error;
      if (data?.image_url) {
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, image_url: data.image_url } : p))
        );
        toast.success('Brand image generated!');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      toast.error('Failed to generate image');
    } finally {
      setIsGeneratingImage(null);
    }
  };

  const draftCount = posts.filter((p) => p.status === 'draft').length;
  const postedCount = posts.filter((p) => p.status === 'posted').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Twitter Marketing</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered tweet generation with marketing psychology
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{draftCount} drafts</Badge>
          <Badge variant="outline" className="bg-primary/10 text-primary">{postedCount} posted</Badge>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5" /> Generate Marketing Tweet
          </CardTitle>
          <CardDescription>
            AYN uses persuasion psychology, audience profiling, and content strategy to craft high-engagement tweets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Content Type</label>
              <Select value={filterContentType} onValueChange={setFilterContentType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="value">💡 Value</SelectItem>
                  <SelectItem value="engagement">🔥 Engagement</SelectItem>
                  <SelectItem value="feature">⚡ Feature</SelectItem>
                  <SelectItem value="personality">😎 Personality</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Target Audience</label>
              <Select value={filterAudience} onValueChange={setFilterAudience}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="engineer">Engineers</SelectItem>
                  <SelectItem value="business_owner">Business Owners</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Tweet
            </Button>
            <Button variant="outline" onClick={fetchPosts} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tweet List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tweets yet. Click "Generate Tweet" to create your first AI-powered marketing tweet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="relative group">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    {/* Status & Meta Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={statusColors[post.status] || ''}>
                        {post.status === 'posted' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {post.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                        {post.status === 'draft' && <Clock className="w-3 h-3 mr-1" />}
                        {post.status}
                      </Badge>
                      {post.content_type && (
                        <Badge variant="secondary" className="text-xs">
                          {contentTypeIcons[post.content_type] || ''} {post.content_type}
                        </Badge>
                      )}
                      {post.target_audience && (
                        <Badge variant="secondary" className="text-xs">
                          <Target className="w-3 h-3 mr-1" /> {post.target_audience}
                        </Badge>
                      )}
                      {post.psychological_strategy && (
                        <Badge variant="secondary" className="text-xs">
                          <Brain className="w-3 h-3 mr-1" /> {post.psychological_strategy}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Content */}
                    {editingId === post.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[80px]"
                          maxLength={280}
                        />
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${editContent.length > 280 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {editContent.length}/280
                          </span>
                          <Button size="sm" onClick={() => handleSaveEdit(post.id)}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{post.content}</p>
                    )}

                    {/* Image Preview */}
                    {post.image_url && (
                      <button
                        onClick={() => setPreviewImage(post.image_url)}
                        className="block rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity w-fit"
                      >
                        <img src={post.image_url} alt="Brand image" className="w-40 h-40 object-cover" loading="lazy" />
                      </button>
                    )}

                    {/* Quality Scores */}
                    {post.quality_score && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <BarChart3 className="w-3 h-3" />
                        {Object.entries(post.quality_score).map(([key, val]) => (
                          <span key={key} className="flex items-center gap-1">
                            {key.replace(/_/g, ' ')}: <strong className={Number(val) >= 8 ? 'text-primary' : Number(val) >= 6 ? 'text-warning' : 'text-destructive'}>{String(val)}</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Error */}
                    {post.error_message && (
                      <p className="text-xs text-destructive">{post.error_message}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    {post.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handlePost(post)}
                          disabled={isPosting === post.id}
                          className="gap-1"
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
                          onClick={() => {
                            setEditingId(post.id);
                            setEditContent(post.content);
                          }}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateImage(post)}
                          disabled={isGeneratingImage === post.id}
                          className="gap-1"
                        >
                          {isGeneratingImage === post.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Camera className="w-3 h-3" />
                          )}
                          {post.image_url ? 'Regen' : 'Image'}
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive/80"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-lg p-2">
          {previewImage && (
            <div className="space-y-2">
              <img src={previewImage} alt="Brand image preview" className="w-full rounded-lg" />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={previewImage} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-3 h-3 mr-1" /> Download
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
