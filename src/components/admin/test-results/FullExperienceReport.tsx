import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Share2, RefreshCw, Clock } from "lucide-react";
import ExperienceScoreCard from "./ExperienceScoreCard";
import UserSentimentSection from "./UserSentimentSection";
import TestInsightsSection from "./TestInsightsSection";
import ImprovementPriorities from "./ImprovementPriorities";
import JourneyHealthMap from "./JourneyHealthMap";
import PerformanceFeeling from "./PerformanceFeeling";
import { useState } from "react";
import { toast } from "sonner";

interface FullExperienceReportProps {
  testPassRate?: number;
  errorRate?: number;
  avgResponseTime?: number;
  supportTickets?: number;
  coveragePercent?: number;
  lastUpdated?: Date;
}

const FullExperienceReport = ({
  testPassRate = 94,
  errorRate = 2.5,
  avgResponseTime = 1.8,
  supportTickets = 5,
  coveragePercent = 87,
  lastUpdated = new Date(),
}: FullExperienceReportProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    toast.success("Report data refreshed");
  };

  const handleExportPDF = () => {
    toast.info("PDF export feature coming soon!");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Report link copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Full Experience Report
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive analysis of platform health, user experience, and improvement areas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Updated {lastUpdated.toLocaleString()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <ExperienceScoreCard
        testPassRate={testPassRate}
        errorRate={errorRate}
        avgResponseTime={avgResponseTime}
        supportTickets={supportTickets}
        coveragePercent={coveragePercent}
      />

      {/* Two Column Layout for Sentiment and Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UserSentimentSection
          avgLoadSpeed={avgResponseTime}
          errorRate={errorRate}
          supportTicketsThisWeek={supportTickets}
          featureAdoptionRate={78}
        />
        <PerformanceFeeling
          pageLoad={1.2}
          aiResponse={2.5}
          fileUpload={3.1}
          calculation={0.8}
        />
      </div>

      {/* Test Insights - Full Width */}
      <TestInsightsSection />

      {/* Two Column Layout for Journey and Improvements */}
      <div className="grid gap-6 lg:grid-cols-2">
        <JourneyHealthMap />
        <ImprovementPriorities />
      </div>

      {/* Report Footer */}
      <div className="p-4 rounded-lg bg-muted/50 border text-center">
        <p className="text-sm text-muted-foreground">
          This report is generated from {coveragePercent}% test coverage across 16 test categories.
          For the most accurate results, ensure all E2E tests are run regularly.
        </p>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>📊 {testPassRate}% overall pass rate</span>
          <span>🧪 300+ automated tests</span>
          <span>🔄 Last full run: Today</span>
        </div>
      </div>
    </div>
  );
};

export default FullExperienceReport;
