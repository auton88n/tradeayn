import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Rocket } from 'lucide-react';

interface BusinessProfileSetupProps {
  userId: string;
  onComplete: () => void;
}

export const BusinessProfileSetup = ({ userId, onComplete }: BusinessProfileSetupProps) => {
  const [formData, setFormData] = useState({
    businessType: '',
    companyName: '',
    goals: '',
    challenges: '',
    currentRevenue: '',
    targetRevenue: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const businessTypes = [
    'Restaurant/Food Service',
    'Retail/E-commerce', 
    'Professional Services',
    'Technology/SaaS',
    'Healthcare',
    'Real Estate',
    'Manufacturing',
    'Consulting',
    'Marketing/Advertising',
    'Financial Services',
    'Education/Training',
    'Other'
  ];

  const handleSubmit = async () => {
    if (!formData.businessType || !formData.companyName) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least your business type and company name.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const businessContext = `Goals: ${formData.goals}. Challenges: ${formData.challenges}. Current revenue: ${formData.currentRevenue}. Target: ${formData.targetRevenue}.`;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          business_type: formData.businessType,
          business_context: businessContext,
          company_name: formData.companyName
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "🚀 Profile Complete!",
        description: "AYN is now ready to provide you with personalized business insights."
      });

      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Setup Error",
        description: "Failed to save your business profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-muted/20">
      <Card className="max-w-2xl mx-auto w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">🚀 Let's Set Up Your Business Profile</CardTitle>
          <CardDescription className="text-lg">
            Help AYN understand your business so I can give you brutally honest, targeted advice
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Type *</label>
              <Select onValueChange={(value) => setFormData({...formData, businessType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="What type of business do you run?" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map(type => (
                    <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name *</label>
              <Input
                placeholder="Your business name"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Business Goals</label>
            <Textarea
              placeholder="What are your main business goals? (e.g., grow revenue, expand market, improve efficiency)"
              value={formData.goals}
              onChange={(e) => setFormData({...formData, goals: e.target.value})}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Current Challenges</label>
            <Textarea
              placeholder="What are your biggest challenges right now?"
              value={formData.challenges}
              onChange={(e) => setFormData({...formData, challenges: e.target.value})}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Monthly Revenue</label>
              <Input
                placeholder="e.g., $10,000"
                value={formData.currentRevenue}
                onChange={(e) => setFormData({...formData, currentRevenue: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target Monthly Revenue</label>
              <Input
                placeholder="e.g., $50,000"
                value={formData.targetRevenue}
                onChange={(e) => setFormData({...formData, targetRevenue: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button 
              onClick={handleSubmit} 
              className="w-full bg-gradient-primary hover:opacity-90 text-white"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up your profile...
                </div>
              ) : (
                <>
                  🔥 Let's Get Brutally Honest
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};