
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowUp } from 'lucide-react';

const suggestions = [
  "hacker news on chrome from chicago",
  "google.com on chrome desktop from chicago",
  "github.com on safari mobile from san francisco",
  "wikipedia.org on firefox desktop from dublin",
  "stackoverflow.com on chrome android from bangalore",
  "amazon.com on edge desktop from geneva",
  "reddit.com on safari iphone from sydney",
  "youtube.com on chrome ipad from tokyo",
  "twitter.com on firefox desktop from johannesburg",
  "linkedin.com on chrome mobile from chicago",
  "instagram.com on safari desktop from san francisco",
  "facebook.com on edge mobile from dublin",
  "netflix.com on chrome desktop from bangalore",
  "spotify.com on firefox android from geneva",
  "dropbox.com on safari ipad from sydney",
  "slack.com on lynx desktop from tokyo"
];

const SimpleCheckForm: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use fixed demo prompt if no text entered
    const finalPrompt = prompt || "healthcare.gov on an ipad from dc";
    
    const checkData = {
      prompt: finalPrompt,
      timestamp: new Date().toISOString()
    };
    
    console.log('Creating new check:', checkData);
    
    // Store check data in sessionStorage for the pending page
    sessionStorage.setItem('pendingCheck', JSON.stringify(checkData));
    
    // Navigate to pending request page
    navigate('/pending-request');
  };

  const handleFocus = () => {
    setIsTextareaFocused(true);
  };

  const handleBlur = () => {
    setIsTextareaFocused(false);
  };

  const currentPlaceholder = prompt || isTextareaFocused 
    ? "Test anything" 
    : "healthcare.gov on an ipad from dc";

  return (
    <div className={`space-y-4 ${isMobile ? "max-h-[60vh]" : ""}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Textarea
            placeholder={currentPlaceholder}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="w-full min-h-[80px] text-sm sm:text-base px-4 py-3 pr-14 rounded-lg border-2 border-gray-300 hover:border-gray-400 focus:border-gray-400 focus:ring-0 shadow-sm hover:shadow-md transition-all duration-200 placeholder:text-gray-400 resize-none"
            rows={3}
          />
          <Button 
            type="submit"
            className="absolute bottom-2 right-2 w-10 h-10 p-0 bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300 rounded-full font-medium flex items-center justify-center"
            variant="outline"
          >
            <ArrowUp size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SimpleCheckForm;
