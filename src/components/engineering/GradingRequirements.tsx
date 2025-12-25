import React from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface GradingRequirementsProps {
  requirements: string;
  onRequirementsChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  hasPoints: boolean;
}

const PRESET_TEMPLATES = [
  {
    label: 'Residential Development',
    value: 'Design grading for a residential development with proper drainage away from building pads. Target 1.5% slope minimum. Balance cut and fill as much as possible. Include access road grades at 8% maximum.',
  },
  {
    label: 'Commercial Site',
    value: 'Grade commercial site for parking lot and building pad. Ensure ADA compliant slopes (max 2% for accessible routes). Design for storm water retention. Maximum parking lot slope 5%.',
  },
  {
    label: 'Industrial Yard',
    value: 'Level industrial yard for heavy equipment operations. Minimize slopes, target 1% for drainage only. Design for heavy vehicle traffic. Include loading dock area at specific elevation.',
  },
  {
    label: 'Sports Field',
    value: 'Grade sports field with crown design (0.5% slope from center to edges). Ensure excellent drainage. Sub-grade design for turf installation. Surrounding areas at 2% slope away from field.',
  },
];

export const GradingRequirements: React.FC<GradingRequirementsProps> = ({
  requirements,
  onRequirementsChange,
  onGenerate,
  isGenerating,
  hasPoints,
}) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        Design Requirements
      </h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Quick Templates</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_TEMPLATES.map((template) => (
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

        <div>
          <label className="text-sm font-medium mb-2 block">
            Describe your grading requirements
          </label>
          <Textarea
            value={requirements}
            onChange={(e) => onRequirementsChange(e.target.value)}
            placeholder="Describe your project requirements in natural language. For example: 'Create a level building pad at elevation 45.0m with 2% drainage slope towards the east. Access road from north side with max 6% grade.'"
            rows={5}
            className="resize-none"
          />
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
