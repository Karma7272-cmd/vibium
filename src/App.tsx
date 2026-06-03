import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import NewCheck from "./pages/NewCheck";
import Analytics from "./pages/Analytics";
import History from "./pages/History";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import CodeAnalysis from "./pages/CodeAnalysis";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Security from "./pages/Security";
import Pricing from "./pages/Pricing";
import Connectors from "./pages/Connectors";
import Deployments from "./pages/Deployments";
import TerminalPage from "./pages/Terminal";
import Pipelines from "./pages/Pipelines";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="system">
    <SettingsProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <SidebarProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<NewCheck />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/code-analysis" element={<CodeAnalysis />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/security" element={<Security />} />
                  <Route path="/connectors" element={<Connectors />} />
                  <Route path="/deployments" element={<Deployments />} />
                  <Route path="/terminal" element={<TerminalPage />} />
                  <Route path="/pipelines" element={<Pipelines />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </SidebarProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </SettingsProvider>
  </ThemeProvider>
);

export default App;
