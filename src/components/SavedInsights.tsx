import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Bookmark, Trash2, Plus } from 'lucide-react';

interface SavedInsight {
  id: string;
  insight_text: string;
  category: string;
  created_at: string;
  tags: string[];
}

interface SavedInsightsProps {
  userId: string;
}

export const SavedInsights = ({ userId }: SavedInsightsProps) => {
  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadSavedInsights();
    }
  }, [userId]);

  const loadSavedInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setSavedInsights(data || []);
    } catch (error) {
      console.error('Error loading saved insights:', error);
      toast({
        title: "Error",
        description: "Failed to load saved insights.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveInsight = async (insightText: string, category: string = 'general') => {
    try {
      const { data, error } = await supabase
        .from('saved_insights')
        .insert({
          user_id: userId,
          insight_text: insightText,
          category: category,
          tags: []
        })
        .select()
        .single();

      if (error) throw error;

      setSavedInsights(prev => [data, ...prev.slice(0, 9)]);
      
      toast({
        title: "💾 Insight Saved",
        description: "Added to your saved insights collection."
      });
    } catch (error) {
      console.error('Error saving insight:', error);
      toast({
        title: "Error",
        description: "Failed to save insight.",
        variant: "destructive"
      });
    }
  };

  const copyInsight = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "📋 Copied!",
        description: "Insight copied to clipboard."
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error", 
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const deleteInsight = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_insights')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedInsights(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "🗑️ Deleted",
        description: "Insight removed from your collection."
      });
    } catch (error) {
      console.error('Error deleting insight:', error);
      toast({
        title: "Error",
        description: "Failed to delete insight.",
        variant: "destructive"
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'general': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      'revenue': 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
      'strategy': 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
      'marketing': 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200',
      'operations': 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">📚 Your Saved Insights</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">📚 Your Saved Insights</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => saveInsight("Example insight for testing", "general")}
          className="text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      {savedInsights.length === 0 ? (
        <Card className="p-6 text-center">
          <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2">No saved insights yet</p>
          <p className="text-xs text-muted-foreground">
            Save important advice from AYN to reference later
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {savedInsights.map((item) => (
            <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`text-xs ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed break-words">
                    {item.insight_text}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyInsight(item.insight_text)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => deleteInsight(item.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          💡 Click the bookmark icon on any AYN response to save it
        </p>
      </div>
    </div>
  );
};

// Export the saveInsight function for use in other components
export const useSaveInsight = (userId: string) => {
  const { toast } = useToast();

  const saveInsight = async (insightText: string, category: string = 'general') => {
    try {
      const { error } = await supabase
        .from('saved_insights')
        .insert({
          user_id: userId,
          insight_text: insightText,
          category: category,
          tags: []
        });

      if (error) throw error;

      toast({
        title: "💾 Insight Saved",
        description: "Added to your saved insights collection."
      });
      
      return true;
    } catch (error) {
      console.error('Error saving insight:', error);
      toast({
        title: "Error",
        description: "Failed to save insight.",
        variant: "destructive"
      });
      return false;
    }
  };

  return { saveInsight };
};