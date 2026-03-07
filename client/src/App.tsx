import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import JoinTeam from "./pages/JoinTeam";
import { useAuth } from "./_core/hooks/useAuth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// Guard: redirects to /login if not authenticated
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path={"/"} component={Landing} />
      <Route path={"/login"} component={Login} />
      <Route path={"/join"} component={JoinTeam} />

      {/* Protected app */}
      <Route path={"/app"}>
        {() => <ProtectedRoute component={Home} />}
      </Route>

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
