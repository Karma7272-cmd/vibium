
import React from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorldMap from './WorldMap';
import NetworkStats from './NetworkStats';

const MainContent: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmitUrlClick = () => {
    navigate('/');
  };

  const handleRunNodeClick = () => {
    navigate('/run-node');
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-transparent dark:sunrise-gradient p-2 sm:p-4 lg:p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-foreground mb-2">Live Network Preview</h1>
          <p className="text-sm sm:text-lg text-gray-600 dark:text-muted-foreground">Real-time testing activity across our global network of nodes</p>
        </div>
        
        {/* Network Statistics */}
        <NetworkStats />
        
        {/* World Map */}
        <div className="bg-white dark:bg-card/40 dark:backdrop-blur-sm rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-border p-3 sm:p-6 mb-4 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-foreground">Global Test Activity</h2>
            <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-500 dark:text-muted-foreground">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Running</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full"></div>
                <span>Failed</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 sm:h-96">
            <WorldMap liveMode={true} />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="bg-white dark:bg-card/40 dark:backdrop-blur-sm rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-border p-4 sm:p-8 text-center">
          <h3 className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-foreground mb-2 sm:mb-4">Ready to check your site?</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-muted-foreground mb-4 sm:mb-8">Submit your URL and get instant feedback from nodes worldwide</p>
          
          <button 
            onClick={handleSubmitUrlClick}
            className="bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-lg transition-colors duration-200 inline-flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <span>Check a Website</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          <div className="mt-4 sm:mt-6">
            <button 
              onClick={handleRunNodeClick}
              className="text-gray-500 dark:text-muted-foreground hover:text-primary dark:hover:text-primary text-xs sm:text-sm inline-flex items-center space-x-1 transition-colors duration-200"
            >
              <span>Or, want to run checks for others?</span>
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContent;
