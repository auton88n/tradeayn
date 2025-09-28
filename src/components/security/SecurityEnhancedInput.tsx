import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSecureInput } from '@/hooks/useSecureInput';
import { cn } from '@/lib/utils';

interface SecurityEnhancedInputProps {
  label?: string;
  multiline?: boolean;
  maxLength?: number;
  allowHtml?: boolean;
  showSecurityStatus?: boolean;
  onSecureChange?: (value: string, isValid: boolean) => void;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SecurityEnhancedInput: React.FC<SecurityEnhancedInputProps> = ({
  label,
  multiline = false,
  maxLength = 1000,
  allowHtml = false,
  showSecurityStatus = true,
  onSecureChange,
  className,
  ...props
}) => {
  const [value, setValue] = useState(props.value?.toString() || '');
  const [isValidated, setIsValidated] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [securityLevel, setSecurityLevel] = useState<'safe' | 'warning' | 'danger'>('safe');
  
  const { validateInput, sanitizeInput, validationError, clearError } = useSecureInput({
    maxLength,
    allowHtml,
    reportThreats: true,
    onThreatDetected: (threats) => {
      setSecurityLevel('danger');
      console.warn('Security threats detected:', threats);
    }
  });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    clearError();
    setIsValidated(false);

    if (newValue.length === 0) {
      setIsValid(true);
      setSecurityLevel('safe');
      onSecureChange?.(newValue, true);
      return;
    }

    // Debounced validation
    setTimeout(async () => {
      const valid = await validateInput(newValue);
      setIsValid(valid);
      setIsValidated(true);
      
      if (valid) {
        const sanitized = sanitizeInput(newValue);
        setSecurityLevel('safe');
        onSecureChange?.(sanitized, true);
      } else {
        setSecurityLevel('danger');
        onSecureChange?.(newValue, false);
      }
    }, 500);
  };

  const getSecurityBadge = () => {
    if (!showSecurityStatus || !isValidated) return null;

    const configs = {
      safe: {
        icon: CheckCircle,
        label: 'Secure',
        variant: 'secondary' as const,
        className: 'text-green-600 border-green-200'
      },
      warning: {
        icon: Shield,
        label: 'Warning',
        variant: 'secondary' as const,
        className: 'text-yellow-600 border-yellow-200'
      },
      danger: {
        icon: AlertTriangle,
        label: 'Threat',
        variant: 'destructive' as const,
        className: 'text-red-600 border-red-200'
      }
    };

    const config = configs[securityLevel];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={cn('absolute right-2 top-2 text-xs', config.className)}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const inputProps = {
    value,
    onChange: handleChange,
    placeholder: props.placeholder,
    disabled: props.disabled,
    className: cn(
      className,
      !isValid && 'border-red-500 focus:border-red-500',
      'pr-20' // Space for security badge
    )
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      <div className="relative">
        {multiline ? (
          <Textarea {...inputProps} />
        ) : (
          <Input {...inputProps} />
        )}
        {getSecurityBadge()}
      </div>

      {validationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {value.length}/{maxLength} characters
        </span>
        {showSecurityStatus && (
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Security validation enabled
          </span>
        )}
      </div>
    </div>
  );
};