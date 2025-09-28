import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Phone, Lock, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useSecurePhoneNumber } from '@/hooks/useSecurePhoneNumber';
import { cn } from '@/lib/utils';

interface SecurePhoneInputProps {
  userId: string;
  canEdit?: boolean;
  showDecryption?: boolean;
  className?: string;
}

export const SecurePhoneInput: React.FC<SecurePhoneInputProps> = ({
  userId,
  canEdit = false,
  showDecryption = false,
  className
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const {
    phoneNumber,
    isLoading,
    error,
    getPhoneNumber,
    updatePhoneNumber,
    validatePhoneFormat
  } = useSecurePhoneNumber();

  useEffect(() => {
    if (userId) {
      getPhoneNumber(userId);
    }
  }, [userId, getPhoneNumber]);

  const handleEdit = () => {
    setInputValue(phoneNumber || '');
    setIsEditing(true);
    setValidationError(null);
  };

  const handleCancel = () => {
    setInputValue('');
    setIsEditing(false);
    setValidationError(null);
  };

  const handleSave = async () => {
    if (!validatePhoneFormat(inputValue)) {
      setValidationError('Invalid phone number format. Use international format (e.g., +1-555-123-4567)');
      return;
    }

    const success = await updatePhoneNumber(userId, inputValue);
    if (success) {
      setIsEditing(false);
      setInputValue('');
      setValidationError(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Real-time validation
    if (value && !validatePhoneFormat(value)) {
      setValidationError('Invalid format - use international format');
    } else {
      setValidationError(null);
    }
  };

  const displayValue = () => {
    if (!phoneNumber) return 'No phone number set';
    
    if (showPhone || showDecryption) {
      return phoneNumber;
    } else {
      // Mask the phone number for privacy
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 4) {
        return `***-***-${cleanPhone.slice(-4)}`;
      }
      return '***-***-****';
    }
  };

  const getSecurityStatus = () => {
    if (!phoneNumber) {
      return {
        status: 'empty',
        color: 'text-gray-500',
        icon: Phone,
        label: 'No phone number'
      };
    }
    
    return {
      status: 'encrypted',
      color: 'text-green-600',
      icon: Lock,
      label: 'Encrypted & Secure'
    };
  };

  const securityStatus = getSecurityStatus();
  const StatusIcon = securityStatus.icon;

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Label>Phone Number</Label>
        <div className="flex items-center gap-2 p-2 border rounded">
          <Shield className="w-4 h-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading secure data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Phone Number
          <Badge variant="secondary" className="text-xs">
            <Lock className="w-3 h-3 mr-1" />
            Encrypted
          </Badge>
        </Label>
        
        <Badge 
          variant={securityStatus.status === 'encrypted' ? 'secondary' : 'outline'}
          className={cn('text-xs', securityStatus.color)}
        >
          <StatusIcon className="w-3 h-3 mr-1" />
          {securityStatus.label}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <div className="relative">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              placeholder="+1-555-123-4567"
              className={cn(
                validationError && 'border-red-500',
                'pr-10'
              )}
            />
            <div className="absolute right-2 top-2">
              {validationError ? (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              ) : inputValue && validatePhoneFormat(inputValue) ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : null}
            </div>
          </div>
          
          {validationError && (
            <p className="text-sm text-red-600">{validationError}</p>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !!validationError}
              size="sm"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
            <Button 
              onClick={handleCancel} 
              variant="outline" 
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border rounded bg-muted/50">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono">{displayValue()}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {phoneNumber && !showDecryption && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPhone(!showPhone)}
                  className="text-xs"
                >
                  {showPhone ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showPhone ? 'Hide' : 'Show'}
                </Button>
              )}
              
              {canEdit && (
                <Button onClick={handleEdit} variant="outline" size="sm">
                  Edit
                </Button>
              )}
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Shield className="w-3 h-3" />
            All phone numbers are encrypted at rest and access is logged
          </div>
        </div>
      )}
    </div>
  );
};