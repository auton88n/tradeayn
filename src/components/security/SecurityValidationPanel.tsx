import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, CheckCircle, AlertTriangle, XCircle, 
  Database, Lock, Eye, Activity, RefreshCw 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SecurityStatus {
  timestamp: string;
  validated_by: string;
  extensions_in_public: number;
  rls_enabled_tables: number;
  phone_encryption_enabled: boolean;
  security_functions_available: boolean;
  threat_detection_active: boolean;
  status: 'SECURE' | 'MOSTLY_SECURE' | 'NEEDS_ATTENTION';
}

export const SecurityValidationPanel: React.FC = () => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const runSecurityValidation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('validate_system_security');

      if (error) {
        throw error;
      }

      // Type assertion for the returned JSON data
      const statusData = data as unknown as SecurityStatus;
      setSecurityStatus(statusData);
      
      toast({
        title: 'Security Validation Complete',
        description: `System status: ${statusData.status.replace('_', ' ')}`,
        variant: statusData.status === 'SECURE' ? 'default' : 'destructive'
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to validate system security';
      setError(errorMessage);
      
      toast({
        title: 'Validation Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runSecurityValidation();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SECURE': return 'text-green-600 border-green-200 bg-green-50';
      case 'MOSTLY_SECURE': return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'NEEDS_ATTENTION': return 'text-red-600 border-red-200 bg-red-50';
      default: return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SECURE': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'MOSTLY_SECURE': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'NEEDS_ATTENTION': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };

  const calculateSecurityScore = () => {
    if (!securityStatus) return 0;
    
    let score = 0;
    const maxScore = 6;
    
    if (securityStatus.extensions_in_public === 0) score += 1;
    if (securityStatus.rls_enabled_tables >= 4) score += 1;
    if (securityStatus.phone_encryption_enabled) score += 1;
    if (securityStatus.security_functions_available) score += 1;
    if (securityStatus.threat_detection_active) score += 1;
    if (securityStatus.status === 'SECURE') score += 1;
    
    return Math.round((score / maxScore) * 100);
  };

  const securityScore = calculateSecurityScore();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          System Security Validation
        </CardTitle>
        <CardDescription>
          Comprehensive security status and validation results
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Security Score</p>
            <Progress value={securityScore} className="w-32" />
            <p className="text-xs text-muted-foreground">{securityScore}% secure</p>
          </div>
          
          <Button 
            onClick={runSecurityValidation}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {securityStatus && (
          <>
            <div className={`p-4 rounded-lg border ${getStatusColor(securityStatus.status)}`}>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(securityStatus.status)}
                <span className="font-semibold">
                  Overall Status: {securityStatus.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm">
                Last validated: {new Date(securityStatus.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Database Security
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Extensions in Public Schema</span>
                    <Badge variant={securityStatus.extensions_in_public === 0 ? 'secondary' : 'destructive'}>
                      {securityStatus.extensions_in_public}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">RLS Enabled Tables</span>
                    <Badge variant={securityStatus.rls_enabled_tables >= 4 ? 'secondary' : 'destructive'}>
                      {securityStatus.rls_enabled_tables}/4+
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Data Protection
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Phone Encryption</span>
                    <Badge variant={securityStatus.phone_encryption_enabled ? 'secondary' : 'destructive'}>
                      {securityStatus.phone_encryption_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Security Functions</span>
                    <Badge variant={securityStatus.security_functions_available ? 'secondary' : 'destructive'}>
                      {securityStatus.security_functions_available ? 'Available' : 'Missing'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Threat Monitoring
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Threat Detection</span>
                    <Badge variant={securityStatus.threat_detection_active ? 'secondary' : 'destructive'}>
                      {securityStatus.threat_detection_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Real-time Monitoring</span>
                    <Badge variant="secondary">
                      <Activity className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Security Recommendations</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {securityStatus.extensions_in_public > 0 && (
                  <p>• Consider moving extensions from public schema to extensions schema</p>
                )}
                {securityStatus.rls_enabled_tables < 4 && (
                  <p>• Enable Row Level Security on all sensitive tables</p>
                )}
                {!securityStatus.phone_encryption_enabled && (
                  <p>• Enable phone number encryption for customer data protection</p>
                )}
                {securityStatus.status === 'SECURE' && (
                  <p className="text-green-600">• All security measures are properly configured ✓</p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};