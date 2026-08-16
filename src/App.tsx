import { lazy, Suspense } from 'react';
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";

// Lazy load all pages for faster initial load
const Home = lazy(() => import("@/pages/Home"));
const Prophets = lazy(() => import("@/pages/Prophets"));
const QuranValues = lazy(() => import("@/pages/QuranValues"));
const KidsZone = lazy(() => import("@/pages/KidsZone"));
const PrayerGuide = lazy(() => import("@/pages/PrayerGuide"));
const Hadiths = lazy(() => import("@/pages/Hadiths"));
const Duas = lazy(() => import("@/pages/Duas"));
const AsmaulHusna = lazy(() => import("@/pages/AsmaulHusna"));
const Surahs = lazy(() => import("@/pages/Surahs"));
const Sahabah = lazy(() => import("@/pages/Sahabah"));
const IslamicCalendar = lazy(() => import("@/pages/IslamicCalendar"));
const Karbala = lazy(() => import("@/pages/Karbala"));
const About = lazy(() => import("@/pages/About"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Contact = lazy(() => import("@/pages/Contact"));
const Terms = lazy(() => import("@/pages/Terms"));
const Tasbih = lazy(() => import("@/pages/Tasbih"));
const Qibla = lazy(() => import("@/pages/Qibla"));
const Login = lazy(() => import("@/pages/Login"));
const Reels = lazy(() => import("@/pages/Reels"));
const queryClient = new QueryClient();

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full min-h-screen bg-background">
    <div className="text-center">
      <div className="text-4xl mb-4">☪️</div>
      <div className="text-primary font-serif text-lg animate-pulse">Loading...</div>
    </div>
  </div>
);

function Router() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <Switch>
          <Route path="/" component={Home}/>
          <Route path="/prophets" component={Prophets}/>
          <Route path="/quran-values" component={QuranValues}/>
          <Route path="/kids" component={KidsZone}/>
          <Route path="/prayer-guide" component={PrayerGuide}/>
          <Route path="/hadiths" component={Hadiths}/>
          <Route path="/duas" component={Duas}/>
          <Route path="/asmaul-husna" component={AsmaulHusna}/>
          <Route path="/surahs" component={Surahs}/>
          <Route path="/sahabah" component={Sahabah}/>
          <Route path="/calendar" component={IslamicCalendar}/>
          <Route path="/karbala" component={Karbala}/>
          <Route path="/about" component={About}/>
          <Route path="/contact" component={Contact}/>
          <Route path="/terms" component={Terms}/>
          <Route path="/tasbih" component={Tasbih}/>
          <Route path="/qibla" component={Qibla}/>
          <Route path="/login" component={Login}/>
          <Route path="/reels" component={Reels}/>
          <Route component={NotFound}/>
        </Switch>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
        <LanguageProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/,"")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </LanguageProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
