import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Brain } from 'lucide-react';

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
      <DialogContent className="glass sm:max-w-2xl max-h-[80vh] z-[9999]">
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
                    Your Intelligent Life Companion
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    Please review these important terms before getting started with AYN.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-primary" />
                  How AYN Works
                </h3>
                <div className="text-muted-foreground space-y-2">
                  <p>AYN is an AI-powered assistant designed to help you with various tasks and provide intelligent guidance.</p>
                  <ul className="space-y-2 pl-6">
                    <li>• AI-generated suggestions and recommendations</li>
                    <li>• Support for decision-making processes</li>
                    <li>• Always verify important information independently</li>
                    <li>• Insights based on your conversations</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-primary" />
                  Privacy & Protection
                </h3>
                <div className="text-muted-foreground space-y-2">
                  <ul className="space-y-2 pl-6">
                    <li>• Secure data processing</li>
                    <li>• No sharing with third parties</li>
                    <li>• End-to-end encryption</li>
                    <li>• Data deletion upon request</li>
                    <li>• Compliance with data protection regulations</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Best Practices</h3>
                <div className="text-muted-foreground space-y-2">
                  <ul className="space-y-2 pl-6">
                    <li>• Use AYN as a research and assistance tool</li>
                    <li>• Cross-reference important information</li>
                    <li>• One topic per conversation for best results</li>
                    <li>• Ask follow-up questions for clarity</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Service Information</h3>
                <div className="text-muted-foreground space-y-2">
                  <ul className="space-y-2 pl-6">
                    <li>• Usage limits may apply</li>
                    <li>• Service updates and improvements</li>
                    <li>• High availability with occasional maintenance</li>
                    <li>• Support available through the app</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
                <p className="text-sm">
                  <strong>Important:</strong> AYN provides AI-generated assistance. Always verify critical information and use your own judgment for important decisions.
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
              I have read and understood the above information
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
              I accept the terms and conditions
            </label>
          </div>

          <Button
            onClick={handleAccept}
            disabled={!hasRead || !acceptTerms}
            className="w-full"
            variant="default"
          >
            Accept & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
