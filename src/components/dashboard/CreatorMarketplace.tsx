import React, { useState, useEffect } from 'react';
import { supabaseApi, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Instagram, Youtube, Users, TrendingUp, CheckCircle, ArrowLeft, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreatorProfile {
  id: string;
  display_name: string;
  bio: string | null;
  profile_image_url: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  twitter_handle: string | null;
  follower_count: string | null;
  engagement_rate: number | null;
  content_niche: string[] | null;
  is_verified: boolean;
}

interface CreatorMarketplaceProps {
  accessToken: string;
  onBack: () => void;
}

const CreatorMarketplace: React.FC<CreatorMarketplaceProps> = ({ accessToken, onBack }) => {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [followerFilter, setFollowerFilter] = useState<string>('all');

  useEffect(() => {
    loadCreators();
  }, [accessToken]);

  const loadCreators = async () => {
    try {
      setIsLoading(true);
      const data = await supabaseApi.get<CreatorProfile[]>(
        'creator_profiles?is_published=eq.true&select=*',
        accessToken
      );
      setCreators(data || []);
    } catch (error) {
      console.error('Error loading creators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCreators = creators.filter(creator => {
    const matchesSearch = !searchQuery || 
      creator.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.content_niche?.some(n => n.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesNiche = nicheFilter === 'all' || 
      creator.content_niche?.includes(nicheFilter);
    
    const matchesFollowers = followerFilter === 'all' || 
      creator.follower_count === followerFilter;
    
    return matchesSearch && matchesNiche && matchesFollowers;
  });

  const allNiches = [...new Set(creators.flatMap(c => c.content_niche || []))];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Discover Creators</h1>
              <p className="text-muted-foreground">Find content creators for your brand partnerships</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, bio, or niche..."
                className="pl-10 rounded-xl"
              />
            </div>
            <div className="flex gap-4">
              <Select value={nicheFilter} onValueChange={setNicheFilter}>
                <SelectTrigger className="w-[150px] rounded-xl">
                  <SelectValue placeholder="Niche" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Niches</SelectItem>
                  {allNiches.map(niche => (
                    <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={followerFilter} onValueChange={setFollowerFilter}>
                <SelectTrigger className="w-[150px] rounded-xl">
                  <SelectValue placeholder="Followers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="1K - 10K">1K - 10K</SelectItem>
                  <SelectItem value="10K - 50K">10K - 50K</SelectItem>
                  <SelectItem value="50K - 100K">50K - 100K</SelectItem>
                  <SelectItem value="100K - 500K">100K - 500K</SelectItem>
                  <SelectItem value="500K+">500K+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No creators found</h3>
            <p className="text-muted-foreground">
              {searchQuery || nicheFilter !== 'all' || followerFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No creators have published their profiles yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredCreators.map((creator, index) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-6">
                      {/* Profile Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-16 h-16 ring-2 ring-border">
                          <AvatarImage src={creator.profile_image_url || ''} />
                          <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                            {creator.display_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg truncate">{creator.display_name}</h3>
                            {creator.is_verified && (
                              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          {creator.follower_count && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="w-3 h-3" />
                              {creator.follower_count} followers
                            </div>
                          )}
                          {creator.engagement_rate && (
                            <div className="flex items-center gap-1 text-sm text-green-500">
                              <TrendingUp className="w-3 h-3" />
                              {creator.engagement_rate}% engagement
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bio */}
                      {creator.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {creator.bio}
                        </p>
                      )}

                      {/* Niches */}
                      {creator.content_niche && creator.content_niche.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {creator.content_niche.slice(0, 3).map(niche => (
                            <Badge key={niche} variant="secondary" className="text-xs">
                              {niche}
                            </Badge>
                          ))}
                          {creator.content_niche.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{creator.content_niche.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Social Links */}
                      <div className="flex items-center gap-3 pt-4 border-t border-border">
                        {creator.instagram_handle && (
                          <a
                            href={`https://instagram.com/${creator.instagram_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-pink-500 transition-colors"
                          >
                            <Instagram className="w-5 h-5" />
                          </a>
                        )}
                        {creator.youtube_handle && (
                          <a
                            href={`https://youtube.com/@${creator.youtube_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Youtube className="w-5 h-5" />
                          </a>
                        )}
                        {creator.tiktok_handle && (
                          <span className="text-muted-foreground text-sm">
                            @{creator.tiktok_handle}
                          </span>
                        )}
                        <Button size="sm" variant="outline" className="ml-auto rounded-xl text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          View Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorMarketplace;
