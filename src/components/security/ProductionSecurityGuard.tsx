import React, { useEffect, useState } from 'react';
import { AlertCircle, Shield, Lock, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { log } from '@/lib/secureLogger';

interface SecurityCheck {
  id: string;
  name: string;
  status: 'passing' | 'warning' | 'critical';
  message: string;
}

export function ProductionSecurityGuard() {
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    const runSecurityChecks = () => {
      const checks: SecurityCheck[] = [];
      const isProd = process.env.NODE_ENV === 'production';
      setIsProduction(isProd);

      // Check 1: Console logging in production
      if (isProd) {
        const hasConsoleOverride = typeof window !== 'undefined' && 
          (window.console?.log?.toString().includes('secureLogger') ||
           window.console?.error?.toString().includes('secureLogger'));
        
        checks.push({
          id: 'console-security',
          name: 'Console Logging Security',
          status: hasConsoleOverride ? 'passing' : 'critical',
          message: hasConsoleOverride 
            ? 'Console logging is secured for production'
            : 'Console logging may expose sensitive data in production'
        });
      }

      // Check 2: localStorage usage
      if (typeof window !== 'undefined') {
        const sensitiveKeys = ['password', 'token', 'secret', 'key'];
        let hasSensitiveData = false;
        
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
              hasSensitiveData = true;
              break;
            }
          }
        } catch (error) {
          // localStorage may not be available
        }

        checks.push({
          id: 'storage-security',
          name: 'Client Storage Security',
          status: hasSensitiveData ? 'warning' : 'passing',
          message: hasSensitiveData 
            ? 'Potentially sensitive data found in localStorage'
            : 'No sensitive data detected in client storage'
        });
      }

      // Check 3: HTTPS enforcement
      if (typeof window !== 'undefined') {
        const isHTTPS = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';

        checks.push({
          id: 'https-security',
          name: 'HTTPS Security',
          status: (isHTTPS || isLocalhost) ? 'passing' : 'critical',
          message: isHTTPS 
            ? 'Connection is secured with HTTPS'
            : isLocalhost 
              ? 'Running on localhost (development mode)'
              : 'Connection is not secured - HTTPS required for production'
        });
      }

      // Check 4: Development tools detection
      if (isProd && typeof window !== 'undefined') {
        let devToolsOpen = false;
        try {
          const threshold = 160;
          devToolsOpen = (window.outerHeight - window.innerHeight > threshold) ||
                        (window.outerWidth - window.innerWidth > threshold);
        } catch (error) {
          // Ignore detection errors
        }

        checks.push({
          id: 'devtools-security',
          name: 'Development Tools',
          status: devToolsOpen ? 'warning' : 'passing',
          message: devToolsOpen 
            ? 'Developer tools may be open - sensitive data could be exposed'
            : 'No development tools detected'
        });
      }

      setSecurityChecks(checks);

      // Log security assessment
      const criticalCount = checks.filter(c => c.status === 'critical').length;
      const warningCount = checks.filter(c => c.status === 'warning').length;

      if (criticalCount > 0) {
        log.security('critical_security_issues_detected', {
          criticalCount,
          warningCount,
          totalChecks: checks.length,
          environment: isProd ? 'production' : 'development'
        }, 'critical');
      } else if (warningCount > 0) {
        log.security('security_warnings_detected', {
          warningCount,
          totalChecks: checks.length,
          environment: isProd ? 'production' : 'development'
        }, 'medium');
      }
    };

    runSecurityChecks();

    // Re-run checks periodically in production
    if (process.env.NODE_ENV === 'production') {
      const interval = setInterval(runSecurityChecks, 5 * 60 * 1000); // Every 5 minutes
      return () => clearInterval(interval);
    }
  }, []);

  const criticalIssues = securityChecks.filter(check => check.status === 'critical');
  const warnings = securityChecks.filter(check => check.status === 'warning');

  if (!isProduction && criticalIssues.length === 0 && warnings.length === 0) {
    return null; // Don't show in development if everything is fine
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passing':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passing':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Secure</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {criticalIssues.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-800">
            <strong>Critical Security Issues Detected:</strong> {criticalIssues.length} critical security issue(s) require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {isProduction && (
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Production Security Monitor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {securityChecks.map((check) => (
              <div key={check.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <p className="font-medium">{check.name}</p>
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                  </div>
                </div>
                {getStatusBadge(check.status)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}