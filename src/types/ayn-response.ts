// Enhanced AYN Response Types for Competitive Intelligence

export interface AYNResponse {
  type: 'analysis' | 'recommendation' | 'reality_check' | 'opportunity' | 'warning';
  mood: 'focused' | 'direct' | 'challenging' | 'supportive' | 'urgent';
  content: {
    headline: string;           // One punchy line
    keyPoint: string;          // Single most important insight  
    action: string;            // One clear next step
    context?: string;          // Brief supporting detail (optional)
    rawContent?: string;       // Original response for fallback
  };
  visual: {
    confidence: number;        // 0-100 confidence bar
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;          // Business area (pricing, growth, revenue, etc.)
    healthScore?: number;      // 0-100 business health indicator
  };
  predictions?: {
    shortTerm: string;         // What will happen in 1-3 months
    impact: 'positive' | 'negative' | 'neutral';
    probability: number;       // 0-100
  }[];
  contextualActions?: {
    id: string;
    label: string;
    icon: string;
    type: 'primary' | 'secondary' | 'warning';
    urgency: 'immediate' | 'this_week' | 'this_month';
  }[];
}

export interface BusinessPulse {
  overallScore: number;      // 0-100 overall business health
  categories: {
    pricing: number;
    marketing: number;
    operations: number;
    finance: number;
    strategy: number;
  };
  criticalInsights: string[];
  opportunities: string[];
  risks: string[];
}

export interface EnhancedMessage {
  id: string;
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed';
  
  // Enhanced AYN-specific fields
  aynResponse?: AYNResponse;
  businessPulse?: BusinessPulse;
  
  // Legacy metadata for backward compatibility
  metadata?: {
    mood?: string;
    businessType?: string;
    insights?: string[];
    actionItems?: string[];
    followUp?: string[];
  };
}

// Response templates for consistency
export const responseTemplates = {
  pricing: {
    headlines: [
      "Your pricing is [assessment]",
      "Pricing strategy reality check",
      "[Problem] is killing your margins"
    ],
    categories: ["pricing", "revenue", "positioning"]
  },
  growth: {
    headlines: [
      "[Business] growth bottleneck identified",
      "Growth acceleration opportunity",
      "Scaling roadblock ahead"
    ],
    categories: ["growth", "scaling", "strategy"]
  },
  revenue: {
    headlines: [
      "Revenue gap: [specific problem]",
      "Revenue optimization needed",
      "Money left on the table"
    ],
    categories: ["revenue", "sales", "conversion"]
  },
  operations: {
    headlines: [
      "Operational efficiency issue",
      "Process improvement needed",
      "Cost optimization opportunity"
    ],
    categories: ["operations", "efficiency", "costs"]
  }
};

export const moodIndicators = {
  focused: { emoji: "🎯", color: "#00ff88", description: "Laser-focused analysis" },
  direct: { emoji: "⚡", color: "#ff4444", description: "Direct, no-nonsense advice" },
  challenging: { emoji: "🔥", color: "#ff6b35", description: "Challenging your assumptions" },
  supportive: { emoji: "💡", color: "#4a90e2", description: "Supportive guidance" },
  urgent: { emoji: "🚨", color: "#ff0066", description: "Urgent action required" }
};

export const priorityLevels = {
  low: { color: "#4a90e2", label: "Monitor", urgency: "Address when convenient" },
  medium: { color: "#ffaa00", label: "Important", urgency: "Address this week" },
  high: { color: "#ff6b35", label: "Critical", urgency: "Address today" },
  critical: { color: "#ff0066", label: "URGENT", urgency: "Address immediately" }
};