import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AYNEmotionProvider } from "@/contexts/AYNEmotionContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { PageLoader } from "@/components/ui/page-loader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AnimatePresence } from 'framer-motion';
import PageTransition from "@/components/PageTransition";
import { ScrollToTop } from "@/components/ScrollToTop";

// Lazy load all route pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Settings = lazy(() => import("./pages/Settings"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AIEmployee = lazy(() => import("./pages/services/AIEmployee"));
const AIEmployeeApply = lazy(() => import("./pages/services/AIEmployeeApply"));
const InfluencerSites = lazy(() => import("./pages/services/InfluencerSites"));
const InfluencerSitesApply = lazy(() => import("./pages/services/InfluencerSitesApply"));
const AIAgents = lazy(() => import("./pages/services/AIAgents"));
const AIAgentsApply = lazy(() => import("./pages/services/AIAgentsApply"));
const Automation = lazy(() => import("./pages/services/Automation"));
const AutomationApply = lazy(() => import("./pages/services/AutomationApply"));
const Support = lazy(() => import("./pages/Support"));

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/services/ai-employee" element={<PageTransition><AIEmployee /></PageTransition>} />
        <Route path="/services/ai-employee/apply" element={<PageTransition><AIEmployeeApply /></PageTransition>} />
        <Route path="/services/content-creator-sites" element={<PageTransition><InfluencerSites /></PageTransition>} />
        <Route path="/services/content-creator-sites/apply" element={<PageTransition><InfluencerSitesApply /></PageTransition>} />
        <Route path="/services/ai-agents" element={<PageTransition><AIAgents /></PageTransition>} />
        <Route path="/services/ai-agents/apply" element={<PageTransition><AIAgentsApply /></PageTransition>} />
        <Route path="/services/automation" element={<PageTransition><Automation /></PageTransition>} />
        <Route path="/services/automation/apply" element={<PageTransition><AutomationApply /></PageTransition>} />
        <Route path="/support" element={<PageTransition><Support /></PageTransition>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

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
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <ScrollToTop />
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <AnimatedRoutes />
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
