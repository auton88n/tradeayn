import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Zap, Clock, Settings, Link2, BarChart3, Shield, Bell, FileText, Mail, Calendar, Database, Share2, Workflow, Play, CheckCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const Automation = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: ''
  });

  const fadeInUp = {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0
    },
    transition: {
      duration: 0.6
    }
  };
  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save to database
      const { error: dbError } = await supabase
        .from('service_applications')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message || null,
          service_type: 'automation',
          status: 'new'
        });

      if (dbError) throw dbError;

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke('send-application-email', {
        body: {
          applicantName: formData.fullName,
          applicantEmail: formData.email,
          serviceType: 'Process Automation',
          formData: {
            'Full Name': formData.fullName,
            'Email': formData.email,
            'Phone': formData.phone || 'Not provided',
            'Message': formData.message || 'No message provided'
          }
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
      }

      setIsSuccess(true);
      toast({
        title: "Application submitted",
        description: "We'll be in touch within 24-48 hours.",
      });

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsSuccess(false);
    setFormData({ fullName: '', email: '', phone: '', message: '' });
  };

  const automations = [{
    icon: Mail,
    title: 'Email to CRM Sync',
    hours: '5',
    description: 'Auto-log emails and create contacts'
  }, {
    icon: FileText,
    title: 'Invoice Processing',
    hours: '8',
    description: 'Extract data and update accounting'
  }, {
    icon: Database,
    title: 'Lead Qualification',
    hours: '10',
    description: 'Score and route leads automatically'
  }, {
    icon: BarChart3,
    title: 'Report Generation',
    hours: '6',
    description: 'Automated weekly/monthly reports'
  }, {
    icon: Calendar,
    title: 'Meeting Scheduler',
    hours: '3',
    description: 'Smart booking and reminders'
  }, {
    icon: Share2,
    title: 'Social Publishing',
    hours: '4',
    description: 'Schedule and cross-post content'
  }];
  const integrations = [{
    name: 'Slack',
    color: 'bg-purple-500'
  }, {
    name: 'Salesforce',
    color: 'bg-blue-500'
  }, {
    name: 'HubSpot',
    color: 'bg-orange-500'
  }, {
    name: 'Notion',
    color: 'bg-neutral-500'
  }, {
    name: 'Zapier',
    color: 'bg-amber-500'
  }, {
    name: 'Stripe',
    color: 'bg-indigo-500'
  }];
  const features = [{
    icon: Settings,
    title: 'No-Code Builder',
    description: 'Build workflows without writing code'
  }, {
    icon: Link2,
    title: '500+ Integrations',
    description: 'Connect all your favorite tools'
  }, {
    icon: BarChart3,
    title: 'Real-time Monitoring',
    description: 'Track every automation in real-time'
  }, {
    icon: Shield,
    title: 'Error Handling',
    description: 'Smart retry and failure recovery'
  }, {
    icon: Clock,
    title: 'Scheduled Triggers',
    description: 'Run automations on your schedule'
  }, {
    icon: Zap,
    title: 'Custom Webhooks',
    description: 'Trigger from any external event'
  }];
  const steps = [{
    number: '01',
    title: 'Identify',
    description: 'Map your repetitive tasks and bottlenecks'
  }, {
    number: '02',
    title: 'Design',
    description: 'Create optimized workflow blueprints'
  }, {
    number: '03',
    title: 'Automate',
    description: 'Build and test your automations'
  }, {
    number: '04',
    title: 'Monitor',
    description: 'Track performance and optimize'
  }];
  return <div className="min-h-screen bg-neutral-950 text-white">
      {/* Back Button */}
      <Link to="/" className="fixed top-4 md:top-6 left-4 md:left-6 z-50">
        <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 gap-2 bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-full px-4 py-2">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </Link>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 md:px-6 py-20 md:py-24 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-green-500/15 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div className="text-center" initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8
        }}>
            
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-serif font-bold mb-6">
              Process <span className="text-emerald-400">Automation</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-neutral-400 max-w-3xl mx-auto mb-8 md:mb-10 px-4">
              Save 15+ hours per week by automating repetitive tasks. Focus on what matters while we handle the rest.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg rounded-full"
                onClick={() => setIsModalOpen(true)}
              >
                Start Automating
              </Button>
              <Link to="/#services">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full">
                  View All Services
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Workflow Dashboard Showcase */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div className="text-center mb-16" {...fadeInUp} viewport={{
          once: true
        }} whileInView="animate" initial="initial">
            <span className="text-sm font-mono text-emerald-400 tracking-wider uppercase mb-4 block">
              What You'll Get
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4">
              Workflow <span className="text-emerald-400">Dashboard</span>
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Visual workflow builder that makes automation accessible to everyone on your team.
            </p>
          </motion.div>

          <motion.div className="relative" initial={{
          opacity: 0,
          y: 40
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.8
        }}>
            {/* Browser Mockup */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl">
              {/* Browser Header */}
              <div className="bg-neutral-800 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-neutral-700 rounded-lg px-4 py-1.5 text-sm text-neutral-400 text-center">
                    dashboard.aynn.io/workflows
                  </div>
                </div>
              </div>

              {/* Workflow Builder */}
              <div className="p-3 sm:p-4 md:p-8 min-h-[280px] sm:min-h-[350px] md:min-h-[500px] bg-gradient-to-br from-neutral-900 to-neutral-950">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4">
                  <div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold">Lead to CRM Pipeline</h3>
                    <p className="text-[10px] sm:text-xs md:text-sm text-neutral-500">Automatically qualify and sync new leads</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 sm:py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] sm:text-xs md:text-sm">Active</span>
                    <Button size="sm" variant="outline" className="border-neutral-700 text-neutral-300 text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 px-2 sm:px-3">
                      <Play className="w-3 h-3 mr-1" /> Run Now
                    </Button>
                  </div>
                </div>

                {/* Workflow Nodes - Horizontal scroll on mobile with hint */}
                <div className="relative">
                  <div className="overflow-x-auto pb-2 sm:pb-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                    <div className="flex items-center justify-start md:justify-center gap-1.5 sm:gap-2 md:gap-4 py-4 sm:py-8 md:py-12 min-w-max md:min-w-0 px-1">
                      {/* Trigger */}
                      {/* Trigger - AI Analysis */}
                      <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg sm:rounded-xl p-2.5 sm:p-4 md:p-6 text-center min-w-[90px] sm:min-w-[110px] md:min-w-[160px]">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-emerald-500 rounded-lg mx-auto mb-1.5 sm:mb-2 md:mb-3 flex items-center justify-center">
                          <Brain className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <p className="font-medium text-xs sm:text-sm md:text-base">AI Analysis</p>
                        <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1">Trigger</p>
                      </div>

                      <div className="w-4 sm:w-6 md:w-12 h-px bg-emerald-500/30 relative flex-shrink-0">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full" />
                      </div>

                      {/* Process - Score Check */}
                      <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg sm:rounded-xl p-2.5 sm:p-4 md:p-6 text-center min-w-[90px] sm:min-w-[110px] md:min-w-[160px]">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-amber-500 rounded-lg mx-auto mb-1.5 sm:mb-2 md:mb-3 flex items-center justify-center">
                          <Workflow className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <p className="font-medium text-xs sm:text-sm md:text-base">Score Check</p>
                        <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1">Process</p>
                      </div>

                      <div className="w-4 sm:w-6 md:w-12 h-px bg-amber-500/30 relative flex-shrink-0">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-amber-500 rounded-full" />
                      </div>

                      {/* Action - Add to CRM */}
                      <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg sm:rounded-xl p-2.5 sm:p-4 md:p-6 text-center min-w-[90px] sm:min-w-[110px] md:min-w-[160px]">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-500 rounded-lg mx-auto mb-1.5 sm:mb-2 md:mb-3 flex items-center justify-center">
                          <Database className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <p className="font-medium text-xs sm:text-sm md:text-base">Add to CRM</p>
                        <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1">Action</p>
                      </div>
                    </div>
                  </div>
                  {/* Scroll hint for mobile */}
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-neutral-900 to-transparent pointer-events-none md:hidden" />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6 md:mt-8">
                  <div className="bg-neutral-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center">
                    <p className="text-base sm:text-xl md:text-2xl font-bold text-emerald-400">2,847</p>
                    <p className="text-[10px] sm:text-xs text-neutral-500">Runs Today</p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center">
                    <p className="text-base sm:text-xl md:text-2xl font-bold text-blue-400">99.8%</p>
                    <p className="text-[10px] sm:text-xs text-neutral-500">Success Rate</p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center">
                    <p className="text-base sm:text-xl md:text-2xl font-bold text-amber-400">1.2s</p>
                    <p className="text-[10px] sm:text-xs text-neutral-500">Avg. Time</p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center">
                    <p className="text-base sm:text-xl md:text-2xl font-bold text-purple-400">847</p>
                    <p className="text-[10px] sm:text-xs text-neutral-500">Leads Synced</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Stats Cards - Hidden on mobile */}
            <motion.div className="absolute -right-4 lg:-right-16 top-1/4 bg-neutral-900/90 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-3 md:p-4 shadow-xl hidden md:block" initial={{
            opacity: 0,
            x: 20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.3
          }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Hours Saved</p>
                  <p className="text-base md:text-lg font-bold text-emerald-400">18+ hrs/week</p>
                </div>
              </div>
            </motion.div>

            <motion.div className="absolute -left-4 lg:-left-16 top-1/2 bg-neutral-900/90 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-3 md:p-4 shadow-xl hidden md:block" initial={{
            opacity: 0,
            x: -20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.4
          }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Tasks Automated</p>
                  <p className="text-base md:text-lg font-bold text-blue-400">1.2M+ monthly</p>
                </div>
              </div>
            </motion.div>

            <motion.div className="absolute -right-4 lg:-right-16 bottom-1/4 bg-neutral-900/90 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-3 md:p-4 shadow-xl hidden md:block" initial={{
            opacity: 0,
            x: 20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.5
          }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Error Reduction</p>
                  <p className="text-base md:text-lg font-bold text-amber-400">95%</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Popular Automations */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-neutral-900/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div className="text-center mb-12 md:mb-16" {...fadeInUp} viewport={{
          once: true
        }} whileInView="animate" initial="initial">
            <span className="text-sm font-mono text-emerald-400 tracking-wider uppercase mb-4 block">
              Templates
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4">
              Popular <span className="text-emerald-400">Automations</span>
            </h2>
            <p className="text-base md:text-lg text-neutral-400 max-w-2xl mx-auto px-4">
              Start with proven templates and customize them to fit your workflow.
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" variants={staggerContainer} initial="initial" whileInView="animate" viewport={{
          once: true
        }}>
            {automations.map((automation, index) => <motion.div key={automation.title} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 md:p-6 hover:border-emerald-500/30 transition-colors group cursor-pointer" variants={fadeInUp}>
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <automation.icon className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
                  </div>
                  <span className="px-2 md:px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                    Save {automation.hours} hrs/week
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2">{automation.title}</h3>
                <p className="text-neutral-400 text-sm">{automation.description}</p>
              </motion.div>)}
          </motion.div>
        </div>
      </section>


      {/* Features Grid */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-neutral-900/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div className="text-center mb-12 md:mb-16" {...fadeInUp} viewport={{
          once: true
        }} whileInView="animate" initial="initial">
            <span className="text-sm font-mono text-emerald-400 tracking-wider uppercase mb-4 block">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold">
              Everything You <span className="text-emerald-400">Need</span>
            </h2>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" variants={staggerContainer} initial="initial" whileInView="animate" viewport={{
          once: true
        }}>
            {features.map((feature, index) => <motion.div key={feature.title} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 hover:border-emerald-500/30 transition-colors" variants={fadeInUp}>
                <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-500/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                  <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-emerald-400" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">{feature.title}</h3>
                <p className="text-sm md:text-base text-neutral-400">{feature.description}</p>
              </motion.div>)}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div className="text-center mb-12 md:mb-16" {...fadeInUp} viewport={{
          once: true
        }} whileInView="animate" initial="initial">
            <span className="text-sm font-mono text-emerald-400 tracking-wider uppercase mb-4 block">
              Process
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold">
              How It <span className="text-emerald-400">Works</span>
            </h2>
          </motion.div>

          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8" variants={staggerContainer} initial="initial" whileInView="animate" viewport={{
          once: true
        }}>
            {steps.map((step, index) => <motion.div key={step.number} className="text-center relative" variants={fadeInUp}>
                {index < steps.length - 1 && <div className="hidden md:block absolute top-6 md:top-8 left-1/2 w-full h-px bg-neutral-800" />}
                <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-xl md:rounded-2xl mx-auto mb-4 md:mb-6 flex items-center justify-center relative z-10">
                  <span className="text-lg md:text-xl font-bold text-emerald-400">{step.number}</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">{step.title}</h3>
                <p className="text-neutral-400 text-xs md:text-sm">{step.description}</p>
              </motion.div>)}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-b from-neutral-900 to-neutral-950">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-serif font-bold mb-6">
              Ready to Reclaim <span className="text-emerald-400">Your Time?</span>
            </h2>
            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-8 md:mb-10 px-4">
              Join thousands of businesses saving 15+ hours every week with intelligent automation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button 
                size="lg" 
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 md:px-10 py-5 md:py-6 text-base md:text-lg rounded-full w-full sm:w-auto"
                onClick={() => setIsModalOpen(true)}
              >
                Start Automating
              </Button>
              <Link to="/#services" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 md:px-10 py-5 md:py-6 text-base md:text-lg rounded-full w-full">
                  View All Services
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 px-4 md:px-6 border-t border-neutral-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">AYN</span>
            </div>
            
          </div>
        </div>
      </footer>

      {/* Application Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Application Submitted!</h3>
              <p className="text-neutral-400 mb-6">
                We'll be in touch within 24-48 hours.
              </p>
              <Button onClick={handleCloseModal} className="bg-emerald-500 hover:bg-emerald-600">
                Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-serif">Get Started with Automation</DialogTitle>
                <DialogDescription className="text-neutral-400">
                  Tell us a bit about yourself and we'll reach out within 24-48 hours.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    placeholder="Your name"
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
                    className="bg-neutral-800 border-neutral-700 text-white"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Brief Message (optional)</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="bg-neutral-800 border-neutral-700 text-white resize-none"
                    placeholder="Tell us briefly about your needs..."
                    rows={3}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
                
                <p className="text-xs text-neutral-500 text-center">
                  Need more options?{' '}
                  <Link to="/services/automation/apply" className="text-emerald-400 hover:underline">
                    Fill out the detailed form
                  </Link>
                </p>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>;
};
export default Automation;
