import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CodeFile {
  name: string;
  content: string;
  language: string;
}

interface CodeChatPanelProps {
  allFiles: CodeFile[];
  selectedFile: { name: string; content: string } | null;
  onFileUpdate: (fileName: string, newContent: string) => void;
}

export const CodeChatPanel = ({ allFiles, selectedFile, onFileUpdate }: CodeChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    setIsLoading(true);
    const userMsg: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/code-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            files: allFiles
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Rate limit exceeded",
            description: "Too many requests. Please try again in a moment.",
            variant: "destructive",
          });
          return;
        }
        if (response.status === 402) {
          toast({
            title: "Payment required",
            description: "Please add credits to your Lovable AI workspace.",
            variant: "destructive",
          });
          return;
        }
        throw new Error('Failed to start stream');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      let streamDone = false;

      const updateAssistantMessage = (content: string) => {
        assistantContent = content;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => 
              i === prev.length - 1 ? { ...m, content } : m
            );
          }
          return [...prev, { role: 'assistant', content }];
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistantMessage(assistantContent + content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Check if the response contains code that should update files
      if (assistantContent.includes("```")) {
        // Look for file mentions before code blocks
        const filePattern = /(?:File:\s*|filename:\s*|File name:\s*|---\s*)([^\n]+?)\s*(?:---\s*)?\n```[\w]*\n([\s\S]*?)\n```/gi;
        let match;
        let updatedFiles = 0;
        
        while ((match = filePattern.exec(assistantContent)) !== null) {
          const fileName = match[1].trim();
          const codeContent = match[2];
          
          if (codeContent.length > 50) {
            // Find the matching file
            const matchingFile = allFiles.find(f => f.name.includes(fileName) || fileName.includes(f.name));
            if (matchingFile) {
              onFileUpdate(matchingFile.name, codeContent);
              updatedFiles++;
            }
          }
        }
        
        if (updatedFiles > 0) {
          toast({
            title: "Code Updated",
            description: `Updated ${updatedFiles} file${updatedFiles > 1 ? 's' : ''} with AI suggestions.`,
          });
        }
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message.",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    
    if (allFiles.length === 0) {
      toast({
        title: "No files loaded",
        description: "Please upload a ZIP file first.",
        variant: "destructive",
      });
      return;
    }

    streamChat(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 sm:p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs sm:text-sm font-semibold">AI Assistant</span>
        </div>
      </div>

      <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs bg-muted/50 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
          <div>
            <span className="text-muted-foreground">Analyzing </span>
            <span className="font-semibold">{allFiles.length} files</span>
          </div>
          {selectedFile && (
            <div className="truncate">
              <span className="text-muted-foreground hidden sm:inline"> • Currently: </span>
              <span className="font-mono text-[10px] sm:text-xs">{selectedFile.name}</span>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-2 sm:p-3" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Sparkles className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Ask me to analyze, fix, or improve your code
            </p>
          </div>
        )}
        
        <div className="space-y-3 sm:space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card
                className={`max-w-[90%] sm:max-w-[85%] p-2 sm:p-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
              </Card>
            </div>
          ))}
        </div>

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start mt-3 sm:mt-4">
            <Card className="bg-muted p-2 sm:p-3">
              <Loader2 className="h-4 w-4 animate-spin" />
            </Card>
          </div>
        )}
      </ScrollArea>

      <div className="p-2 sm:p-3 border-t">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={allFiles.length > 0 ? "Ask about your code..." : "Upload files first..."}
            className={`${isMobile ? 'min-h-[50px] text-xs' : 'min-h-[60px] text-sm'} max-h-[120px] resize-none pr-12`}
            disabled={isLoading || allFiles.length === 0}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || allFiles.length === 0}
            size="icon"
            className={`absolute bottom-1 right-1 ${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full`}
          >
            <Send className={isMobile ? 'h-3 w-3' : 'h-4 w-4'} />
          </Button>
        </div>
      </div>
    </div>
  );
};
