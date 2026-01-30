import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface VerificationDisclaimerProps {
  className?: string;
  compact?: boolean;
}

export function VerificationDisclaimer({ className = "", compact = false }: VerificationDisclaimerProps) {
  if (compact) {
    return (
      <p className={`text-xs text-amber-600 dark:text-amber-400 ${className}`}>
        ⚠️ AYNN can make mistakes. Verify with licensed PE before use.
      </p>
    );
  }

  return (
    <Alert variant="default" className={`border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        Verification Required
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300 space-y-2">
        <p>AYNN is an AI assistant that can make mistakes. This analysis is for reference only.</p>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Verify all calculations independently</li>
          <li>Have a licensed PE review and stamp designs</li>
          <li>Check code adoption with local building department</li>
          <li>Confirm dimensions and specifications on site</li>
        </ul>
        <p className="text-xs mt-2">AYNN does not replace professional engineering judgment.</p>
      </AlertDescription>
    </Alert>
  );
}

export default VerificationDisclaimer;
