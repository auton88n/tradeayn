import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, Brain } from 'lucide-react';

interface TermsModalProps {
  open: boolean;
  onAccept: () => void;
}

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
      <DialogContent className="glass sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-center gradient-text-hero text-2xl flex items-center justify-center gap-3">
            <Shield className="w-6 h-6" />
            Welcome to AYN AI
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-96 pr-4">
          <div className="space-y-6 text-sm">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Your AI Business Partner
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    Welcome! Please take a moment to review our service terms and privacy policy.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-primary" />
                  How AYN AI Works
                </h3>
                <div className="text-muted-foreground space-y-2">
                  <p>AYN AI is designed to help you with business insights and strategic thinking. Here's what you should know:</p>
                  <ul className="space-y-2 pl-6">
                    <li>• Our AI provides suggestions and recommendations based on available data and patterns</li>
                    <li>• Responses are meant to support your decision-making process, not replace professional judgment</li>
                    <li>• We recommend verifying important information through additional research</li>
                    <li>• Market insights are based on historical data and trends, not real-time guarantees</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-primary" />
                  Privacy & Data Protection
                </h3>
                <div className="text-muted-foreground space-y-2">
                  <ul className="space-y-2 pl-6">
                    <li>• Your conversations are processed securely and used to improve our service</li>
                    <li>• We do not share your personal business information with third parties</li>
                    <li>• Data is stored with industry-standard encryption and security measures</li>
                    <li>• You can request data deletion by contacting our support team</li>
                    <li>• We comply with applicable data protection regulations</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Best Practices for Success</h3>
                <div className="text-muted-foreground space-y-2">
                  <ul className="space-y-2 pl-6">
                    <li>• Use AYN AI as a powerful research and brainstorming tool</li>
                    <li>• Cross-reference important suggestions with industry experts</li>
                    <li>• Consider AI recommendations as one input in your decision-making process</li>
                    <li>• Feel free to ask follow-up questions to explore different perspectives</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Service Information</h3>
                <div className="text-muted-foreground space-y-2">
                  <ul className="space-y-2 pl-6">
                    <li>• Your account includes monthly message limits as specified in your access plan</li>
                    <li>• Service updates and improvements are made regularly</li>
                    <li>• We strive for high availability but cannot guarantee 100% uptime</li>
                    <li>• Support is available if you encounter any issues</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
                <p className="text-sm">
                  <strong>Important:</strong> While AYN AI is a powerful business tool, all final decisions 
                  remain yours to make. We recommend using our insights alongside your expertise and, 
                  when appropriate, professional consultation for major business decisions.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="hasRead" 
              checked={hasRead}
              onCheckedChange={(checked) => setHasRead(checked as boolean)}
            />
            <label htmlFor="hasRead" className="text-sm leading-5">
              I have read and understood the above terms and disclaimer
            </label>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox 
              id="acceptTerms" 
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              disabled={!hasRead}
            />
            <label htmlFor="acceptTerms" className="text-sm leading-5">
              I accept these terms and agree to use AYN AI at my own risk and discretion
            </label>
          </div>

          <Button
            onClick={handleAccept}
            disabled={!hasRead || !acceptTerms}
            className="w-full"
            variant="hero"
          >
            Accept Terms & Continue to AYN AI
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};