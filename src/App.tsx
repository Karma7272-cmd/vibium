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
import PendingRequest from "./pages/PendingRequest";
import NodeProfile from "./pages/NodeProfile";
import OperatorProfile from "./pages/OperatorProfile";
import CheckProfile from "./pages/CheckProfile";
import RunNode from "./pages/RunNode";
import About from "./pages/About";
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
                                                                                                            <Route path="/run-node" element={<RunNode />} />
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
