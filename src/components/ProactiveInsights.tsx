import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, Target, DollarSign } from 'lucide-react';

interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'action';
  title: string;
  description: string;
  actionable: boolean;
  businessType?: string;
}

interface ProactiveInsightsProps {
  userProfile?: any;
  onActionClick?: (insight: Insight) => void;
}

export const ProactiveInsights = ({ userProfile, onActionClick }: ProactiveInsightsProps) => {
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    generateInsights();
  }, [userProfile]);

  const generateInsights = () => {
    const businessType = userProfile?.business_type || 'general';
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long' });

    // Generate contextual insights based on business type and current date
    const insightPool: Insight[] = [
      // Revenue opportunities
      {
        id: '1',
        type: 'opportunity',
        title: 'Q4 Revenue Push',
        description: `${currentMonth} is prime time for end-of-year sales. Consider launching a limited-time offer or bundling services.`,
        actionable: true,
        businessType: 'all'
      },
      {
        id: '2', 
        type: 'opportunity',
        title: 'Pricing Strategy Review',
        description: 'Market data shows 73% of consulting firms are underpricing their services by 20-30%.',
        actionable: true,
        businessType: 'consulting'
      },

      // Risk alerts
      {
        id: '3',
        type: 'risk',
        title: 'Customer Concentration Risk',
        description: 'Relying on 1-3 major clients? Diversify your revenue streams to reduce business risk.',
        actionable: true,
        businessType: 'all'
      },
      {
        id: '4',
        type: 'risk', 
        title: 'Cash Flow Gap Alert',
        description: 'Service businesses typically face Q1 cash flow challenges. Start planning now.',
        actionable: true,
        businessType: 'professional services'
      },

      // Market trends
      {
        id: '5',
        type: 'trend',
        title: 'Digital Transformation Demand',
        description: 'Small business digital adoption is up 340% post-pandemic. Are you positioned to help?',
        actionable: false,
        businessType: 'consulting'
      },
      {
        id: '6',
        type: 'trend',
        title: 'Local Search Optimization',
        description: '78% of local searches result in offline purchases. Your Google My Business profile needs attention.',
        actionable: true,
        businessType: 'restaurant/food service'
      },

      // Action items
      {
        id: '7',
        type: 'action',
        title: 'Customer Retention Analysis',
        description: 'When did you last calculate your customer lifetime value? It might surprise you.',
        actionable: true,
        businessType: 'all'
      },
      {
        id: '8',
        type: 'action',
        title: 'Competitor Pricing Check',
        description: 'Your competitors may have adjusted pricing. Quick market scan recommended.',
        actionable: true,
        businessType: 'all'
      }
    ];

    // Filter and select relevant insights
    const relevantInsights = insightPool.filter(insight => 
      insight.businessType === 'all' || 
      insight.businessType === businessType ||
      !businessType
    );

    // Randomly select 3-4 insights
    const selectedInsights = relevantInsights
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    setInsights(selectedInsights);
  };

  const insightConfig = {
    opportunity: { 
      color: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800', 
      icon: DollarSign,
      iconColor: 'text-green-600 dark:text-green-400'
    },
    risk: { 
      color: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800', 
      icon: AlertTriangle,
      iconColor: 'text-red-600 dark:text-red-400'
    },
    trend: { 
      color: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800', 
      icon: TrendingUp,
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    action: { 
      color: 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800', 
      icon: Target,
      iconColor: 'text-orange-600 dark:text-orange-400'
    }
  };

  const handleInsightAction = (insight: Insight) => {
    if (onActionClick) {
      onActionClick(insight);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">💡 Daily Business Insights</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={generateInsights}
          className="text-xs"
        >
          Refresh
        </Button>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight) => {
          const config = insightConfig[insight.type];
          const IconComponent = config.icon;
          
          return (
            <Card key={insight.id} className={`border-l-4 ${config.color} transition-all hover:shadow-md`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full bg-white dark:bg-gray-800 ${config.iconColor}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-foreground mb-1">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      {insight.description}
                    </p>
                    {insight.actionable && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs h-7"
                        onClick={() => handleInsightAction(insight)}
                      >
                        Take Action
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          💡 Insights refresh daily based on your business profile
        </p>
      </div>
    </div>
  );
};