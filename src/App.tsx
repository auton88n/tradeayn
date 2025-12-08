import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AYNEmotionProvider } from "@/contexts/AYNEmotionContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { PageLoader } from "@/components/ui/page-loader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";

// Lazy load all route pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Settings = lazy(() => import("./pages/Settings"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const InfluencerSites = lazy(() => import("./pages/services/InfluencerSites"));
const InfluencerSitesApply = lazy(() => import("./pages/services/InfluencerSitesApply"));
const AIAgents = lazy(() => import("./pages/services/AIAgents"));
const AIAgentsApply = lazy(() => import("./pages/services/AIAgentsApply"));
const Automation = lazy(() => import("./pages/services/Automation"));
const AutomationApply = lazy(() => import("./pages/services/AutomationApply"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <ThemeProvider defaultTheme="light" storageKey="ayn-theme">
        <AYNEmotionProvider>
          <SoundProvider>
            <TooltipProvider>
              <OfflineBanner />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/services/content-creator-sites" element={<InfluencerSites />} />
                      <Route path="/services/content-creator-sites/apply" element={<InfluencerSitesApply />} />
                      <Route path="/services/ai-agents" element={<AIAgents />} />
                      <Route path="/services/ai-agents/apply" element={<AIAgentsApply />} />
                      <Route path="/services/automation" element={<Automation />} />
                      <Route path="/services/automation/apply" element={<AutomationApply />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </BrowserRouter>
            </TooltipProvider>
          </SoundProvider>
        </AYNEmotionProvider>
      </ThemeProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
