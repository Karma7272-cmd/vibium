import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Sparkles, GitBranch, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';
import logo from '@/assets/logo.png';

type Mode = 'signin' | 'signup';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/code-analysis');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingState variant="bars" size="lg" />
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please re-enter your password.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
    } else {
      setEmailSent(true);
    }
  };

  const features = [
    { icon: Sparkles, title: 'AI code generation', desc: 'Describe it, get a full-stack app.' },
    { icon: GitBranch, title: 'GitHub push & PRs', desc: 'Ship straight to your repos.' },
    { icon: ShieldCheck, title: 'Security scanning', desc: 'Catch issues before deploy.' },
    { icon: Zap, title: 'Instant preview', desc: 'Run and test in the browser.' },
  ];

  return (
    <div className="min-h-screen flex bg-background dark:sunrise-gradient">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary/5 border-r border-border flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2.5 w-fit">
          <img src={logo} alt="nuvic ai" className="h-9 w-9 rounded-lg" />
          <span className="text-lg font-bold">nuvic ai</span>
        </Link>

        <div className="space-y-8 max-w-md">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight">Build software with AI that ships</h2>
            <p className="text-muted-foreground">Generate full-stack apps, review code, scan for vulnerabilities and deploy — all in one place.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3 items-start">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} nuvic ai — AI-powered code automation</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="p-4">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 pb-16">
          <div className="w-full max-w-sm animate-fade-in">
            {emailSent ? (
              <div className="text-center space-y-4">
                <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold">Check your email</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Click it to activate your account, then sign in.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setEmailSent(false); setMode('signin'); }}
                >
                  Back to sign in
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
                    <img src={logo} alt="nuvic ai" className="h-10 w-10 rounded-lg" />
                    <span className="text-xl font-bold">nuvic ai</span>
                  </Link>
                  <h1 className="text-2xl font-bold">
                    {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    {mode === 'signin' ? 'Sign in to continue building' : 'Start generating apps in seconds'}
                  </p>
                </div>

                {/* Mode switch */}
                <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted mb-6">
                  {(['signin', 'signup'] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMode(m); setConfirmPassword(''); }}
                      className={`py-2 text-sm font-medium rounded-md transition-colors ${
                        mode === m ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {m === 'signin' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>

                <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-9 h-11"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pl-9 pr-10 h-11"
                        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-password" className="text-xs font-medium">Confirm password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          id="confirm-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Re-enter your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          className="pl-9 h-11"
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full h-11 gap-2" disabled={loading}>
                    {loading && <LoadingState variant="bars" size="sm" />}
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Button>

                  {mode === 'signup' && (
                    <p className="text-[11px] text-center text-muted-foreground">
                      By creating an account you agree to our terms of service and privacy policy.
                    </p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
