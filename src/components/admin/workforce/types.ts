export interface AIEmployee {
  id: string;
  name: string;
  role: string;
  emoji: string;
  triggeredBy: string; // matches ayn_activity_log.triggered_by
  gradient: string;
  reportsTo: string;
  description: string;
}

export const AI_WORKFORCE: AIEmployee[] = [
  {
    id: 'system',
    name: 'AYN',
    role: 'Co-Founder & Orchestrator',
    emoji: '🧠',
    triggeredBy: 'system',
    gradient: 'from-violet-600 to-purple-600',
    reportsTo: 'Founder',
    description: 'Central brain — orchestrates all employees, aggregates reports, handles direct commands.',
  },
  {
    id: 'advisor',
    name: 'Advisor',
    role: 'Strategic Advisor',
    emoji: '📊',
    triggeredBy: 'advisor',
    gradient: 'from-blue-600 to-cyan-600',
    reportsTo: 'Founder',
    description: 'Synthesizes employee reports into executive briefings and strategic recommendations.',
  },
  {
    id: 'lawyer',
    name: 'Lawyer',
    role: 'Legal & Compliance',
    emoji: '⚖️',
    triggeredBy: 'lawyer',
    gradient: 'from-slate-600 to-gray-600',
    reportsTo: 'Founder',
    description: 'Scans content for legal risk, reviews terms compliance, and flags regulatory issues.',
  },
  {
    id: 'security_guard',
    name: 'Security Guard',
    role: 'Threat Detection',
    emoji: '🛡️',
    triggeredBy: 'security_guard',
    gradient: 'from-red-600 to-rose-600',
    reportsTo: 'AYN',
    description: 'Monitors for prompt injection, suspicious activity, and manages auto-blocking.',
  },
  {
    id: 'sales',
    name: 'Sales',
    role: 'Lead Hunter',
    emoji: '💼',
    triggeredBy: 'sales',
    gradient: 'from-emerald-600 to-green-600',
    reportsTo: 'AYN',
    description: 'Hunts for leads, qualifies prospects, and initiates outreach campaigns.',
  },
  {
    id: 'investigator',
    name: 'Investigator',
    role: 'Deep Research',
    emoji: '🔍',
    triggeredBy: 'investigator',
    gradient: 'from-amber-600 to-yellow-600',
    reportsTo: 'AYN',
    description: 'Performs deep company research and creates detailed dossiers for leads.',
  },
  {
    id: 'follow_up',
    name: 'Follow-Up Agent',
    role: 'Lead Persistence',
    emoji: '📬',
    triggeredBy: 'follow_up',
    gradient: 'from-orange-600 to-amber-600',
    reportsTo: 'AYN',
    description: 'Manages follow-up sequences with a strict 2-email limit per lead.',
  },
  {
    id: 'customer_success',
    name: 'Customer Success',
    role: 'Onboarding & Retention',
    emoji: '🤝',
    triggeredBy: 'customer_success',
    gradient: 'from-teal-600 to-emerald-600',
    reportsTo: 'AYN',
    description: 'Manages user onboarding, monitors churn risk, and drives engagement.',
  },
  {
    id: 'qa_watchdog',
    name: 'QA Watchdog',
    role: 'System Health',
    emoji: '🐕',
    triggeredBy: 'qa_watchdog',
    gradient: 'from-pink-600 to-rose-600',
    reportsTo: 'AYN',
    description: 'Monitors edge function health, uptime, and performance metrics.',
  },
  {
    id: 'marketing',
    name: 'Marketing Strategist',
    role: 'Content & Social',
    emoji: '📣',
    triggeredBy: 'marketing',
    gradient: 'from-sky-600 to-blue-600',
    reportsTo: 'AYN',
    description: 'Coordinates content strategy, competitor analysis, and social media presence.',
  },
];
