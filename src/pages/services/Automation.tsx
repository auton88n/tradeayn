import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Zap, Clock, Settings, Link2, BarChart3, Shield, Bell, FileText, Mail, Calendar, Database, Share2, Workflow, Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Automation = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const automations = [
    { icon: Mail, title: 'Email to CRM Sync', hours: '5', description: 'Auto-log emails and create contacts' },
    { icon: FileText, title: 'Invoice Processing', hours: '8', description: 'Extract data and update accounting' },
    { icon: Database, title: 'Lead Qualification', hours: '10', description: 'Score and route leads automatically' },
    { icon: BarChart3, title: 'Report Generation', hours: '6', description: 'Automated weekly/monthly reports' },
    { icon: Calendar, title: 'Meeting Scheduler', hours: '3', description: 'Smart booking and reminders' },
    { icon: Share2, title: 'Social Publishing', hours: '4', description: 'Schedule and cross-post content' },
  ];

  const integrations = [
    { name: 'Google', color: 'bg-red-500' },
    { name: 'Slack', color: 'bg-purple-500' },
    { name: 'Salesforce', color: 'bg-blue-500' },
    { name: 'HubSpot', color: 'bg-orange-500' },
    { name: 'QuickBooks', color: 'bg-green-500' },
    { name: 'Stripe', color: 'bg-indigo-500' },
    { name: 'Notion', color: 'bg-neutral-500' },
    { name: 'Zapier', color: 'bg-amber-500' },
  ];

  const features = [
    { icon: Settings, title: 'No-Code Builder', description: 'Build workflows without writing code' },
    { icon: Link2, title: '500+ Integrations', description: 'Connect all your favorite tools' },
    { icon: BarChart3, title: 'Real-time Monitoring', description: 'Track every automation in real-time' },
    { icon: Shield, title: 'Error Handling', description: 'Smart retry and failure recovery' },
    { icon: Clock, title: 'Scheduled Triggers', description: 'Run automations on your schedule' },
    { icon: Zap, title: 'Custom Webhooks', description: 'Trigger from any external event' },
  ];

  const steps = [
    { number: '01', title: 'Identify', description: 'Map your repetitive tasks and bottlenecks' },
    { number: '02', title: 'Design', description: 'Create optimized workflow blueprints' },
    { number: '03', title: 'Automate', description: 'Build and test your automations' },
    { number: '04', title: 'Monitor', description: 'Track performance and optimize' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Back Button */}
      <Link to="/" className="fixed top-6 left-6 z-50">
        <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </Link>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-6 py-24 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-green-500/15 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-sm font-mono text-emerald-400 tracking-wider uppercase mb-4 block">
              03 — Our Services
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold mb-6">
              Process <span className="text-emerald-400">Automation</span>
            </h1>
            <p className="text-xl md:text-2xl text-neutral-400 max-w-3xl mx-auto mb-10">
              Save 15+ hours per week by automating repetitive tasks. Focus on what matters while we handle the rest.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg rounded-full">
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
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <span className="text-sm font-mono text-emerald-400 tracking-wider uppercase mb-4 block">
              What You'll Get
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Workflow <span className="text-emerald-400">Dashboard</span>
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Visual workflow builder that makes automation accessible to everyone on your team.
            </p>
          </motion.div>

          <motion.div 
            className="relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
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
                    dashboard.ayn.ai/workflows
                  </div>
                </div>
              </div>

              {/* Workflow Builder */}
              <div className="p-8 min-h-[500px] bg-gradient-to-br from-neutral-900 to-neutral-950">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold">Lead to CRM Pipeline</h3>
                    <p className="text-sm text-neutral-500">Automatically qualify and sync new leads</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">Active</span>
                    <Button size="sm" variant="outline" className="border-neutral-700 text-neutral-300">
                      <Play className="w-4 h-4 mr-2" /> Run Now
                    </Button>
                  </div>
                </div>

                {/* Workflow Nodes */}
                <div className="flex items-center justify-center gap-4 py-12">
                  {/* Trigger */}
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-6 text-center min-w-[160px]">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-medium">New Email</p>
                    <p className="text-xs text-neutral-500 mt-1">Trigger</p>
                  </div>

                  <div className="w-12 h-px bg-emerald-500/30 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>

                  {/* Process */}
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-6 text-center min-w-[160px]">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-medium">AI Analysis</p>
                    <p className="text-xs text-neutral-500 mt-1">Process</p>
                  </div>

                  <div className="w-12 h-px bg-blue-500/30 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                  </div>

                  {/* Condition */}
                  <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-6 text-center min-w-[160px]">
                    <div className="w-12 h-12 bg-amber-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
                      <Workflow className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-medium">Score Check</p>
                    <p className="text-xs text-neutral-500 mt-1">Condition</p>
                  </div>

                  <div className="w-12 h-px bg-amber-500/30 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full" />
                  </div>

                  {/* Action */}
                  <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-6 text-center min-w-[160px]">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-medium">Add to CRM</p>
                    <p className="text-xs text-neutral-500 mt-1">Action</p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4 mt-8">
                  <div className="bg-neutral-800/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-400">2,847</p>
                    <p className="text-xs text-neutral-500">Runs Today</p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-400">99.8%</p>
                    <p className="text-xs text-neutral-500">Success Rate</p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-amber-400">1.2s</p>
                    <p className="text-xs text-neutral-500">Avg. Time</p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-400">847</p>
                    <p className="text-xs text-neutral-500">Leads Synced</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Stats Cards */}
            <motion.div 
              className="absolute -right-4 top-1/4 bg-neutral-900/90 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4 shadow-xl"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Hours Saved</p>
                  <p className="text-lg font-bold text-emerald-400">18+ hrs/week</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="absolute -left-4 top-1/2 bg-neutral-900/90 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 shadow-xl"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Tasks Automated</p>
                  <p className="text-lg font-bold text-blue-400">1.2M+ monthly</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="absolute -right-4 bottom-1/4 bg-neutral-900/90 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-4 shadow-xl"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Error Reduction</p>
                  <p className="text-lg font-bold text-amber-400">95%</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Popular Automations */}
      <section className="py-24 px-6 bg-neutral-900/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <span className="text-sm font-mono text-emerald-400 tracking-wider uppercase mb-4 block">
              Templates
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Popular <span className="text-emerald-400">Automations</span>
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Start with proven templates and customize them to fit your workflow.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {automations.map((automation, index) => (
              <motion.div
                key={automation.title}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors group cursor-pointer"
                variants={fadeInUp}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <automation.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                    Save {automation.hours} hrs/week
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2">{automation.title}</h3>
                <p className="text-neutral-400 text-sm">{automation.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Integration Hub */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <span className="text-sm font-mono text-emerald-400 tracking-wider uppercase mb-4 block">
              Integrations
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Connect <span className="text-emerald-400">Everything</span>
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              500+ integrations to connect all your tools in one seamless workflow.
            </p>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Central Hub */}
            <div className="flex justify-center mb-12">
              <div className="relative">
                <div className="w-32 h-32 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Brain className="w-16 h-16 text-white" />
                </div>
                {/* Orbiting connections */}
                <div className="absolute inset-0 w-[400px] h-[400px] -top-[134px] -left-[134px]">
                  {integrations.map((integration, index) => {
                    const angle = (index * 360) / integrations.length;
                    const radius = 160;
                    const x = Math.cos((angle * Math.PI) / 180) * radius;
                    const y = Math.sin((angle * Math.PI) / 180) * radius;
                    return (
                      <motion.div
                        key={integration.name}
                        className={`absolute w-14 h-14 ${integration.color} rounded-xl flex items-center justify-center shadow-lg`}
                        style={{
                          left: `calc(50% + ${x}px - 28px)`,
                          top: `calc(50% + ${y}px - 28px)`,
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className="text-white text-xs font-bold">{integration.name.slice(0, 2)}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            <p className="text-center text-neutral-400 mt-8">
              And <span className="text-emerald-400 font-bold">500+ more</span> integrations available
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-neutral-900/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <span className="text-sm font-mono text-emerald-400 tracking-wider uppercase mb-4 block">
              Features
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold">
              Everything You <span className="text-emerald-400">Need</span>
            </h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 hover:border-emerald-500/30 transition-colors"
                variants={fadeInUp}
              >
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-neutral-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <span className="text-sm font-mono text-emerald-400 tracking-wider uppercase mb-4 block">
              Process
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold">
              How It <span className="text-emerald-400">Works</span>
            </h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="text-center relative"
                variants={fadeInUp}
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-neutral-800" />
                )}
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl mx-auto mb-6 flex items-center justify-center relative z-10">
                  <span className="text-xl font-bold text-emerald-400">{step.number}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-neutral-400 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-neutral-900 to-neutral-950">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              Ready to Reclaim <span className="text-emerald-400">Your Time?</span>
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-10">
              Join thousands of businesses saving 15+ hours every week with intelligent automation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-6 text-lg rounded-full">
                Start Automating
              </Button>
              <Link to="/#services">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-10 py-6 text-lg rounded-full">
                  View All Services
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-neutral-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">AYN</span>
            </div>
            <p className="text-neutral-500 text-sm">
              © 2024 AYN. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Automation;
