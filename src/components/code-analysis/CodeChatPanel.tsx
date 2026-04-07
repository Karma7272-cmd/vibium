import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

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
  onClose?: () => void;
  onAttachFiles?: () => void;
}

export const CodeChatPanel = ({ allFiles, selectedFile, onFileUpdate, onClose, onAttachFiles }: CodeChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

      if (!response.ok || !response.body) {
        throw new Error('Failed to start stream');
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
        const filePattern = /(?:File:\s*|filename:\s*|File name:\s*|---\s*)([^\n]+?)\s*(?:---\s*)?\n```[\w]*\n([\s\S]*?)\n```/gi;
        let match;
        let updatedFiles = 0;
        
        while ((match = filePattern.exec(assistantContent)) !== null) {
          const fileName = match[1].trim();
          const codeContent = match[2];
          
          if (codeContent.length > 50) {
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
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    streamChat(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">AI Chat</span>
        </div>
        {selectedFile && (
          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
            {selectedFile.name.split('/').pop()}
          </span>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-xs text-muted-foreground">
                Ask about your code
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card
                  className={`max-w-[90%] p-2.5 shadow-none ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-xs whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </p>
                </Card>
              </div>
            ))}
          </div>

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start mt-3">
              <Card className="bg-muted p-2.5 shadow-none">
                <Loader2 className="h-3 w-3 animate-spin" />
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer: + button left, textarea, send button right */}
      <div className="border-t border-border p-2">
        <div className="flex items-end gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat}
            className="h-8 w-8 flex-shrink-0 rounded-full"
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your code..."
            className="min-h-[36px] max-h-[100px] resize-none text-xs flex-1 py-2"
            disabled={isLoading}
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-8 w-8 flex-shrink-0 rounded-full"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
