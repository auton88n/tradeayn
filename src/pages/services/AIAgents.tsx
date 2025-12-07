import { motion } from 'framer-motion';
import { ArrowLeft, Brain, MessageSquare, Zap, Globe, Users, BarChart3, Clock, Bot, Headphones, Languages, UserCheck, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AIAgents = () => {
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

  const features = [
    { icon: Clock, title: '24/7 Availability', description: 'Never miss a customer inquiry, day or night' },
    { icon: Brain, title: 'Custom Training', description: 'Trained specifically on your business data' },
    { icon: Languages, title: 'Multi-language', description: 'Fluent in Arabic, English, and more' },
    { icon: UserCheck, title: 'Human Handoff', description: 'Seamlessly escalates complex issues' },
    { icon: BarChart3, title: 'Analytics Dashboard', description: 'Track performance and insights' },
    { icon: Shield, title: 'Brand Voice', description: 'Matches your company tone perfectly' },
  ];

  const channels = [
    { name: 'Website Widget', icon: Globe, color: 'bg-purple-500' },
    { name: 'WhatsApp', icon: MessageSquare, color: 'bg-green-500' },
    { name: 'Telegram', icon: Zap, color: 'bg-blue-500' },
    { name: 'Facebook', icon: Users, color: 'bg-indigo-500' },
  ];

  const steps = [
    { number: '01', title: 'Discovery', description: 'We learn your business inside and out' },
    { number: '02', title: 'Training', description: 'AI learns from your documents and FAQs' },
    { number: '03', title: 'Integration', description: 'Deploy across all your channels' },
    { number: '04', title: 'Launch', description: 'Go live with 24/7 AI support' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
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
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/15 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-sm font-mono text-purple-400 tracking-wider uppercase mb-4 block">
              02 — Our Services
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-serif font-bold mb-6">
              Custom AI <span className="text-purple-400">Agents</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-neutral-400 max-w-3xl mx-auto mb-8 md:mb-10 px-4">
              24/7 intelligent assistants trained on your business data to handle customer inquiries, qualify leads, and drive conversions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-6 text-lg rounded-full">
                Start Your Project
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

      {/* Chat Interface Showcase */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <span className="text-sm font-mono text-purple-400 tracking-wider uppercase mb-4 block">
              What You'll Get
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Intelligent <span className="text-purple-400">Chat Interface</span>
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              A powerful AI assistant that understands context, remembers conversations, and delivers human-like responses.
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
                    yourwebsite.com/chat
                  </div>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="p-4 md:p-8 min-h-[350px] md:min-h-[500px] bg-gradient-to-br from-neutral-900 to-neutral-950">
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* AI Message */}
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="bg-neutral-800/50 rounded-2xl rounded-tl-md px-5 py-4 max-w-md">
                      <p className="text-neutral-200">Hello! I'm your AI assistant. How can I help you today?</p>
                    </div>
                  </div>

                  {/* User Message */}
                  <div className="flex gap-3 justify-end">
                    <div className="bg-purple-500/20 rounded-2xl rounded-tr-md px-5 py-4 max-w-md">
                      <p className="text-neutral-200">What are your pricing options?</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium">JD</span>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="bg-neutral-800/50 rounded-2xl rounded-tl-md px-5 py-4 max-w-md">
                      <p className="text-neutral-200">Great question! We offer three flexible plans:</p>
                      <ul className="mt-3 space-y-2 text-neutral-300 text-sm">
                        <li>• <strong>Starter:</strong> $99/mo - Perfect for small businesses</li>
                        <li>• <strong>Pro:</strong> $249/mo - Ideal for growing teams</li>
                        <li>• <strong>Enterprise:</strong> Custom pricing for large organizations</li>
                      </ul>
                      <p className="mt-3 text-neutral-200">Would you like me to explain the features of each plan?</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Stats Cards - Hidden on mobile */}
            <motion.div 
              className="absolute -right-4 lg:-right-16 top-1/4 bg-neutral-900/90 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-3 md:p-4 shadow-xl hidden md:block"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Avg. Response</p>
                  <p className="text-base md:text-lg font-bold text-purple-400">&lt; 2 seconds</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="absolute -left-4 lg:-left-16 top-1/2 bg-neutral-900/90 backdrop-blur-xl border border-green-500/20 rounded-2xl p-3 md:p-4 shadow-xl hidden md:block"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Accuracy Rate</p>
                  <p className="text-base md:text-lg font-bold text-green-400">97.5%</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="absolute -right-4 lg:-right-16 bottom-1/4 bg-neutral-900/90 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-3 md:p-4 shadow-xl hidden md:block"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Languages className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Languages</p>
                  <p className="text-base md:text-lg font-bold text-blue-400">12+ Supported</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Multi-Channel Deployment */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-neutral-900/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <span className="text-sm font-mono text-purple-400 tracking-wider uppercase mb-4 block">
              Deployment
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4">
              One AI, <span className="text-purple-400">Everywhere</span>
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Deploy your AI agent across all the channels where your customers are, with a unified knowledge base.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {channels.map((channel, index) => (
              <motion.div
                key={channel.name}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 md:p-8 text-center hover:border-purple-500/30 transition-colors group"
                variants={fadeInUp}
              >
                <div className={`w-12 h-12 md:w-16 md:h-16 ${channel.color} rounded-xl md:rounded-2xl mx-auto mb-3 md:mb-4 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <channel.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="font-semibold text-sm md:text-lg">{channel.name}</h3>
                <p className="text-xs md:text-sm text-green-400 mt-1 md:mt-2">Connected</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Analytics Dashboard Preview */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-sm font-mono text-purple-400 tracking-wider uppercase mb-4 block">
                Insights
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-6">
                Analytics & <span className="text-purple-400">Insights</span>
              </h2>
              <p className="text-lg text-neutral-400 mb-8">
                Track every conversation, measure performance, and continuously improve your AI agent with actionable insights.
              </p>
              <ul className="space-y-4">
                {['Total conversations handled', 'Customer satisfaction scores', 'Response time metrics', 'Most common questions', 'Escalation patterns'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-neutral-300">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6"
            >
              {/* Mini Dashboard */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
                <div className="bg-neutral-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4">
                  <p className="text-[10px] sm:text-xs md:text-sm text-neutral-500 mb-0.5 sm:mb-1">Conversations</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-purple-400">12,459</p>
                  <p className="text-[10px] sm:text-xs text-green-400 mt-0.5 sm:mt-1">↑ 23% this month</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4">
                  <p className="text-[10px] sm:text-xs md:text-sm text-neutral-500 mb-0.5 sm:mb-1">Satisfaction</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-green-400">4.8/5</p>
                  <p className="text-[10px] sm:text-xs text-green-400 mt-0.5 sm:mt-1">↑ 0.3 from last month</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4">
                  <p className="text-[10px] sm:text-xs md:text-sm text-neutral-500 mb-0.5 sm:mb-1">Avg. Response</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-blue-400">1.2s</p>
                  <p className="text-[10px] sm:text-xs text-green-400 mt-0.5 sm:mt-1">↓ 0.5s improvement</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4">
                  <p className="text-[10px] sm:text-xs md:text-sm text-neutral-500 mb-0.5 sm:mb-1">Resolution Rate</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-amber-400">89%</p>
                  <p className="text-[10px] sm:text-xs text-green-400 mt-0.5 sm:mt-1">↑ 5% this month</p>
                </div>
              </div>
              
              {/* Activity Chart Placeholder */}
              <div className="bg-neutral-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4">
                <p className="text-[10px] sm:text-xs md:text-sm text-neutral-500 mb-2 sm:mb-4">Weekly Activity</p>
                <div className="flex items-end gap-1 sm:gap-2 h-16 sm:h-20 md:h-24">
                  {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                    <div key={i} className="flex-1 bg-purple-500/30 rounded-t" style={{ height: `${height}%` }}>
                      <div className="w-full bg-purple-500 rounded-t" style={{ height: '60%' }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1 sm:mt-2 text-[8px] sm:text-[10px] md:text-xs text-neutral-500">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-neutral-900/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <span className="text-sm font-mono text-purple-400 tracking-wider uppercase mb-4 block">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold">
              Everything You <span className="text-purple-400">Need</span>
            </h2>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 hover:border-purple-500/30 transition-colors"
                variants={fadeInUp}
              >
                <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-500/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6">
                  <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-purple-400" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">{feature.title}</h3>
                <p className="text-sm md:text-base text-neutral-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
            viewport={{ once: true }}
            whileInView="animate"
            initial="initial"
          >
            <span className="text-sm font-mono text-purple-400 tracking-wider uppercase mb-4 block">
              Process
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold">
              How It <span className="text-purple-400">Works</span>
            </h2>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
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
                  <div className="hidden md:block absolute top-6 md:top-8 left-1/2 w-full h-px bg-neutral-800" />
                )}
                <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-500/20 border border-purple-500/30 rounded-xl md:rounded-2xl mx-auto mb-4 md:mb-6 flex items-center justify-center relative z-10">
                  <span className="text-lg md:text-xl font-bold text-purple-400">{step.number}</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">{step.title}</h3>
                <p className="text-neutral-400 text-xs md:text-sm">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-b from-neutral-900 to-neutral-950">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-serif font-bold mb-6">
              Ready to Automate <span className="text-purple-400">Customer Support?</span>
            </h2>
            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-8 md:mb-10 px-4">
              Join businesses saving 40+ hours per week with AI-powered customer service that never sleeps.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button size="lg" className="bg-purple-500 hover:bg-purple-600 text-white px-8 md:px-10 py-5 md:py-6 text-base md:text-lg rounded-full w-full sm:w-auto">
                Start Your Project
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
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
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

export default AIAgents;
