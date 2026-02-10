import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Send, Trash2, Edit3, Clock, CheckCircle, XCircle, Brain, Target,
  Loader2, Sparkles, Calendar, BarChart3, RefreshCw, Camera
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
  scheduled_at: string | null;
  thread_id: string | null;
  thread_order: number | null;
  impressions: number | null;
  likes: number | null;
  retweets: number | null;
  replies: number | null;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  draft: { icon: Clock, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Drafts' },
  scheduled: { icon: Calendar, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Scheduled' },
  posted: { icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Posted' },
  failed: { icon: XCircle, color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Failed' },
};

interface ContentPipelineProps {
  onOpenCreativeEditor?: (post: TwitterPost) => void;
}

export const ContentPipeline = ({ onOpenCreativeEditor }: ContentPipelineProps) => {
  const [posts, setPosts] = useState<TwitterPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [filterContentType, setFilterContentType] = useState('all');
  const [filterAudience, setFilterAudience] = useState('all');

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('twitter_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setPosts((data as unknown as TwitterPost[]) || []);
    } catch { toast.error('Failed to load posts'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleGenerate = async (mode?: 'single' | 'thread' | 'campaign') => {
    setIsGenerating(true);
    try {
      const body: Record<string, unknown> = {};
      if (filterContentType !== 'all') body.content_type = filterContentType;
      if (filterAudience !== 'all') body.target_audience = filterAudience;
      if (mode === 'thread') body.thread_mode = true;
      if (mode === 'campaign') body.campaign_plan = true;

      const { data, error } = await supabase.functions.invoke('twitter-auto-market', { body });
      if (error) throw error;
      toast.success(mode === 'thread' ? 'Thread generated!' : mode === 'campaign' ? 'Campaign plan generated!' : 'Tweet generated!');
      fetchPosts();
    } catch { toast.error('Failed to generate'); }
    finally { setIsGenerating(false); }
  };

  const handlePost = async (post: TwitterPost) => {
    setIsPosting(post.id);
    try {
      const { error } = await supabase.functions.invoke('twitter-post', { body: { text: post.content, post_id: post.id } });
      if (error) throw error;
      toast.success('Posted to X!');
      fetchPosts();
    } catch { toast.error('Failed to post'); }
    finally { setIsPosting(null); }
  };

  const handleSchedule = async (post: TwitterPost, scheduledAt: string) => {
    try {
      const { error } = await supabase.from('twitter_posts').update({ status: 'scheduled', scheduled_at: scheduledAt }).eq('id', post.id);
      if (error) throw error;
      toast.success('Scheduled!');
      fetchPosts();
    } catch { toast.error('Failed to schedule'); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('twitter_posts').delete().eq('id', id);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleSaveEdit = async (id: string) => {
    if (editContent.length > 280) { toast.error('Exceeds 280 chars'); return; }
    try {
      const { error } = await supabase.from('twitter_posts').update({ content: editContent }).eq('id', id);
      if (error) throw error;
      setPosts(prev => prev.map(p => p.id === id ? { ...p, content: editContent } : p));
      setEditingId(null);
      toast.success('Updated');
    } catch { toast.error('Failed to update'); }
  };

  const columns: { status: string; posts: TwitterPost[] }[] = [
    { status: 'draft', posts: posts.filter(p => p.status === 'draft') },
    { status: 'scheduled', posts: posts.filter(p => p.status === 'scheduled') },
    { status: 'posted', posts: posts.filter(p => p.status === 'posted') },
  ];

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Generate controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterContentType} onValueChange={setFilterContentType}>
          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any type</SelectItem>
            <SelectItem value="value">💡 Value</SelectItem>
            <SelectItem value="engagement">🔥 Engagement</SelectItem>
            <SelectItem value="feature">⚡ Feature</SelectItem>
            <SelectItem value="personality">😎 Personality</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAudience} onValueChange={setFilterAudience}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Audience" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any audience</SelectItem>
            <SelectItem value="engineer">Engineers</SelectItem>
            <SelectItem value="business_owner">Business</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => handleGenerate('single')} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Tweet
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => handleGenerate('thread')} disabled={isGenerating}>
          🧵 Thread
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => handleGenerate('campaign')} disabled={isGenerating}>
          📅 Campaign
        </Button>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 ml-auto" onClick={fetchPosts}>
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(({ status, posts: colPosts }) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          return (
            <div key={status} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{config.label}</h3>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-auto">{colPosts.length}</Badge>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {colPosts.map(post => (
                  <Card key={post.id} className="group">
                    <CardContent className="p-3 space-y-2">
                      {editingId === post.id ? (
                        <div className="space-y-1.5">
                          <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-[60px] text-xs" maxLength={280} />
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] ${editContent.length > 280 ? 'text-destructive' : 'text-muted-foreground'}`}>{editContent.length}/280</span>
                            <Button size="sm" className="h-6 text-[10px]" onClick={() => handleSaveEdit(post.id)}>Save</Button>
                            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setEditingId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs leading-relaxed">{post.content}</p>
                      )}

                      {post.image_url && (
                        <img src={post.image_url} alt="" className="w-full rounded-lg aspect-video object-cover" loading="lazy" />
                      )}

                      <div className="flex items-center gap-1 flex-wrap">
                        {post.content_type && <Badge variant="secondary" className="text-[9px] h-4 px-1">{post.content_type}</Badge>}
                        {post.target_audience && <Badge variant="secondary" className="text-[9px] h-4 px-1"><Target className="w-2 h-2 mr-0.5" />{post.target_audience}</Badge>}
                        {post.thread_id && <Badge variant="secondary" className="text-[9px] h-4 px-1">🧵 {post.thread_order}</Badge>}
                        {post.scheduled_at && <span className="text-[9px] text-muted-foreground ml-auto">{new Date(post.scheduled_at).toLocaleString()}</span>}
                        {post.impressions != null && (
                          <span className="text-[9px] text-muted-foreground ml-auto flex items-center gap-1">
                            <BarChart3 className="w-2 h-2" /> {post.impressions}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {post.status === 'draft' && (
                          <>
                            <Button size="sm" className="h-6 text-[10px] gap-1" onClick={() => handlePost(post)} disabled={isPosting === post.id}>
                              {isPosting === post.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Send className="w-2.5 h-2.5" />} Post
                            </Button>
                            <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={() => {
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              tomorrow.setHours(9, 0, 0, 0);
                              handleSchedule(post, tomorrow.toISOString());
                            }}>
                              <Calendar className="w-2.5 h-2.5" /> Schedule
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditingId(post.id); setEditContent(post.content); }}>
                              <Edit3 className="w-2.5 h-2.5" />
                            </Button>
                            {onOpenCreativeEditor && (
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onOpenCreativeEditor(post)}>
                                <Camera className="w-2.5 h-2.5" />
                              </Button>
                            )}
                          </>
                        )}
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive ml-auto" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {colPosts.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-4 text-center text-[11px] text-muted-foreground">
                    No {config.label.toLowerCase()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
