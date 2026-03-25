import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { StudioLayout } from "./components/shared/StudioLayout";

// Pages
import Dashboard from "./pages/dashboard";
import Projects from "./pages/projects";
import Songs from "./pages/songs";
import Lyrics from "./pages/lyrics";
import Instrumentals from "./pages/instrumentals";
import Releases from "./pages/releases";
import Analytics from "./pages/analytics";
import Import from "./pages/import";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function Router() {
  return (
    <StudioLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/projects" component={Projects} />
        <Route path="/songs" component={Songs} />
        <Route path="/lyrics" component={Lyrics} />
        <Route path="/instrumentals" component={Instrumentals} />
        <Route path="/releases" component={Releases} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/import" component={Import} />
        <Route component={NotFound} />
      </Switch>
    </StudioLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* IMPORTANT: ensure base is correct, wouter uses standard browser routing */}
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
