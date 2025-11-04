import { useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Upload, Github, FileCode, Loader2, Download, Wand2, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";
import { FileTreeView } from "@/components/code-analysis/FileTreeView";
import { CodeChatPanel } from "@/components/code-analysis/CodeChatPanel";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CodeFile {
  name: string;
  content: string;
  language: string;
}

const CodeAnalysis = () => {
  const [activeSection, setActiveSection] = useState("code-analysis");
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const zipFile = files.find(file => file.name.endsWith('.zip'));

    if (zipFile) {
      await processZipFile(zipFile);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a ZIP file containing your code.",
        variant: "destructive",
      });
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.zip')) {
      await processZipFile(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a ZIP file containing your code.",
        variant: "destructive",
      });
    }
  };

  const processZipFile = async (file: File) => {
    setAnalyzing(true);
    toast({
      title: "Processing ZIP file",
      description: `Extracting ${file.name}...`,
    });

    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const extractedFiles: CodeFile[] = [];

      for (const [filename, zipEntry] of Object.entries(contents.files)) {
        if (!zipEntry.dir && isCodeFile(filename)) {
          const content = await zipEntry.async('text');
          extractedFiles.push({
            name: filename,
            content,
            language: getLanguageFromFilename(filename),
          });
        }
      }

      if (extractedFiles.length === 0) {
        toast({
          title: "No code files found",
          description: "The ZIP file doesn't contain any recognized code files.",
          variant: "destructive",
        });
      } else {
        setCodeFiles(extractedFiles);
        setSelectedFile(extractedFiles[0]);
        toast({
          title: "Success",
          description: `Extracted ${extractedFiles.length} code files.`,
        });
      }
    } catch (error) {
      console.error('Error processing ZIP:', error);
      toast({
        title: "Error",
        description: "Failed to process ZIP file.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const isCodeFile = (filename: string): boolean => {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', 
                           '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.html', '.css', 
                           '.json', '.xml', '.sql', '.sh', '.bash'];
    return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
      'py': 'python', 'java': 'java', 'cpp': 'cpp', 'c': 'c', 'cs': 'csharp',
      'go': 'go', 'rs': 'rust', 'php': 'php', 'rb': 'ruby', 'swift': 'swift',
      'kt': 'kotlin', 'html': 'html', 'css': 'css', 'json': 'json', 'xml': 'xml',
      'sql': 'sql', 'sh': 'bash', 'bash': 'bash'
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  const handleAiAction = async (action: 'analyze' | 'fix' | 'explain' | 'optimize') => {
    if (!selectedFile) return;

    setIsAiProcessing(true);
    setAnalysisResult("");

    try {
      const { data, error } = await supabase.functions.invoke('analyze-code', {
        body: {
          code: selectedFile.content,
          action,
          fileName: selectedFile.name,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (action === 'fix' || action === 'optimize') {
        setSelectedFile({ ...selectedFile, content: data.result });
        toast({
          title: "Success",
          description: `Code ${action === 'fix' ? 'fixed' : 'optimized'} successfully!`,
        });
      } else {
        setAnalysisResult(data.result);
      }
    } catch (error: any) {
      console.error('AI action error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process request.",
        variant: "destructive",
      });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleExport = () => {
    if (!selectedFile) return;

    const blob = new Blob([selectedFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: `${selectedFile.name} downloaded successfully.`,
    });
  };

  const handleExportAll = async () => {
    if (codeFiles.length === 0) return;

    toast({
      title: "Creating ZIP",
      description: "Packaging all files...",
    });

    try {
      const zip = new JSZip();

      // Add all files to the ZIP
      codeFiles.forEach(file => {
        zip.file(file.name, file.content);
      });

      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download the ZIP
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'code-export.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `All ${codeFiles.length} files exported as code-export.zip`,
      });
    } catch (error) {
      console.error('Error creating ZIP:', error);
      toast({
        title: "Export Failed",
        description: "Failed to create ZIP file.",
        variant: "destructive",
      });
    }
  };

  const handleCodeEdit = (newContent: string) => {
    if (selectedFile) {
      setSelectedFile({ ...selectedFile, content: newContent });
      const updatedFiles = codeFiles.map(f => 
        f.name === selectedFile.name ? { ...f, content: newContent } : f
      );
      setCodeFiles(updatedFiles);
    }
  };

  const handleGithubConnect = () => {
    toast({
      title: "GitHub Integration",
      description: "GitHub connection feature coming soon!",
    });
  };

  return (
    <>
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold">Code Analysis & AI Editor</h1>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            {!codeFiles.length ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="h-5 w-5" />
                    Upload Your Code
                  </CardTitle>
                  <CardDescription>
                    Upload your code as a ZIP file or connect your GitHub repository
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload">Upload ZIP</TabsTrigger>
                      <TabsTrigger value="github">GitHub</TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="space-y-4">
                      <div
                        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                          dragActive
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <input
                          type="file"
                          accept=".zip"
                          onChange={handleFileInput}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={analyzing}
                        />
                        <div className="flex flex-col items-center gap-4">
                          {analyzing ? (
                            <>
                              <Loader2 className="h-12 w-12 animate-spin text-primary" />
                              <p className="text-lg font-medium">Processing files...</p>
                            </>
                          ) : (
                            <>
                              <Upload className="h-12 w-12 text-muted-foreground" />
                              <div>
                                <p className="text-lg font-medium">
                                  Drag & drop your ZIP file here
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  or click to browse
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="github" className="space-y-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center gap-6 text-center">
                            <div className="rounded-full bg-primary/10 p-4">
                              <Github className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold mb-2">
                                Connect GitHub Repository
                              </h3>
                              <p className="text-sm text-muted-foreground mb-6">
                                Authorize access to analyze your GitHub repositories
                              </p>
                            </div>
                            <Button
                              onClick={handleGithubConnect}
                              size="lg"
                              className="gap-2"
                            >
                              <Github className="h-5 w-5" />
                              Connect GitHub
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <Card className="lg:col-span-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-sm">
                        {showChat ? 'AI Chat' : `File Explorer (${codeFiles.length})`}
                      </CardTitle>
                      {!showChat && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportAll}
                          className="h-7 text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Export All
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="chat-mode"
                        checked={showChat}
                        onCheckedChange={setShowChat}
                      />
                      <Label htmlFor="chat-mode" className="text-xs cursor-pointer">
                        AI Chat Mode
                      </Label>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 h-[350px]">
                    {showChat ? (
                      <CodeChatPanel
                        selectedFile={selectedFile}
                        onCodeUpdate={(newContent) => handleCodeEdit(newContent)}
                        onClose={() => setShowChat(false)}
                      />
                    ) : (
                      <div className="p-2">
                        <FileTreeView
                          files={codeFiles}
                          selectedFile={selectedFile?.name || null}
                          onFileSelect={(fileName) => {
                            const file = codeFiles.find(f => f.name === fileName);
                            if (file) setSelectedFile(file);
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="lg:col-span-3 space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{selectedFile?.name}</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAiAction('analyze')}
                            disabled={isAiProcessing}
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Analyze
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAiAction('fix')}
                            disabled={isAiProcessing}
                          >
                            <Wand2 className="h-4 w-4 mr-2" />
                            Fix Bugs
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAiAction('optimize')}
                            disabled={isAiProcessing}
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            Optimize
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={selectedFile?.content || ''}
                        onChange={(e) => handleCodeEdit(e.target.value)}
                        className="font-mono text-sm min-h-[400px] max-h-[600px]"
                        placeholder="Select a file to view and edit..."
                      />
                    </CardContent>
                  </Card>

                  {analysisResult && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">AI Analysis Result</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                            {analysisResult}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {isAiProcessing && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">
                            AI is processing your request...
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </>
  );
};

export default CodeAnalysis;
