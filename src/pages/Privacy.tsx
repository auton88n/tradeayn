import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, ArrowLeft, Lock } from 'lucide-react';
import { SEO } from '@/components/SEO';

const PolicySection = ({ number, title, children }: { number: string; title: string; children: React.ReactNode }) => (
  <div className="space-y-4" id={`section-${number}`}>
    <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm font-bold text-white/80">
        {number}
      </span>
      <h3 className="text-lg font-semibold text-white tracking-wide">{title}</h3>
    </div>
    <div className="pl-11 space-y-4 text-white/70 text-sm leading-relaxed">
      {children}
    </div>
  </div>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h4 className="text-white/90 font-medium">{title}</h4>
    {children}
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 pl-4 border-l-2 border-white/10">
    {items.map((item, i) => (
      <li key={i} className="text-white/60">• {item}</li>
    ))}
  </ul>
);

const Privacy = () => {
  return (
    <>
      <SEO 
        title="Privacy Policy - AYN"
        description="Learn how AYN collects, uses, and protects your personal information. Read our comprehensive privacy policy."
      />
      
      <div className="min-h-screen bg-neutral-950 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link to="/">
              <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10 mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <Card className="bg-neutral-900/80 border border-white/10 backdrop-blur-xl p-8 md:p-12">
            {/* Title */}
            <div className="text-center mb-10 pb-8 border-b border-white/10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-white/60" />
                <h1 className="text-3xl font-bold text-white tracking-tight">Privacy Policy</h1>
              </div>
              <div className="flex justify-center gap-6 text-sm text-white/40 mb-4">
                <span><span className="text-white/60">Last Updated:</span> December 13, 2024</span>
                <span><span className="text-white/60">Effective:</span> December 13, 2024</span>
              </div>
              <p className="text-white/50 max-w-md mx-auto">
                Your privacy matters to us. This policy explains how we handle your data.
              </p>
            </div>

            {/* Content */}
            <div className="space-y-10">
              <PolicySection number="1" title="INFORMATION WE COLLECT">
                <p className="text-white/50 mb-4">We collect only what is necessary to operate and improve AYN.</p>
                
                <SubSection title="Information You Provide">
                  <BulletList items={[
                    "Email address and account credentials",
                    "Optional profile and preference information",
                    "Messages, prompts, and files you submit",
                    "Feedback and support requests"
                  ]} />
                </SubSection>

                <SubSection title="Information Collected Automatically">
                  <BulletList items={[
                    "Conversation data and AI responses",
                    "Language and usage preferences",
                    "Device, browser, and general location (city/country level)",
                    "Session activity, timestamps, and performance logs",
                    "Cookies and similar technologies"
                  ]} />
                </SubSection>

                <SubSection title="Payments (if applicable)">
                  <p className="text-white/60">
                    Payments are processed securely by a third-party payment processor.
                    AYN does not store full payment card numbers.
                  </p>
                </SubSection>
              </PolicySection>

              <PolicySection number="2" title="HOW WE USE YOUR INFORMATION">
                <p className="text-white/50 mb-3">We use your information to:</p>
                <BulletList items={[
                  "Provide and operate AYN's services",
                  "Generate AI responses and maintain context",
                  "Improve performance, features, and reliability",
                  "Protect against fraud, abuse, and security threats",
                  "Comply with legal obligations"
                ]} />
              </PolicySection>

              <PolicySection number="3" title="INFORMATION SHARING">
                <p className="text-white/50 mb-3">We do not sell your personal data.</p>
                <p className="text-white/60 mb-3">
                  We share limited information only with trusted service providers necessary to operate AYN, including:
                </p>
                <BulletList items={[
                  "Third-party AI service providers that process requests and generate responses",
                  "Infrastructure, hosting, and security providers",
                  "Payment processing services",
                  "Analytics and monitoring services"
                ]} />
                <p className="text-white/50 mt-3">
                  Shared data is limited to what is required for functionality and security.
                </p>
              </PolicySection>

              <PolicySection number="4" title="DATA SECURITY">
                <p className="text-white/60">
                  We use advanced, industry-standard security technologies and safeguards to protect your information, including encryption, access controls, and continuous monitoring.
                </p>
                <p className="text-white/50 mt-3">
                  While no system can be guaranteed 100% secure, protecting your data is a top priority, and we continuously improve our security practices to meet modern standards.
                </p>
              </PolicySection>

              <PolicySection number="5" title="DATA RETENTION & DELETION">
                <BulletList items={[
                  "Data is retained while your account is active",
                  "You may delete conversations or your account at any time",
                  "Most data is removed within 30 days of account deletion",
                  "Some information may be retained to meet legal or security requirements"
                ]} />
              </PolicySection>

              <PolicySection number="6" title="YOUR RIGHTS">
                <p className="text-white/60">
                  You may access, update, export, or delete your data and manage communication preferences at any time.
                </p>
              </PolicySection>

              <PolicySection number="7" title="INTERNATIONAL DATA TRANSFERS">
                <p className="text-white/60">
                  Your data may be processed in other countries with appropriate safeguards in place.
                  By using AYN, you consent to these transfers.
                </p>
              </PolicySection>

              <PolicySection number="8" title="COOKIES">
                <p className="text-white/60">
                  AYN uses essential cookies for functionality and security.
                  You can manage cookies through your browser settings.
                </p>
              </PolicySection>

              <PolicySection number="9" title="CHILDREN'S PRIVACY">
                <p className="text-white/60">
                  AYN is not intended for children under the minimum legal age.
                  We do not knowingly collect data from children.
                </p>
              </PolicySection>

              <PolicySection number="10" title="POLICY UPDATES">
                <p className="text-white/60">
                  We may update this Privacy Policy from time to time.
                  Continued use of AYN means you accept the updated policy.
                </p>
              </PolicySection>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-white/10 text-center">
              <p className="text-white/30 text-sm">© 2024 AYN. All rights reserved.</p>
              <div className="mt-4 flex justify-center gap-4">
                <Link to="/terms" className="text-sm text-white/50 hover:text-white transition-colors">
                  Terms of Service
                </Link>
                <span className="text-white/20">•</span>
                <Link to="/#contact" className="text-sm text-white/50 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Privacy;
