
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Check, Clock } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

const PendingRequest: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { id: '1', text: 'Validating request parameters', completed: false },
    { id: '2', text: 'Finding available nodes', completed: false },
    { id: '3', text: 'Matching optimal node location', completed: false },
    { id: '4', text: 'Establishing connection with node', completed: false },
    { id: '5', text: 'Initiating check request', completed: false },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [checkData, setCheckData] = useState<any>(null);

  useEffect(() => {
    // Get check data from sessionStorage
    const storedCheck = sessionStorage.getItem('pendingCheck');
    if (storedCheck) {
      setCheckData(JSON.parse(storedCheck));
    } else {
      // If no check data, redirect back to new check page
      navigate('/');
      return;
    }

    // Start the checklist process
    const interval = setInterval(() => {
      setCurrentStep((prevStep) => {
        const nextStep = prevStep + 1;
        
        // Update checklist items
        setChecklistItems((prevItems) =>
          prevItems.map((item, index) => ({
            ...item,
            completed: index < nextStep,
          }))
        );

        // If all steps are complete, redirect to check page
        if (nextStep >= 5) {
          clearInterval(interval);
          setTimeout(() => {
            // Use consistent demo check ID
            const checkId = "demo_healthcare_gov_ipad_dc";
            navigate(`/check/${checkId}`);
          }, 1000);
        }

        return nextStep;
      });
    }, 1000); // Each step takes 1 second

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar 
        activeSection="" 
        onSectionChange={() => {}} 
      />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">nuvic ai</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-50 dark:bg-transparent">
          <div className="w-full max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-primary/20 rounded-full mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-primary animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">Processing Your Request</h1>
              <p className="text-gray-600 dark:text-muted-foreground">
                Checking: <span className="font-medium">{checkData?.prompt}</span>
              </p>
            </div>

            <div className="bg-white dark:bg-card/40 dark:backdrop-blur-sm rounded-lg border border-gray-200 dark:border-border shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-foreground">Matching to Network Node</h2>
              <div className="space-y-3">
                {checklistItems.map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      item.completed 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                        : index === currentStep 
                        ? 'bg-blue-100 dark:bg-primary/20 text-blue-600 dark:text-primary' 
                        : 'bg-gray-100 dark:bg-muted text-gray-400 dark:text-muted-foreground'
                    }`}>
                      {item.completed ? (
                        <Check className="w-4 h-4" />
                      ) : index === currentStep ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`text-sm ${
                      item.completed 
                        ? 'text-green-800 dark:text-green-300 line-through' 
                        : index === currentStep 
                        ? 'text-blue-800 dark:text-primary font-medium' 
                        : 'text-gray-600 dark:text-muted-foreground'
                    }`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
              
              {currentStep >= 5 && (
                <div className="mt-6 text-center">
                  <p className="text-green-600 dark:text-green-400 font-medium">All steps completed! Redirecting to check results...</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <footer className="mt-8 text-center py-4 border-t border-gray-200 dark:border-border bg-gray-50 dark:bg-transparent">
          <p className="text-xs text-gray-400 dark:text-muted-foreground">
            created with{' '}
            <a 
              href="/operator/npub1huggins123456789abcdef0123456789abcdef0123456789abcdef0123456789"
              className="text-blue-400 hover:text-blue-600 dark:text-primary dark:hover:text-accent underline"
            >
              hugs
            </a>
          </p>
        </footer>
      </SidebarInset>
    </div>
  );
};

export default PendingRequest;
