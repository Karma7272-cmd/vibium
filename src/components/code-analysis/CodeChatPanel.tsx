import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Sparkles, Plus, FolderTree, FileCode, Plug, Check as CheckIcon, RefreshCw, FileEdit, Bot } from "lucide-react";

type Scope = 'project' | 'file';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  updatedFiles?: string[];
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

const stripCodeBlocks = (text: string): string => {
  return text
    .replace(/(?:File:\s*|filename:\s*|File name:\s*|---\s*)[^\n]+?\s*(?:---\s*)?\n```[\w]*\n[\s\S]*?\n```/gi, '')
    .replace(/```[\w]*\n[\s\S]*?\n```/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const CodeChatPanel = ({ allFiles, selectedFile, onFileUpdate, onClose, onAttachFiles }: CodeChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scope, setScope] = useState<Scope>('project');
  const [connectors, setConnectors] = useState<Array<{ connector_id: string; status: string }>>([]);
  const [enabledConnectors, setEnabledConnectors] = useState<string[]>([]);
  const [aiProvider, setAiProvider] = useState<'default' | 'openai' | 'anthropic' | 'gemini'>('default');
  const [autoApplied, setAutoApplied] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from('connector_credentials').select('connector_id,status').then(({ data }) => {
      if (data) setConnectors(data as any);
    });
  }, []);

  const toggleConnector = (id: string) => {
    setEnabledConnectors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const extractAndApplyCode = useCallback((assistantContent: string): string[] => {
    const updatedFileNames: string[] = [];

    if (assistantContent.includes("```")) {
      const filePattern = /(?:File:\s*|filename:\s*|File name:\s*|---\s*)([^\n]+?)\s*(?:---\s*)?\n```[\w]*\n([\s\S]*?)\n```/gi;
      let match;

      while ((match = filePattern.exec(assistantContent)) !== null) {
        const fileName = match[1].trim();
        const codeContent = match[2];

        if (codeContent.length > 50) {
          const pool = scope === 'file' && selectedFile
            ? allFiles.filter(f => f.name === selectedFile.name)
            : allFiles;
          const matchingFile = pool.find(f => f.name.includes(fileName) || fileName.includes(f.name));
          if (matchingFile) {
            onFileUpdate(matchingFile.name, codeContent);
            updatedFileNames.push(matchingFile.name);
          }
        }
      }
    }

    return updatedFileNames;
  }, [allFiles, onFileUpdate, scope, selectedFile]);

  const streamChat = async (userMessage: string) => {
    setIsLoading(true);
    const userMsg: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/code-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            files: scope === 'file' && selectedFile
              ? [{ name: selectedFile.name, content: selectedFile.content, language: '' }]
              : allFiles,
            scope,
            connectors: enabledConnectors,
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

      const updatedFileNames = extractAndApplyCode(assistantContent);

      if (updatedFileNames.length > 0) {
        setAutoApplied(prev => [...prev, ...updatedFileNames]);
        toast({
          title: "Files auto-updated",
          description: `Applied changes to ${updatedFileNames.length} file${updatedFileNames.length > 1 ? 's' : ''}.`,
        });
      }

      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1 && m.role === 'assistant'
            ? { ...m, updatedFiles: updatedFileNames }
            : m
        )
      );

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
    setAutoApplied([]);
  };

  const renderMessageContent = (msg: Message) => {
    if (msg.role === 'user') {
      return (
        <p className="text-xs font-medium whitespace-pre-wrap break-words leading-relaxed">
          {msg.content}
        </p>
      );
    }

    const cleanContent = stripCodeBlocks(msg.content);
    const hasUpdates = msg.updatedFiles && msg.updatedFiles.length > 0;

    return (
      <div className="space-y-2">
        {cleanContent && (
          <p className="text-xs font-medium whitespace-pre-wrap break-words leading-relaxed">
            {cleanContent}
          </p>
        )}
        {hasUpdates && (
          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-border/40">
            <FileEdit className="h-3 w-3 text-emerald-400 shrink-0" />
            <span className="text-[10px] text-emerald-400 font-medium">Auto-applied to:</span>
            {msg.updatedFiles!.map(f => (
              <Badge key={f} variant="secondary" className="text-[9px] h-4 px-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                {f.split('/').pop()}
              </Badge>
            ))}
          </div>
        )}
        {!cleanContent && !hasUpdates && (
          <p className="text-xs text-muted-foreground italic">Processing response...</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-semibold">AI Chat</span>
        </div>
        {/* Scope toggle */}
        <div className="flex items-center rounded-full border border-border bg-muted/40 p-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => setScope('project')}
            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
              scope === 'project' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Edit across all files"
          >
            <FolderTree className="h-3 w-3" /> Project
          </button>
          <button
            type="button"
            onClick={() => setScope('file')}
            disabled={!selectedFile}
            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              scope === 'file' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            title={selectedFile ? 'Only edit the selected file' : 'Select a file first'}
          >
            <FileCode className="h-3 w-3" /> File
          </button>
        </div>
        {/* Connector picker */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded-full border border-border bg-muted/40 text-[10px] text-muted-foreground hover:text-foreground"
              title="Allow AI to use connectors"
            >
              <Plug className="h-3 w-3" />
              {enabledConnectors.length > 0 ? `${enabledConnectors.length} on` : 'Connectors'}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-2">
            <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 px-1">Allow AI access to:</p>
            {connectors.length === 0 ? (
              <p className="text-[11px] text-muted-foreground px-1 py-2">No connectors saved. Visit Connectors page.</p>
            ) : connectors.map(c => (
              <button
                key={c.connector_id}
                onClick={() => toggleConnector(c.connector_id)}
                className="w-full flex items-center justify-between text-xs px-2 py-1.5 rounded hover:bg-muted"
              >
                <span className="capitalize">{c.connector_id}</span>
                {enabledConnectors.includes(c.connector_id) && <CheckIcon className="h-3 w-3 text-primary" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* Scope context bar */}
      <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-b border-border bg-muted/20 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 truncate">
          {scope === 'project' ? (
            <><FolderTree className="h-3 w-3" /> Whole project ({allFiles.length} files)</>
          ) : selectedFile ? (
            <><FileCode className="h-3 w-3" /> <span className="font-mono truncate">{selectedFile.name}</span></>
          ) : (
            <>No file selected</>
          )}
        </div>
        {autoApplied.length > 0 && (
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shrink-0">
            {autoApplied.length} file{autoApplied.length !== 1 ? 's' : ''} updated
          </Badge>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
                <Sparkles className="h-8 w-8 text-muted-foreground/40 relative" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground/70">Ask AI to edit your code</p>
                <p className="text-[10px] text-muted-foreground/50 max-w-[200px]">
                  Describe changes and they&apos;ll be applied automatically to your files
                </p>
              </div>
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
                  {renderMessageContent(msg)}
                </Card>
              </div>
            ))}
          </div>

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start mt-3">
              <Card className="bg-muted p-2.5 shadow-none">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-[10px] text-muted-foreground">Generating & applying changes...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer: attach left, textarea, send right */}
      <div className="p-2">
        <div className="relative rounded-lg border border-border bg-background overflow-hidden">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={scope === 'file' && selectedFile
              ? `Describe changes to ${selectedFile.name.split('/').pop()}...`
              : "Describe code changes to generate or edit..."
            }
            className="w-full min-h-[100px] max-h-[200px] resize-none text-sm bg-transparent px-3 pt-3 pb-12 outline-none placeholder:text-muted-foreground/50"
            disabled={isLoading}
            rows={4}
          />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onAttachFiles}
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                title="Attach file (ZIP, image, file)"
              >
                <Plus className="h-4 w-4" />
              </Button>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewChat}
                  className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                  title="New chat"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-7 w-7 rounded-full bg-foreground text-background hover:bg-foreground/80"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
