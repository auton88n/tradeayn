import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield } from 'lucide-react';

interface TermsModalProps {
  open: boolean;
  onAccept: () => void;
}

const PolicySection = ({ number, title, children }: { number: string; title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <span className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white/80">
        {number}
      </span>
      <h3 className="font-semibold text-white tracking-wide">{title}</h3>
    </div>
    <div className="pl-10 space-y-3 text-white/70 text-sm leading-relaxed">
      {children}
    </div>
  </div>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h4 className="text-white/90 font-medium text-sm">{title}</h4>
    {children}
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5 pl-4 border-l border-white/10">
    {items.map((item, i) => (
      <li key={i} className="text-white/60 text-sm">• {item}</li>
    ))}
  </ul>
);

export const TermsModal = ({ open, onAccept }: TermsModalProps) => {
  const [hasRead, setHasRead] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleAccept = () => {
    if (hasRead && acceptTerms) {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] z-[9999] bg-neutral-950 border border-white/20 backdrop-blur-xl p-0 overflow-hidden">
        {/* Header */}
        <div className="text-center pt-8 pb-4 px-6 border-b border-white/10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-white/60" />
            <h2 className="text-2xl font-bold text-white tracking-tight">PRIVACY POLICY</h2>
          </div>
          <div className="flex justify-center gap-6 text-xs text-white/40 mb-4">
            <span><span className="text-white/60">Last Updated:</span> December 13, 2024</span>
            <span><span className="text-white/60">Effective Date:</span> December 13, 2024</span>
          </div>
          <p className="text-sm text-white/60 max-w-md mx-auto">
            AYN respects your privacy and is committed to protecting your information. This Privacy Policy explains how we collect, use, and safeguard your data when you use AYN.
          </p>
          <p className="text-xs text-white/40 mt-3">
            By using AYN, you agree to the practices described below.
          </p>
        </div>

        <ScrollArea className="max-h-[45vh] px-6">
          <div className="space-y-8 py-6">
            {/* Section 1 */}
            <PolicySection number="1" title="INFORMATION WE COLLECT">
              <p className="text-white/50 text-sm mb-4">We collect only what is necessary to operate and improve AYN.</p>
              
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
                <p className="text-white/60 text-sm">
                  Payments are processed securely by a third-party payment processor.
                  AYN does not store full payment card numbers.
                </p>
              </SubSection>
            </PolicySection>

            {/* Section 2 */}
            <PolicySection number="2" title="HOW WE USE YOUR INFORMATION">
              <p className="text-white/50 text-sm mb-2">We use your information to:</p>
              <BulletList items={[
                "Provide and operate AYN's services",
                "Generate AI responses and maintain context",
                "Improve performance, features, and reliability",
                "Protect against fraud, abuse, and security threats",
                "Comply with legal obligations"
              ]} />
            </PolicySection>

            {/* Section 3 */}
            <PolicySection number="3" title="INFORMATION SHARING">
              <p className="text-white/50 text-sm mb-3">We do not sell your personal data.</p>
              <p className="text-white/60 text-sm mb-2">
                We share limited information only with trusted service providers necessary to operate AYN, including:
              </p>
              <BulletList items={[
                "Third-party AI service providers that process requests and generate responses",
                "Infrastructure, hosting, and security providers",
                "Payment processing services",
                "Analytics and monitoring services"
              ]} />
              <p className="text-white/50 text-sm mt-3">
                Shared data is limited to what is required for functionality and security.
              </p>
            </PolicySection>

            {/* Section 4 */}
            <PolicySection number="4" title="DATA SECURITY">
              <p className="text-white/60 text-sm">
                We use advanced, industry-standard security technologies and safeguards to protect your information, including encryption, access controls, and continuous monitoring.
              </p>
              <p className="text-white/50 text-sm mt-2">
                While no system can be guaranteed 100% secure, protecting your data is a top priority, and we continuously improve our security practices to meet modern standards.
              </p>
            </PolicySection>

            {/* Section 5 */}
            <PolicySection number="5" title="DATA RETENTION & DELETION">
              <BulletList items={[
                "Data is retained while your account is active",
                "You may delete conversations or your account at any time",
                "Most data is removed within 30 days of account deletion",
                "Some information may be retained to meet legal or security requirements"
              ]} />
            </PolicySection>

            {/* Section 6 */}
            <PolicySection number="6" title="YOUR RIGHTS">
              <p className="text-white/60 text-sm">
                You may access, update, export, or delete your data and manage communication preferences at any time.
              </p>
            </PolicySection>

            {/* Section 7 */}
            <PolicySection number="7" title="INTERNATIONAL DATA TRANSFERS">
              <p className="text-white/60 text-sm">
                Your data may be processed in other countries with appropriate safeguards in place.
                By using AYN, you consent to these transfers.
              </p>
            </PolicySection>

            {/* Section 8 */}
            <PolicySection number="8" title="COOKIES">
              <p className="text-white/60 text-sm">
                AYN uses essential cookies for functionality and security.
                You can manage cookies through your browser settings.
              </p>
            </PolicySection>

            {/* Section 9 */}
            <PolicySection number="9" title="CHILDREN'S PRIVACY">
              <p className="text-white/60 text-sm">
                AYN is not intended for children under the minimum legal age.
                We do not knowingly collect data from children.
              </p>
            </PolicySection>

            {/* Section 10 */}
            <PolicySection number="10" title="POLICY UPDATES">
              <p className="text-white/60 text-sm">
                We may update this Privacy Policy from time to time.
                Continued use of AYN means you accept the updated policy.
              </p>
            </PolicySection>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-white/10 space-y-4">
          <p className="text-center text-xs text-white/30">© 2024 AYN. All rights reserved.</p>
          
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="hasRead" 
              checked={hasRead}
              onCheckedChange={(checked) => setHasRead(checked as boolean)}
              className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-neutral-950"
            />
            <label htmlFor="hasRead" className="text-sm leading-5 text-white/70 cursor-pointer">
              I have read and understood the Privacy Policy
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox 
              id="acceptTerms" 
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              disabled={!hasRead}
              className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-neutral-950 disabled:opacity-30"
            />
            <label htmlFor="acceptTerms" className="text-sm leading-5 text-white/70 cursor-pointer">
              I accept the terms and conditions
            </label>
          </div>

          <Button
            onClick={handleAccept}
            disabled={!hasRead || !acceptTerms}
            className="w-full bg-white text-neutral-950 hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed font-medium"
          >
            Accept & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
