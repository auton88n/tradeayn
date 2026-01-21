import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Heart, MessageCircle, Smile, Brain, Sparkles } from 'lucide-react';

interface PersonalityTrait {
  name: string;
  description: string;
  score: number;
  examples?: string[];
}

interface PersonalityProfileProps {
  traits?: PersonalityTrait[];
  communicationStyle?: {
    usesLowercase: boolean;
    usesContractions: boolean;
    concise: boolean;
    casualPunctuation: boolean;
    emojiUsage: 'minimal' | 'moderate' | 'frequent';
  };
  overallPersonalityScore?: number;
  isLoading?: boolean;
}

const EXPECTED_TRAITS: PersonalityTrait[] = [
  {
    name: 'Friendly',
    description: 'Warm and approachable in responses',
    score: 0
  },
  {
    name: 'Concise',
    description: 'Avoids walls of text, gets to the point',
    score: 0
  },
  {
    name: 'Empathetic',
    description: 'Shows understanding of user emotions',
    score: 0
  },
  {
    name: 'Professional',
    description: 'Accurate and reliable for technical topics',
    score: 0
  },
  {
    name: 'Playful',
    description: 'Light-hearted when appropriate',
    score: 0
  },
  {
    name: 'Supportive',
    description: 'Encouraging and helpful',
    score: 0
  }
];

export const PersonalityProfile: React.FC<PersonalityProfileProps> = ({
  traits = EXPECTED_TRAITS,
  communicationStyle,
  overallPersonalityScore = 0,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-pink-500 animate-pulse" />
            <span className="text-muted-foreground">Analyzing AYN personality...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTraitIcon = (trait: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Friendly': <Smile className="h-4 w-4 text-yellow-500" />,
      'Concise': <MessageCircle className="h-4 w-4 text-blue-500" />,
      'Empathetic': <Heart className="h-4 w-4 text-pink-500" />,
      'Professional': <Brain className="h-4 w-4 text-purple-500" />,
      'Playful': <Sparkles className="h-4 w-4 text-orange-500" />,
      'Supportive': <Heart className="h-4 w-4 text-green-500" />
    };
    return icons[trait] || <Smile className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Overall Personality Score */}
      <Card className="bg-gradient-to-br from-pink-500/10 to-background border-pink-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            AYN Personality Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-bold text-pink-500">{overallPersonalityScore}%</div>
              <div className="text-sm text-muted-foreground">Personality Consistency</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">AYN عين</div>
              <div className="text-xs text-muted-foreground">Perceptive AI Assistant</div>
            </div>
          </div>
          <Progress value={overallPersonalityScore} className="h-2" />
        </CardContent>
      </Card>

      {/* Personality Traits */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Personality Traits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {traits.map((trait, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border ${
                  trait.score >= 80 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : trait.score >= 60 
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getTraitIcon(trait.name)}
                  <span className="font-medium text-sm">{trait.name}</span>
                </div>
                <Progress value={trait.score} className="h-1.5 mb-2" />
                <div className="text-xs text-muted-foreground">{trait.description}</div>
                <div className="mt-2 text-right">
                  <Badge 
                    variant={trait.score >= 80 ? 'default' : 'secondary'} 
                    className="text-xs"
                  >
                    {trait.score}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Communication Style */}
      {communicationStyle && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Communication Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                <span className="text-sm">Uses lowercase</span>
                {communicationStyle.usesLowercase ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                <span className="text-sm">Uses contractions (don't, can't)</span>
                {communicationStyle.usesContractions ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                <span className="text-sm">Concise responses</span>
                {communicationStyle.concise ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                <span className="text-sm">Casual punctuation</span>
                {communicationStyle.casualPunctuation ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                <span className="text-sm">Emoji usage</span>
                <Badge variant="outline" className="text-xs capitalize">
                  {communicationStyle.emojiUsage}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Philosophy */}
      <Card className="bg-primary/5 border-primary/30">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-lg font-medium text-primary mb-2">i see, i understand, i help</div>
            <div className="text-sm text-muted-foreground">
              AYN (عين = eye) is designed to be a perceptive, friendly, and helpful AI assistant
              that adapts its personality to match user needs while maintaining its core identity.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalityProfile;
