import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Loader2, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AutomationApply = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    industry: '',
    currentTools: [] as string[],
    processesToAutomate: '',
    painPoints: '',
    budget: '',
    timeline: '',
    message: ''
  });

  const toolOptions = [
    { id: 'google-workspace', label: 'Google Workspace' },
    { id: 'microsoft-365', label: 'Microsoft 365' },
    { id: 'slack', label: 'Slack' },
    { id: 'notion', label: 'Notion' },
    { id: 'airtable', label: 'Airtable' },
    { id: 'salesforce', label: 'Salesforce' },
    { id: 'hubspot', label: 'HubSpot' },
    { id: 'zapier', label: 'Zapier' },
    { id: 'other', label: 'Other' }
  ];

  const handleToolToggle = (toolId: string) => {
    setFormData(prev => ({
      ...prev,
      currentTools: prev.currentTools.includes(toolId)
        ? prev.currentTools.filter(t => t !== toolId)
        : [...prev.currentTools, toolId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error: dbError } = await supabase
        .from('service_applications')
        .insert({
          service_type: 'automation',
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message || null,
          custom_fields: {
            companyName: formData.companyName,
            industry: formData.industry,
            currentTools: formData.currentTools,
            processesToAutomate: formData.processesToAutomate,
            painPoints: formData.painPoints,
            budget: formData.budget,
            timeline: formData.timeline
          }
        });

      if (dbError) throw dbError;

      await supabase.functions.invoke('send-application-email', {
        body: {
          serviceType: 'Process Automation',
          applicantName: formData.fullName,
          applicantEmail: formData.email,
          formData: formData
        }
      });

      setIsSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-4">Application Received!</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for your interest in our Process Automation service. 
            We'll analyze your requirements and get back to you within 24-48 hours.
          </p>
          <Button onClick={() => navigate('/services/automation')}>
            Back to Service Page
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/services/automation">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-xl font-bold">Apply for Process Automation</h1>
            <p className="text-sm text-muted-foreground">Tell us about your workflows</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Contact Info */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-border pb-2">Contact Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Your company"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ecommerce">E-commerce & Retail</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance & Banking</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="marketing">Marketing & Agency</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="saas">SaaS & Technology</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Current Tools */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-border pb-2">Current Tools & Systems</h2>
            
            <div className="space-y-2">
              <Label>Select the tools you currently use</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {toolOptions.map((tool) => (
                  <div key={tool.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={tool.id}
                      checked={formData.currentTools.includes(tool.id)}
                      onCheckedChange={() => handleToolToggle(tool.id)}
                    />
                    <Label htmlFor={tool.id} className="text-sm font-normal cursor-pointer">
                      {tool.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Automation Requirements */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-border pb-2">Automation Requirements</h2>
            
            <div className="space-y-2">
              <Label htmlFor="processesToAutomate">Processes to Automate *</Label>
              <Textarea
                id="processesToAutomate"
                required
                value={formData.processesToAutomate}
                onChange={(e) => setFormData({ ...formData, processesToAutomate: e.target.value })}
                placeholder="Describe the manual processes you want to automate. E.g., lead follow-ups, invoice generation, data entry..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="painPoints">Current Pain Points</Label>
              <Textarea
                id="painPoints"
                value={formData.painPoints}
                onChange={(e) => setFormData({ ...formData, painPoints: e.target.value })}
                placeholder="What challenges do you face with your current processes? How much time do they take?"
                rows={3}
              />
            </div>
          </section>

          {/* Project Details */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-border pb-2">Project Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget Range *</Label>
                <Select
                  value={formData.budget}
                  onValueChange={(value) => setFormData({ ...formData, budget: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-2k">Under $2,000</SelectItem>
                    <SelectItem value="2k-5k">$2,000 - $5,000</SelectItem>
                    <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                    <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                    <SelectItem value="over-25k">Over $25,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeline">Desired Timeline *</Label>
                <Select
                  value={formData.timeline}
                  onValueChange={(value) => setFormData({ ...formData, timeline: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asap">ASAP</SelectItem>
                    <SelectItem value="2-weeks">2 Weeks</SelectItem>
                    <SelectItem value="1-month">1 Month</SelectItem>
                    <SelectItem value="2-3-months">2-3 Months</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Additional Information</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Any other details about your automation needs..."
                rows={4}
              />
            </div>
          </section>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting || !formData.fullName || !formData.email || !formData.processesToAutomate}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Application
              </>
            )}
          </Button>
        </motion.form>
      </main>
    </div>
  );
};

export default AutomationApply;
