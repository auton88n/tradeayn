import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, ChevronDown, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  type GradingRegion,
  type GradingStandards,
  type ValidationResult,
  type PermitCheckResult,
  getGradingStandards,
  validateSlope,
  checkPermitRequirements,
} from '@/lib/gradingStandards';

interface GradingComplianceDisplayProps {
  region: GradingRegion;
  disturbedAreaAcres?: number;
  designSlopes?: {
    foundation?: number;
    fill?: number;
    impervious?: number;
  };
}

const StatusIcon: React.FC<{ severity: 'pass' | 'warning' | 'error' }> = ({ severity }) => {
  switch (severity) {
    case 'pass':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-500" />;
  }
};

const StatusBadge: React.FC<{ severity: 'pass' | 'warning' | 'error' }> = ({ severity }) => {
  const styles = {
    pass: 'bg-green-500/10 text-green-600 border-green-500/30',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    error: 'bg-red-500/10 text-red-600 border-red-500/30',
  };
  const labels = { pass: 'PASS', warning: 'WARNING', error: 'FAIL' };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${styles[severity]}`}>
      {labels[severity]}
    </span>
  );
};

export const GradingComplianceDisplay: React.FC<GradingComplianceDisplayProps> = ({
  region,
  disturbedAreaAcres = 0,
  designSlopes = {},
}) => {
  const standards = getGradingStandards(region);
  const permitCheck = checkPermitRequirements(disturbedAreaAcres, standards);

  // Validate slopes if provided
  const slopeValidations: ValidationResult[] = [];
  if (designSlopes.foundation !== undefined) {
    slopeValidations.push(validateSlope(designSlopes.foundation, 'foundation', standards));
  }
  if (designSlopes.fill !== undefined) {
    slopeValidations.push(validateSlope(designSlopes.fill, 'fill', standards));
  }
  if (designSlopes.impervious !== undefined) {
    slopeValidations.push(validateSlope(designSlopes.impervious, 'impervious', standards));
  }

  return (
    <div className="space-y-4">
      {/* Permit Requirements Alert */}
      {permitCheck.required && (
        <Card className="p-4 border-amber-500/50 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-600 dark:text-amber-400">Permit Required</h4>
              <div className="mt-2 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Disturbed area:</span>{' '}
                  <span className="font-medium">{permitCheck.disturbedArea} {permitCheck.unit}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Threshold:</span>{' '}
                  <span className="font-medium">≥ {permitCheck.threshold} {permitCheck.unit}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Permit:</span>{' '}
                  <span className="font-medium">{permitCheck.permitName}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Authority:</span>{' '}
                  <span className="font-medium">{permitCheck.authority}</span>
                </p>
                {permitCheck.swpppRequired && (
                  <p className="text-amber-600 dark:text-amber-400 font-medium mt-2">
                    SWPPP/Erosion Control Plan required
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{permitCheck.codeReference}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Slope Validation */}
      {slopeValidations.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Slope Compliance
          </h4>
          <div className="space-y-2">
            {slopeValidations.map((validation, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <StatusIcon severity={validation.severity} />
                  <span className="text-sm">{validation.message}</span>
                </div>
                <StatusBadge severity={validation.severity} />
              </div>
            ))}
          </div>
          {slopeValidations.some((v) => v.suggestion) && (
            <div className="mt-3 pt-3 border-t border-border/50">
              {slopeValidations
                .filter((v) => v.suggestion)
                .map((v, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    💡 {v.suggestion}
                  </p>
                ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Reference: {standards.drainage.codeReference}
          </p>
        </Card>
      )}

      {/* Compaction Requirements */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Compaction Requirements</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-2 text-left font-medium">Application</th>
                <th className="px-2 py-2 text-left font-medium">Requirement</th>
                <th className="px-2 py-2 text-left font-medium">Standard</th>
              </tr>
            </thead>
            <tbody>
              {standards.compaction.items.map((item, index) => (
                <tr key={index} className="border-b border-border/50 last:border-0">
                  <td className="px-2 py-2">{item.application}</td>
                  <td className="px-2 py-2 font-medium">{item.requirement}</td>
                  <td className="px-2 py-2 text-muted-foreground">{item.standard}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Reference: {standards.compaction.codeReference}
        </p>
        {standards.compaction.frostProtectionNote && (
          <p className="text-xs text-blue-500 mt-1">
            ❄️ {standards.compaction.frostProtectionNote}
          </p>
        )}
      </Card>

      {/* Code References (Collapsible) */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full py-2">
          <ChevronDown className="w-4 h-4" />
          Code References
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="p-4 mt-2">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Storm Water:</span>
                <span className="font-medium text-right">{standards.stormWater.codeReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Excavation:</span>
                <span className="font-medium text-right">{standards.excavation.codeReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Drainage:</span>
                <span className="font-medium text-right">{standards.drainage.codeReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Compaction:</span>
                <span className="font-medium text-right">{standards.compaction.codeReference}</span>
              </div>
            </div>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
