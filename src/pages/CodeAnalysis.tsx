import { useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Upload, Github, FileCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const CodeAnalysis = () => {
  const [activeSection, setActiveSection] = useState("code-analysis");
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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
      await analyzeFile(zipFile);
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
      await analyzeFile(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a ZIP file containing your code.",
        variant: "destructive",
      });
    }
  };

  const analyzeFile = async (file: File) => {
    setAnalyzing(true);
    toast({
      title: "Analyzing code",
      description: `Processing ${file.name}...`,
    });

    // Simulate analysis
    setTimeout(() => {
      setAnalyzing(false);
      toast({
        title: "Analysis complete",
        description: "Code analysis finished successfully.",
      });
    }, 3000);
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
            <h1 className="text-lg font-semibold">Code Analysis & Bug Detection</h1>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="mx-auto w-full max-w-4xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Analyze Your Code
                </CardTitle>
                <CardDescription>
                  Upload your code as a ZIP file or connect your GitHub repository to detect bugs and get suggestions
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
                            <p className="text-lg font-medium">Analyzing code...</p>
                            <p className="text-sm text-muted-foreground">
                              This may take a few moments
                            </p>
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
                            <p className="text-xs text-muted-foreground">
                              Supported format: .zip files containing your source code
                            </p>
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
                              and detect potential bugs
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

            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                      1
                    </div>
                    <h4 className="font-semibold">Upload Code</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload your code as a ZIP file or connect your GitHub repository
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                      2
                    </div>
                    <h4 className="font-semibold">Analyze</h4>
                    <p className="text-sm text-muted-foreground">
                      Our AI analyzes your code for bugs, security issues, and optimization opportunities
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                      3
                    </div>
                    <h4 className="font-semibold">Get Fixes</h4>
                    <p className="text-sm text-muted-foreground">
                      Review detailed reports with suggested fixes and best practices
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
};

export default CodeAnalysis;
