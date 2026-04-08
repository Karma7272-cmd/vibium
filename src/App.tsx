import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NewCheck from "./pages/NewCheck";
import PendingRequest from "./pages/PendingRequest";
import NodeProfile from "./pages/NodeProfile";
import OperatorProfile from "./pages/OperatorProfile";
import CheckProfile from "./pages/CheckProfile";
import Agents from "./pages/Agents";
import Analytics from "./pages/Analytics";
import History from "./pages/History";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import About from "./pages/About";
import Nodes from "./pages/Nodes";
import Operators from "./pages/Operators";
import Checks from "./pages/Checks";
import Settings from "./pages/Settings";
import CodeAnalysis from "./pages/CodeAnalysis";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

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
                  <Route path="/pending-request" element={<PendingRequest />} />
                  <Route path="/network" element={<Index />} />
                  <Route path="/operators" element={<Operators />} />
                  <Route path="/nodes" element={<Nodes />} />
                  <Route path="/agents" element={<Agents />} />
                  <Route path="/checks" element={<Checks />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/code-analysis" element={<CodeAnalysis />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/node/:npub" element={<NodeProfile />} />
                  <Route path="/operator/:npub" element={<OperatorProfile />} />
                  <Route path="/check/:checkId" element={<CheckProfile />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
