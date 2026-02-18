import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";

import { PageLoader } from "@/components/ui/page-loader";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { AnimatePresence } from 'framer-motion';
import PageTransition from "@/components/shared/PageTransition";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { HelmetProvider } from 'react-helmet-async';

// Lazy load all route pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Settings = lazy(() => import("./pages/Settings"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ApprovalResult = lazy(() => import("./pages/ApprovalResult"));
const Pricing = lazy(() => import("./pages/Pricing"));
const ChartAnalyzerPage = lazy(() => import("./pages/ChartAnalyzerPage"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const SubscriptionCanceled = lazy(() => import("./pages/SubscriptionCanceled"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AnimatedRoutes = () => {
  const location = useLocation();
  
  useVisitorTracking();

  const fastRoutes = ['/settings', '/pricing'];
  const isFastRoute = fastRoutes.some(route => location.pathname.startsWith(route));
  
  const routes = (
    <Routes location={location} key={isFastRoute ? 'fast' : location.pathname}>
      <Route path="/" element={<Suspense fallback={<PageLoader />}><PageTransition><Index /></PageTransition></Suspense>} />
      <Route path="/settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
      <Route path="/pricing" element={<Suspense fallback={<PageLoader />}><Pricing /></Suspense>} />
      <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
      <Route path="/chart-analyzer" element={<Suspense fallback={<PageLoader />}><PageTransition><ChartAnalyzerPage /></PageTransition></Suspense>} />
      <Route path="/approval-result" element={<PageTransition><ApprovalResult /></PageTransition>} />
      <Route path="/subscription-success" element={<PageTransition><SubscriptionSuccess /></PageTransition>} />
      <Route path="/subscription-canceled" element={<PageTransition><SubscriptionCanceled /></PageTransition>} />
      <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
      <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
      <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
    </Routes>
  );

  if (isFastRoute) {
    return routes;
  }

  return (
    <AnimatePresence mode="wait">
      {routes}
    </AnimatePresence>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light" storageKey="ayn-theme">
              <SubscriptionProvider>
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
              </SubscriptionProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
