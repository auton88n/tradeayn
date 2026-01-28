import React from 'react';
import { MessageSquare, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { GradingRegionSelector } from './GradingRegionSelector';
import { type GradingRegion, getGradingStandards } from '@/lib/gradingStandards';

interface GradingRequirementsProps {
  requirements: string;
  onRequirementsChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  hasPoints: boolean;
  region: GradingRegion;
  onRegionChange: (region: GradingRegion) => void;
}

const PRESET_TEMPLATES: Record<GradingRegion, Array<{ label: string; value: string }>> = {
  USA: [
    {
      label: 'Residential Development',
      value: 'Design grading for a residential development with proper drainage away from building pads. Target 5% slope minimum for 10 feet from foundations per IBC 2024. Balance cut and fill as much as possible. Include access road grades at 8% maximum.',
    },
    {
      label: 'Commercial Site',
      value: 'Grade commercial site for parking lot and building pad. Ensure ADA compliant slopes (max 2% for accessible routes). Design for storm water retention per EPA CGP requirements. Maximum parking lot slope 5%.',
    },
    {
      label: 'Industrial Yard',
      value: 'Level industrial yard for heavy equipment operations. Minimize slopes, target 1% for drainage only. Design for heavy vehicle traffic. Include loading dock area at specific elevation. Maximum fill slope 50% (2:1).',
    },
    {
      label: 'Sports Field',
      value: 'Grade sports field with crown design (0.5% slope from center to edges). Ensure excellent drainage per ASTM standards. Sub-grade design for turf installation. Surrounding areas at 2% slope away from field.',
    },
  ],
  CANADA: [
    {
      label: 'Residential Development',
      value: 'Design grading for a residential development with proper drainage away from building pads. Target 5% slope minimum for 1.8m from foundations per NBCC 2025. Balance cut and fill as much as possible. Include access road grades at 8% maximum.',
    },
    {
      label: 'Commercial Site',
      value: 'Grade commercial site for parking lot and building pad. Ensure barrier-free compliant slopes (max 2% for accessible routes). Design for storm water management per provincial requirements. Maximum parking lot slope 5%.',
    },
    {
      label: 'Industrial Yard',
      value: 'Level industrial yard for heavy equipment operations. Minimize slopes, target 1% for drainage only. Design for heavy vehicle traffic. Include loading dock area at specific elevation. Maximum fill slope 33% (3:1) per NBCC.',
    },
    {
      label: 'Sports Field',
      value: 'Grade sports field with crown design (0.5% slope from center to edges). Ensure excellent drainage per CSA standards. Sub-grade design for turf installation with frost protection. Surrounding areas at 2% slope away from field.',
    },
  ],
};

export const GradingRequirements: React.FC<GradingRequirementsProps> = ({
  requirements,
  onRequirementsChange,
  onGenerate,
  isGenerating,
  hasPoints,
  region,
  onRegionChange,
}) => {
  const standards = getGradingStandards(region);
  const templates = PRESET_TEMPLATES[region];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        Design Requirements
      </h3>

      <div className="space-y-4">
        {/* Region Selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">Region & Standards</label>
          <GradingRegionSelector
            selectedRegion={region}
            onRegionChange={onRegionChange}
          />
        </div>

        {/* Quick Templates */}
        <div>
          <label className="text-sm font-medium mb-2 block">Quick Templates</label>
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <Button
                key={template.label}
                variant="outline"
                size="sm"
                onClick={() => onRequirementsChange(template.value)}
                className="text-xs"
              >
                {template.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Requirements Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Describe your grading requirements
          </label>
          <Textarea
            value={requirements}
            onChange={(e) => onRequirementsChange(e.target.value)}
            placeholder={`Describe your project requirements in natural language. For example: 'Create a level building pad at elevation 45.0m with ${standards.drainage.foundationSlope.percent}% drainage slope towards the east. Access road from north side with max 6% grade.'`}
            rows={5}
            className="resize-none"
          />
        </div>

        {/* Standards Info Box */}
        <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground/80 mb-1">{standards.codeDisplayText}</p>
            <p>{standards.disclaimer}</p>
          </div>
        </div>

        <Button
          onClick={onGenerate}
          disabled={!hasPoints || isGenerating}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          size="lg"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Generating Design...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Grading Design with AI
            </>
          )}
        </Button>

        {!hasPoints && (
          <p className="text-sm text-muted-foreground text-center">
            Upload survey data first to enable AI design generation
          </p>
        )}
      </div>
    </Card>
  );
};
