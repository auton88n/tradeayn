import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Requirement {
  key: string;
  label: string;
  met: boolean;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const { t } = useLanguage();

  const analysis = useMemo(() => {
    const requirements: Requirement[] = [
      { key: 'length', label: t('auth.passwordReqLength'), met: password.length >= 8 },
      { key: 'uppercase', label: t('auth.passwordReqUppercase'), met: /[A-Z]/.test(password) },
      { key: 'lowercase', label: t('auth.passwordReqLowercase'), met: /[a-z]/.test(password) },
      { key: 'number', label: t('auth.passwordReqNumber'), met: /[0-9]/.test(password) },
      { key: 'special', label: t('auth.passwordReqSpecial'), met: /[^A-Za-z0-9]/.test(password) },
    ];

    const metCount = requirements.filter(r => r.met).length;
    
    let strength: 'weak' | 'medium' | 'strong';
    let color: string;
    let label: string;
    let percentage: number;

    if (metCount <= 2) {
      strength = 'weak';
      color = 'bg-destructive';
      label = t('auth.passwordWeak');
      percentage = 33;
    } else if (metCount <= 3) {
      strength = 'medium';
      color = 'bg-yellow-500';
      label = t('auth.passwordMedium');
      percentage = 66;
    } else {
      strength = 'strong';
      color = 'bg-green-500';
      label = t('auth.passwordStrong');
      percentage = 100;
    }

    return { requirements, strength, color, label, percentage };
  }, [password, t]);

  if (!password) return null;

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50">{t('auth.passwordStrength')}</span>
          <span className={`font-medium ${
            analysis.strength === 'weak' ? 'text-destructive' :
            analysis.strength === 'medium' ? 'text-yellow-500' : 'text-green-500'
          }`}>
            {analysis.label}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ease-out rounded-full ${analysis.color}`}
            style={{ width: `${analysis.percentage}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-1 gap-1">
        {analysis.requirements.map((req) => (
          <div 
            key={req.key}
            className={`flex items-center gap-2 text-xs transition-colors ${
              req.met ? 'text-green-500' : 'text-white/50'
            }`}
          >
            {req.met ? (
              <Check className="h-3 w-3 shrink-0" />
            ) : (
              <X className="h-3 w-3 shrink-0" />
            )}
            <span className="leading-relaxed">{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
