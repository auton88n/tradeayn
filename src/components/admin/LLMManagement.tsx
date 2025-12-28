import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Zap,
  TrendingUp,
  Activity
} from 'lucide-react';

interface LLMModel {
  id: string;
  provider: string;
  model_id: string;
  display_name: string;
  intent_type: string;
  priority: number | null;
  is_enabled: boolean | null;
  cost_per_1k_input: number | null;
  cost_per_1k_output: number | null;
  max_tokens: number | null;
  supports_streaming: boolean | null;
}

interface ModelHealth {
  modelId: string;
  successCount: number;
  failureCount: number;
  lastFailure: string | null;
  uptime: number;
}

export function LLMManagement() {
  const [models, setModels] = useState<LLMModel[]>([]);
  const [healthData, setHealthData] = useState<Record<string, ModelHealth>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('llm_models')
        .select('*')
        .order('intent_type')
        .order('priority');

      if (error) throw error;
      setModels(data || []);

      // Fetch health data
      const { data: usageLogs } = await supabase
        .from('llm_usage_logs')
        .select('model_id, was_fallback, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: failures } = await supabase
        .from('llm_failures')
        .select('model_id, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Calculate health per model
      const health: Record<string, ModelHealth> = {};
      (data || []).forEach((model: LLMModel) => {
        const modelUsage = (usageLogs || []).filter((l: { model_id: string | null }) => l.model_id === model.id);
        const modelFailures = (failures || []).filter((f: { model_id: string | null }) => f.model_id === model.id);
        const total = modelUsage.length + modelFailures.length;
        
        health[model.id] = {
          modelId: model.id,
          successCount: modelUsage.length,
          failureCount: modelFailures.length,
          lastFailure: modelFailures.length > 0 ? (modelFailures[0] as { created_at: string }).created_at : null,
          uptime: total > 0 ? (modelUsage.length / total) * 100 : 100
        };
      });
      setHealthData(health);
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error('Failed to load LLM models');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const toggleModel = async (modelId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('llm_models')
        .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
        .eq('id', modelId);

      if (error) throw error;

      setModels(prev => prev.map(m => 
        m.id === modelId ? { ...m, is_enabled: enabled } : m
      ));
      toast.success(`Model ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling model:', error);
      toast.error('Failed to update model');
    }
  };

  const getStatusIcon = (uptime: number) => {
    if (uptime >= 99) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (uptime >= 95) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'lovable': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'openrouter': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.intent_type]) acc[model.intent_type] = [];
    acc[model.intent_type].push(model);
    return acc;
  }, {} as Record<string, LLMModel[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5" />
            LLM Model Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure and monitor AI models with fallback chains
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => { setIsRefreshing(true); fetchModels(); }}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Models</p>
                <p className="text-2xl font-bold">{models.filter(m => m.is_enabled).length}</p>
              </div>
              <Zap className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Uptime (24h)</p>
                <p className="text-2xl font-bold">
                  {Object.values(healthData).length > 0 
                    ? (Object.values(healthData).reduce((a, b) => a + b.uptime, 0) / Object.values(healthData).length).toFixed(1)
                    : '100'}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Calls (24h)</p>
                <p className="text-2xl font-bold">
                  {Object.values(healthData).reduce((a, b) => a + b.successCount, 0)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failures (24h)</p>
                <p className="text-2xl font-bold text-red-500">
                  {Object.values(healthData).reduce((a, b) => a + b.failureCount, 0)}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Models by Intent */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-6">
          {Object.entries(groupedModels).map(([intent, intentModels]) => (
            <Card key={intent}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base capitalize flex items-center gap-2">
                  {intent} Models
                  <Badge variant="outline" className="ml-2">
                    {intentModels.length} model{intentModels.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {intentModels.map((model, index) => {
                    const health = healthData[model.id] || { uptime: 100, successCount: 0, failureCount: 0 };
                    return (
                      <div 
                        key={model.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-4">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                            {getStatusIcon(health.uptime)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{model.display_name}</span>
                              <Badge variant="outline" className={getProviderColor(model.provider)}>
                                {model.provider}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{model.model_id}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-500">{health.successCount}</span>
                              <span className="text-muted-foreground">/</span>
                              <span className="text-sm text-red-500">{health.failureCount}</span>
                            </div>
                            <Progress 
                              value={health.uptime} 
                              className="h-1 w-20"
                            />
                          </div>
                          <Switch
                            checked={model.is_enabled ?? false}
                            onCheckedChange={(checked) => toggleModel(model.id, checked)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
