
-- Seed company_state
INSERT INTO public.company_state (momentum, stress_level, growth_velocity, risk_exposure, morale, updated_by)
VALUES ('stable', 0.2, 'growing', 'low', 'high', 'system');

-- Seed company_objectives
INSERT INTO public.company_objectives (title, metric, target_value, current_value, deadline, priority, status) VALUES
('Close 5 AI Agent clients this quarter', 'ai_agent_clients_closed', 5, 0, now() + interval '3 months', 1, 'active'),
('Increase engineering SaaS retention to 40%', 'engineering_retention_pct', 40, 0, now() + interval '3 months', 2, 'active'),
('Reduce LLM failure rate below 1%', 'llm_failure_rate_pct', 1, 0, now() + interval '3 months', 3, 'active');

-- Seed service_economics
INSERT INTO public.service_economics (service_id, service_name, acquisition_difficulty, scalability_score, average_margin, time_to_deploy, retention_probability, operational_complexity, category, notes) VALUES
('engineering_tools', 'Engineering Consultation Tools', 3, 10, 0.8, '1 week', 0.7, 3, 'saas', 'Highest scalability. Self-serve. Low operational cost.'),
('smart_ticketing', 'Smart Ticketing Systems', 5, 9, 0.7, '2 weeks', 0.75, 5, 'saas', 'Strong SaaS potential. Recurring revenue.'),
('ai_employees', 'AI Employees', 7, 7, 0.6, '3 weeks', 0.65, 8, 'service', 'Brand differentiator. High complexity.'),
('ai_support', 'AI-Powered Customer Support', 5, 8, 0.65, '2 weeks', 0.7, 6, 'saas', 'Good scalability. Arabic+English advantage.'),
('business_automation', 'Business Automation', 6, 5, 0.5, '1 month', 0.55, 7, 'service', 'Cash flow generator. Custom per client.'),
('websites', 'Company & Influencer Websites', 4, 4, 0.4, '2 weeks', 0.45, 6, 'service', 'Entry point. Gateway to upsell.');

-- Seed employee_states for all 13 employees
INSERT INTO public.employee_states (employee_id, beliefs, emotional_stance, confidence, core_motivation, chime_in_threshold) VALUES
('system', '{"growth_priority": 0.7, "risk_tolerance": 0.6, "speed_vs_quality": 0.5}', 'calm', 0.8, 'Company alignment and founder trust', 0.75),
('chief_of_staff', '{"growth_priority": 0.6, "risk_tolerance": 0.4, "speed_vs_quality": 0.4}', 'calm', 0.7, 'Cross-team alignment and objective tracking', 0.7),
('advisor', '{"growth_priority": 0.6, "risk_tolerance": 0.4, "speed_vs_quality": 0.3}', 'calm', 0.7, 'Long-term strategic positioning', 0.75),
('lawyer', '{"growth_priority": 0.3, "risk_tolerance": 0.2, "speed_vs_quality": 0.2}', 'cautious', 0.8, 'Regulatory safety and compliance', 0.8),
('security_guard', '{"growth_priority": 0.2, "risk_tolerance": 0.1, "speed_vs_quality": 0.3}', 'calm', 0.8, 'Protection over growth', 0.75),
('sales', '{"growth_priority": 0.9, "risk_tolerance": 0.7, "speed_vs_quality": 0.7}', 'excited', 0.6, 'Revenue growth and pipeline expansion', 0.75),
('investigator', '{"growth_priority": 0.5, "risk_tolerance": 0.4, "speed_vs_quality": 0.2}', 'curious', 0.7, 'Information quality and thoroughness', 0.8),
('follow_up', '{"growth_priority": 0.7, "risk_tolerance": 0.5, "speed_vs_quality": 0.5}', 'calm', 0.6, 'Conversion efficiency and timing', 0.8),
('customer_success', '{"growth_priority": 0.5, "risk_tolerance": 0.3, "speed_vs_quality": 0.3}', 'calm', 0.7, 'User retention and satisfaction', 0.75),
('qa_watchdog', '{"growth_priority": 0.3, "risk_tolerance": 0.2, "speed_vs_quality": 0.2}', 'calm', 0.8, 'System stability and uptime', 0.75),
('marketing', '{"growth_priority": 0.8, "risk_tolerance": 0.6, "speed_vs_quality": 0.6}', 'excited', 0.6, 'Brand growth and market positioning', 0.75),
('hr_manager', '{"growth_priority": 0.4, "risk_tolerance": 0.3, "speed_vs_quality": 0.3}', 'calm', 0.7, 'Workforce sustainability and quality', 0.8),
('innovation', '{"growth_priority": 0.8, "risk_tolerance": 0.7, "speed_vs_quality": 0.6}', 'excited', 0.6, 'Competitive advantage and experimentation', 0.7);
