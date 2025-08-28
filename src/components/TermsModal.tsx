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
            Terms of Use & AI Disclaimer
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-96 pr-4">
          <div className="space-y-6 text-sm">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Important Legal Notice
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Please read this disclaimer carefully before using AYN AI Business Consulting services.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-primary" />
                  AI Limitations & Accuracy
                </h3>
                <ul className="space-y-2 text-muted-foreground pl-6">
                  <li>• AYN AI is an artificial intelligence system that can make mistakes, provide inaccurate information, or give incomplete analysis</li>
                  <li>• AI responses should be considered as suggestions and starting points, not definitive business advice</li>
                  <li>• Always verify AI-generated information through independent research and professional consultation</li>
                  <li>• Market data and trends provided may not reflect real-time conditions or future performance</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Financial Responsibility Disclaimer
                </h3>
                <ul className="space-y-2 text-muted-foreground pl-6">
                  <li>• <strong>AYN and its operators are NOT responsible for any financial losses</strong> resulting from decisions made based on AI-generated advice</li>
                  <li>• Users assume full responsibility for all business decisions and their consequences</li>
                  <li>• Investment and business strategy recommendations should be reviewed by qualified financial professionals</li>
                  <li>• No guarantee is provided regarding the accuracy, completeness, or profitability of any advice given</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">User Responsibilities</h3>
                <ul className="space-y-2 text-muted-foreground pl-6">
                  <li>• Conduct independent due diligence on all AI suggestions</li>
                  <li>• Consult with qualified professionals for important business decisions</li>
                  <li>• Use AYN AI as a research tool, not a replacement for professional judgment</li>
                  <li>• Understand that final decisions and their outcomes remain your responsibility</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Service Terms</h3>
                <ul className="space-y-2 text-muted-foreground pl-6">
                  <li>• Usage is subject to monthly limits as defined in your access grant</li>
                  <li>• Service availability is not guaranteed and may be interrupted</li>
                  <li>• AYN reserves the right to modify or discontinue service at any time</li>
                  <li>• All conversations and data may be logged for quality and security purposes</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm">
                  <strong>By using AYN AI:</strong> You acknowledge that you understand these limitations, 
                  accept full responsibility for your decisions, and agree that AYN cannot be held liable 
                  for any consequences resulting from your use of this service.
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