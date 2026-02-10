import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Eye, Heart, Repeat, MessageCircle, Loader2 } from 'lucide-react';

interface TwitterPost {
  id: string;
  content: string;
  status: string;
  content_type: string | null;
  target_audience: string | null;
  psychological_strategy: string | null;
  impressions: number | null;
  likes: number | null;
  retweets: number | null;
  replies: number | null;
  created_at: string;
  posted_at: string | null;
}

const COLORS = ['hsl(0, 0%, 15%)', 'hsl(0, 0%, 35%)', 'hsl(0, 0%, 55%)', 'hsl(0, 0%, 75%)'];

export const AnalyticsDashboard = () => {
  const [posts, setPosts] = useState<TwitterPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('twitter_posts')
        .select('*')
        .eq('status', 'posted')
        .order('created_at', { ascending: false })
        .limit(50);
      setPosts((data as unknown as TwitterPost[]) || []);
      setIsLoading(false);
    };
    load();
  }, []);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (posts.length === 0) return <div className="text-center py-12 text-sm text-muted-foreground">No posted tweets yet. Generate and post content to see analytics.</div>;

  const totalImpressions = posts.reduce((s, p) => s + (p.impressions || 0), 0);
  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0);
  const totalRetweets = posts.reduce((s, p) => s + (p.retweets || 0), 0);
  const totalReplies = posts.reduce((s, p) => s + (p.replies || 0), 0);

  // Content type breakdown
  const typeBreakdown = posts.reduce((acc, p) => {
    const type = p.content_type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(typeBreakdown).map(([name, value]) => ({ name, value }));

  // Engagement over time (last 14 posts)
  const timeData = posts.slice(0, 14).reverse().map(p => ({
    date: new Date(p.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    impressions: p.impressions || 0,
    likes: p.likes || 0,
    retweets: p.retweets || 0,
  }));

  // Best performers
  const topPosts = [...posts].sort((a, b) => ((b.likes || 0) + (b.retweets || 0)) - ((a.likes || 0) + (a.retweets || 0))).slice(0, 3);

  // Audience breakdown
  const audienceData = posts.reduce((acc, p) => {
    const aud = p.target_audience || 'general';
    if (!acc[aud]) acc[aud] = { impressions: 0, likes: 0, count: 0 };
    acc[aud].impressions += p.impressions || 0;
    acc[aud].likes += p.likes || 0;
    acc[aud].count += 1;
    return acc;
  }, {} as Record<string, { impressions: number; likes: number; count: number }>);
  const audienceBarData = Object.entries(audienceData).map(([name, v]) => ({ name, ...v, engagementRate: v.impressions > 0 ? ((v.likes / v.impressions) * 100).toFixed(1) : '0' }));

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Impressions', value: totalImpressions, icon: Eye, color: 'text-foreground' },
          { label: 'Likes', value: totalLikes, icon: Heart, color: 'text-foreground' },
          { label: 'Retweets', value: totalRetweets, icon: Repeat, color: 'text-foreground' },
          { label: 'Replies', value: totalReplies, icon: MessageCircle, color: 'text-foreground' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Engagement over time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Engagement Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timeData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="impressions" stroke="hsl(0, 0%, 15%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="likes" stroke="hsl(0, 0%, 50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Content type breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Content Type Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Audience performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Audience Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={audienceBarData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="likes" fill="hsl(0, 0%, 25%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top performers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">🏆 Top Performers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topPosts.map((post, i) => (
              <div key={post.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] leading-relaxed line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {post.likes != null && <span className="text-[10px] text-muted-foreground">♥ {post.likes}</span>}
                    {post.retweets != null && <span className="text-[10px] text-muted-foreground">🔄 {post.retweets}</span>}
                    {post.impressions != null && <span className="text-[10px] text-muted-foreground">👁 {post.impressions}</span>}
                    {post.content_type && <Badge variant="secondary" className="text-[8px] h-3 px-1">{post.content_type}</Badge>}
                  </div>
                </div>
              </div>
            ))}
            {topPosts.length === 0 && <p className="text-xs text-muted-foreground text-center">No engagement data yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
