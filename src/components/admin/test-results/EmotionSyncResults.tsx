import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, CheckCircle2, XCircle, Zap } from 'lucide-react';

interface EmotionTest {
  name: string;
  userMessage: string;
  expectedEmotion: string;
  detectedEmotion?: string;
  passed: boolean;
  eyeColor?: string;
}

interface EmotionSyncResultsProps {
  syncRate?: number;
  emotionTests?: EmotionTest[];
  emotionCoverage?: Record<string, { tested: boolean; matched: boolean }>;
  isLoading?: boolean;
}

// Map emotions to their visual properties
const EMOTION_VISUALS: Record<string, { color: string; emoji: string; description: string }> = {
  'calm': { color: 'hsl(195, 60%, 55%)', emoji: '😌', description: 'Soft Ocean Blue' },
  'happy': { color: 'hsl(35, 85%, 65%)', emoji: '😊', description: 'Warm Peach-Gold' },
  'excited': { color: 'hsl(15, 85%, 60%)', emoji: '🤩', description: 'Electric Coral' },
  'thinking': { color: 'hsl(250, 50%, 55%)', emoji: '🤔', description: 'Royal Indigo' },
  'frustrated': { color: 'hsl(12, 55%, 55%)', emoji: '😤', description: 'Muted Coral' },
  'curious': { color: 'hsl(270, 45%, 60%)', emoji: '🧐', description: 'Muted Lavender' },
  'sad': { color: 'hsl(210, 30%, 50%)', emoji: '😢', description: 'Cool Steel Blue' },
  'mad': { color: 'hsl(0, 65%, 55%)', emoji: '😠', description: 'Deep Crimson' },
  'bored': { color: 'hsl(200, 20%, 60%)', emoji: '😑', description: 'Dull Slate' },
  'comfort': { color: 'hsl(340, 55%, 55%)', emoji: '🤗', description: 'Deep Warm Rose' },
  'supportive': { color: 'hsl(160, 50%, 50%)', emoji: '💚', description: 'Gentle Teal' }
};

export const EmotionSyncResults: React.FC<EmotionSyncResultsProps> = ({
  syncRate,
  emotionTests,
  emotionCoverage,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 animate-pulse" />
              <div className="absolute inset-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 animate-ping opacity-30" />
            </div>
            <span className="text-muted-foreground">Testing eye emotion synchronization...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (syncRate === undefined) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          No emotion sync results yet.
        </CardContent>
      </Card>
    );
  }

  const getEmotionVisual = (emotion: string) => {
    return EMOTION_VISUALS[emotion.toLowerCase()] || EMOTION_VISUALS['calm'];
  };

  return (
    <div className="space-y-4">
      {/* Sync Rate Card */}
      <Card className={`border-2 ${
        syncRate >= 95 
          ? 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-background' 
          : syncRate >= 80 
            ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-background'
            : 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-background'
      }`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Eye Emotion Synchronization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-bold text-primary">{syncRate}%</div>
              <div className="text-sm text-muted-foreground">Sync Accuracy</div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">
                {Object.keys(EMOTION_VISUALS).length} emotions supported
              </span>
            </div>
          </div>
          <Progress value={syncRate} className="h-2" />
        </CardContent>
      </Card>

      {/* Emotion Coverage Grid */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Emotion Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(EMOTION_VISUALS).map(([emotion, visual]) => {
              const coverage = emotionCoverage?.[emotion];
              const tested = coverage?.tested ?? false;
              const matched = coverage?.matched ?? false;
              
              return (
                <div 
                  key={emotion}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    matched 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : tested 
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-background/50 border-border/30 opacity-50'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-full mx-auto mb-2 shadow-lg"
                    style={{ backgroundColor: visual.color }}
                  />
                  <div className="text-xl mb-1">{visual.emoji}</div>
                  <div className="text-xs font-medium capitalize">{emotion}</div>
                  <div className="text-[10px] text-muted-foreground">{visual.description}</div>
                  {tested && (
                    <div className="mt-1">
                      {matched ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500 mx-auto" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Test Details */}
      {emotionTests && emotionTests.length > 0 && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Emotion Detection Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {emotionTests.map((test, idx) => {
                const expectedVisual = getEmotionVisual(test.expectedEmotion);
                const detectedVisual = test.detectedEmotion 
                  ? getEmotionVisual(test.detectedEmotion)
                  : null;
                
                return (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      test.passed 
                        ? 'bg-green-500/5 border-green-500/20' 
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{test.name}</span>
                      {test.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2 italic">
                      "{test.userMessage}"
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span>Expected:</span>
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: expectedVisual.color }}
                        />
                        <Badge variant="outline" className="text-[10px]">
                          {expectedVisual.emoji} {test.expectedEmotion}
                        </Badge>
                      </div>
                      {test.detectedEmotion && detectedVisual && (
                        <div className="flex items-center gap-1">
                          <span>Detected:</span>
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: detectedVisual.color }}
                          />
                          <Badge 
                            variant={test.passed ? 'default' : 'destructive'} 
                            className="text-[10px]"
                          >
                            {detectedVisual.emoji} {test.detectedEmotion}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card className="bg-primary/5 border-primary/30">
        <CardContent className="p-4">
          <div className="text-sm">
            <div className="font-medium text-primary mb-2">How Eye Emotion Sync Works</div>
            <ol className="space-y-1 text-muted-foreground text-xs list-decimal list-inside">
              <li>User sends a message with emotional content</li>
              <li>AYN processes and responds with detected emotion</li>
              <li>Frontend receives emotion via <code className="bg-background/50 px-1 rounded">detectResponseEmotion()</code></li>
              <li>Eye component updates color/animation via <code className="bg-background/50 px-1 rounded">EMOTION_CONFIGS</code></li>
              <li>Visual feedback matches the conversation mood</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmotionSyncResults;
