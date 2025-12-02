import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, Brain } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TermsModalProps {
  open: boolean;
  onAccept: () => void;
}

export const TermsModal = ({ open, onAccept }: TermsModalProps) => {
  const [hasRead, setHasRead] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { t } = useLanguage();

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
            {t('terms.welcomeToAynAI')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-96 pr-4">
          <div className="space-y-6 text-sm">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    {t('terms.businessPartner')}
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    {t('terms.reviewTerms')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-primary" />
                  {t('terms.howAynWorks')}
                </h3>
                <div className="text-muted-foreground space-y-2">
                  <p>{t('terms.aynDescription')}</p>
                  <ul className="space-y-2 pl-6">
                    <li>• {t('terms.aiSuggestions')}</li>
                    <li>• {t('terms.supportDecisions')}</li>
                    <li>• {t('terms.verifyInfo')}</li>
                    <li>• {t('terms.marketInsights')}</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-primary" />
                  {t('terms.privacyProtection')}
                </h3>
                <div className="text-muted-foreground space-y-2">
                  <ul className="space-y-2 pl-6">
                    <li>• {t('terms.secureProcessing')}</li>
                    <li>• {t('terms.noSharing')}</li>
                    <li>• {t('terms.encryption')}</li>
                    <li>• {t('terms.dataDeletion')}</li>
                    <li>• {t('terms.compliance')}</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">{t('terms.bestPractices')}</h3>
                <div className="text-muted-foreground space-y-2">
                  <ul className="space-y-2 pl-6">
                    <li>• {t('terms.researchTool')}</li>
                    <li>• {t('terms.crossReference')}</li>
                    <li>• {t('terms.oneInput')}</li>
                    <li>• {t('terms.followUp')}</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">{t('terms.serviceInfo')}</h3>
                <div className="text-muted-foreground space-y-2">
                  <ul className="space-y-2 pl-6">
                    <li>• {t('terms.messageLimits')}</li>
                    <li>• {t('terms.serviceUpdates')}</li>
                    <li>• {t('terms.availability')}</li>
                    <li>• {t('terms.support')}</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
                <p className="text-sm">
                  <strong>Important:</strong> {t('terms.importantNote')}
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
              {t('terms.hasRead')}
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
              {t('terms.acceptTerms')}
            </label>
          </div>

          <Button
            onClick={handleAccept}
            disabled={!hasRead || !acceptTerms}
            className="w-full"
            variant="default"
          >
            {t('terms.acceptContinue')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};