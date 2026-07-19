"use client";
import PlutoLogo from "@/components/ui/PlutoLogo";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { 
  Loader2, 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  Smartphone, 
  Code2, 
  Database,
  Sparkles,
  MapPin,
  CircleDollarSign,
  FileCheck2,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#00a4ef" d="M13 1h10v10H13z" />
      <path fill="#7fba00" d="M1 13h10v10H1z" />
      <path fill="#ffb900" d="M13 13h10v10H13z" />
    </svg>
  );
}

type AuthStep = 
  | "EMAIL_INPUT" 
  | "PASSWORD_INPUT" 
  | "SUGGEST_OAUTH" 
  | "SUGGEST_SIGNUP" 
  | "SIGNUP_VERIFY" 
  | "SIGNUP_COMPLETE";

function WorkflowSimulator() {
  const [activeTab, setActiveTab] = useState<"kanban" | "automation" | "metrics">("kanban");
  
  // Interactive mini kanban board
  const [kanbanCards, setKanbanCards] = useState([
    { id: 1, title: "Acme Corp Lead", value: "$18,500", stage: "incoming" },
    { id: 2, title: "Database Migration", value: "$4,200", stage: "progress" },
    { id: 3, title: "Contract Signed", value: "$30,000", stage: "completed" },
  ]);

  const moveCard = (id: number) => {
    setKanbanCards(prev => prev.map(c => {
      if (c.id === id) {
        const stages: ("incoming" | "progress" | "completed")[] = ["incoming", "progress", "completed"];
        const nextIdx = (stages.indexOf(c.stage as any) + 1) % stages.length;
        return { ...c, stage: stages[nextIdx] };
      }
      return c;
    }));
  };

  // Automation toggles
  const [autoRules, setAutoRules] = useState([
    { id: 1, trigger: "Lead marked Hot", action: "Assign sales rep", active: true },
    { id: 2, trigger: "Tasks completed", action: "Move card to Done", active: true },
    { id: 3, trigger: "Card archived", action: "Send Slack alert", active: false },
  ]);

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col h-[480px]">
      {/* Simulator IDE Bar */}
      <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-900 p-0.5 rounded-lg border border-white/5">
          <button
            onClick={() => setActiveTab("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === "kanban" 
                ? "bg-blue-600 text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mini Kanban
          </button>
          <button
            onClick={() => setActiveTab("automation")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === "automation" 
                ? "bg-blue-600 text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Automations
          </button>
          <button
            onClick={() => setActiveTab("metrics")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === "metrics" 
                ? "bg-blue-600 text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Performance
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-blue-400 font-mono">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          Workflow
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 p-6 overflow-y-auto bg-slate-900/40">
        
        {/* Tab 1: Mini Kanban Board */}
        {activeTab === "kanban" && (
          <div className="h-full flex flex-col justify-between animate-fade-in text-left">
            <div className="mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1">Interactive Board</span>
              <p className="text-xs text-slate-350">Tap a card to push it through your pipeline stages.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 flex-1 items-stretch min-h-0 pb-2">
              {/* Columns */}
              {(["incoming", "progress", "completed"] as const).map(stage => (
                <div key={stage} className="bg-slate-950/40 border border-white/5 rounded-xl p-2 flex flex-col gap-2 min-h-[220px]">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider capitalize">{stage}</span>
                    <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full">
                      {kanbanCards.filter(c => c.stage === stage).length}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col gap-2 overflow-y-auto scrollbar-none">
                    {kanbanCards.filter(c => c.stage === stage).map(card => (
                      <button
                        key={card.id}
                        onClick={() => moveCard(card.id)}
                        className="w-full text-left bg-white/5 hover:bg-white/10 active:scale-98 border border-white/10 p-2.5 rounded-lg transition-all group flex flex-col gap-1"
                      >
                        <span className="text-[11px] font-bold text-white group-hover:text-blue-400 transition-colors">
                          {card.title}
                        </span>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[9px] text-slate-400">{card.value}</span>
                          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Automation Rules */}
        {activeTab === "automation" && (
          <div className="h-full flex flex-col justify-between animate-fade-in text-left">
            <div className="mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1">Triggers & Actions</span>
              <p className="text-xs text-slate-350">Toggle rules to automate repetitive database tasks.</p>
            </div>

            <div className="space-y-3 flex-1">
              {autoRules.map(rule => (
                <button
                  key={rule.id}
                  onClick={() => setAutoRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r))}
                  className="w-full bg-slate-950/60 border border-white/5 p-3 rounded-xl flex items-center justify-between text-left transition-all hover:border-white/10 group"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-mono">IF: {rule.trigger}</span>
                    <span className="text-[11px] text-white font-semibold">THEN: {rule.action}</span>
                  </div>
                  <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${rule.active ? "bg-emerald-500" : "bg-slate-800"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${rule.active ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Performance Metrics */}
        {activeTab === "metrics" && (
          <div className="h-full flex flex-col justify-between animate-fade-in text-left">
            <div className="mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1">Lead Conversion Velocity</span>
              <p className="text-xs text-slate-350">Historical analytics on board productivity.</p>
            </div>

            <div className="flex-1 bg-slate-950/80 border border-white/5 rounded-xl p-4 flex flex-col justify-between h-[220px]">
              {/* Minimal SVG Sparkline Chart */}
              <div className="flex-1 flex items-end gap-2 pb-2">
                {[45, 60, 30, 80, 50, 95, 75, 90].map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                    <div 
                      className="w-full bg-blue-500/80 hover:bg-blue-400 rounded-md transition-all duration-500" 
                      style={{ height: `${(val / 100) * 110}px` }}
                    />
                    <span className="text-[8px] font-mono text-slate-500">M{idx + 1}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between border-t border-white/5 pt-2 text-[10px] text-slate-400 font-mono">
                <span>Avg cycle: <strong className="text-white">4.2 days</strong></span>
                <span>Active boards: <strong className="text-white">12</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/boards";
  const error = searchParams.get("error");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  // Flow control
  const [step, setStep] = useState<AuthStep>("EMAIL_INPUT");
  const [userProvider, setUserProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Check email registration
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        if (!data.exists) {
          setStep("SUGGEST_SIGNUP");
        } else if (data.provider === "credentials") {
          setStep("PASSWORD_INPUT");
        } else {
          setUserProvider(data.provider);
          setStep("SUGGEST_OAUTH");
        }
      } else {
        setSubmitError("Failed to check email registration");
      }
    } catch {
      setSubmitError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Trigger login via Credentials provider
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setSubmitError(null);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password: password.trim(),
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setSubmitError("Invalid email or password");
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setSubmitError("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // Send signup verification code
  const handleSendVerificationCode = async () => {
    setLoading(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/auth/signup/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("SIGNUP_VERIFY");
        toast({ title: "Verification code sent!", variant: "success" });
      } else {
        setSubmitError(data.error ?? "Failed to send verification code");
      }
    } catch {
      setSubmitError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Complete Signup and auto-login
  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) return;

    setLoading(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/auth/signup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          name: name.trim(),
          password: password.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Account created successfully!", variant: "success" });
        // Auto signin after successful signup
        const loginRes = await signIn("credentials", {
          email: email.trim(),
          password: password.trim(),
          redirect: false,
          callbackUrl,
        });
        if (loginRes?.error) {
          setStep("EMAIL_INPUT");
        } else {
          router.push(callbackUrl);
        }
      } else {
        setSubmitError(data.error ?? "Failed to complete sign up");
      }
    } catch {
      setSubmitError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // OAuth handlers
  async function handleOAuthSignIn(provider: "google" | "microsoft-entra-id") {
    setLoading(true);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setLoading(false);
    }
  }

  const errorMessages: Record<string, string> = {
    suspended: "Your account has been suspended. Please contact an administrator.",
    OAuthSignin: "OAuth sign-in failed. Please try again.",
    OAuthCallback: "OAuth callback failed. Please try again.",
    OAuthCreateAccount: "Could not create account. Please try again.",
    Default: "Something went wrong. Please try again.",
  };

  const errorMessage = submitError || (error ? (errorMessages[error] ?? errorMessages.Default) : null);

  return (
    <main className="min-h-screen flex">
      {/* Left panel — branding & SwiftUI Simulator */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex-col justify-between p-12 relative overflow-hidden border-r border-white/10">
        {/* Background glow highlights */}
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]" />
        </div>

        {/* Top Header Logo */}
        <div className="relative z-10">
          <PlutoLogo size="lg" textClassName="text-white" />
        </div>

        {/* Center SwiftUI Simulator View */}
        <div className="relative z-10 my-auto py-8 space-y-6 w-full max-w-lg mx-auto">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
              Focus on minimal & intuitive workflow management.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Push cards across custom stages, configure trigger-action rules, and track cycle times effortlessly.
            </p>
          </div>

          {/* Render Workflow simulator */}
          <WorkflowSimulator />
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-center text-slate-500 text-xs pt-4 border-t border-white/5">
          <span>© 2026 pluto.</span>
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            Enterprise Guard Secured
          </span>
        </div>
      </div>

      {/* Right panel — login / signup forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 lg:bg-white">
        <div className="w-full max-w-md bg-white p-6 lg:p-0 rounded-2xl border border-slate-100 lg:border-none shadow-sm lg:shadow-none space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center">
            <PlutoLogo size="md" textClassName="text-slate-800" />
          </div>

          {/* Flow headers */}
          <div className="text-center lg:text-left">
            {step === "EMAIL_INPUT" && (
              <>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome</h2>
                <p className="mt-2 text-slate-500">Sign in or create an account</p>
              </>
            )}
            {step === "PASSWORD_INPUT" && (
              <>
                <button onClick={() => setStep("EMAIL_INPUT")} className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-3 hover:underline">
                  <ArrowLeft className="w-3 h-3" /> Change email
                </button>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Enter password</h2>
                <p className="mt-2 text-slate-500">Sign in as <span className="font-semibold text-slate-800">{email}</span></p>
              </>
            )}
            {step === "SUGGEST_OAUTH" && (
              <>
                <button onClick={() => setStep("EMAIL_INPUT")} className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-3 hover:underline">
                  <ArrowLeft className="w-3 h-3" /> Use different email
                </button>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Sign in with provider</h2>
                <p className="mt-2 text-slate-500">This account is connected to <span className="font-semibold text-slate-800 capitalize">{userProvider}</span>.</p>
              </>
            )}
            {step === "SUGGEST_SIGNUP" && (
              <>
                <button onClick={() => setStep("EMAIL_INPUT")} className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-3 hover:underline">
                  <ArrowLeft className="w-3 h-3" /> Change email
                </button>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Create account?</h2>
                <p className="mt-2 text-slate-500">No account was found for <span className="font-semibold text-slate-800">{email}</span>. Would you like to sign up?</p>
              </>
            )}
            {step === "SIGNUP_VERIFY" && (
              <>
                <button onClick={() => setStep("EMAIL_INPUT")} className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-3 hover:underline">
                  <ArrowLeft className="w-3 h-3" /> Cancel signup
                </button>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Verify Email</h2>
                <p className="mt-2 text-slate-500">Enter the verification code sent to <span className="font-semibold text-slate-800">{email}</span></p>
              </>
            )}
          </div>

          {/* Error messages */}
          {errorMessage && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
          )}

          {/* Form states rendering */}
          <div className="space-y-4">
            {/* Step 1: Email Input */}
            {step === "EMAIL_INPUT" && (
              <form onSubmit={handleCheckEmail} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                </button>
                <p className="text-center text-sm text-slate-500 mt-4">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      if (email.trim()) {
                        handleSendVerificationCode();
                      } else {
                        toast({ title: "Please enter your email address first", variant: "default" });
                      }
                    }}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </form>
            )}

            {/* Step 2: Password Input */}
            {step === "PASSWORD_INPUT" && (
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      id="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log In"}
                </button>
              </form>
            )}

            {/* Step 3: Suggest OAuth provider */}
            {step === "SUGGEST_OAUTH" && (
              <div className="space-y-3 pt-2">
                {userProvider === "google" && (
                  <button
                    onClick={() => handleOAuthSignIn("google")}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-350 transition-all disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
                    Continue with Google
                  </button>
                )}
                {userProvider === "microsoft" && (
                  <button
                    onClick={() => handleOAuthSignIn("microsoft-entra-id")}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-355 transition-all disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MicrosoftIcon />}
                    Continue with Microsoft
                  </button>
                )}
              </div>
            )}

            {/* Step 4: Suggest Signup Option */}
            {step === "SUGGEST_SIGNUP" && (
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleSendVerificationCode}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Up with Email Code"}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOAuthSignIn("google")}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-650 hover:bg-slate-50 hover:border-slate-300 transition-all"
                  >
                    <GoogleIcon /> Google
                  </button>
                  <button
                    onClick={() => handleOAuthSignIn("microsoft-entra-id")}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-655 hover:bg-slate-50 hover:border-slate-300 transition-all"
                  >
                    <MicrosoftIcon /> Microsoft
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Verification Code Entry */}
            {step === "SIGNUP_VERIFY" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="code" className="text-xs font-bold text-slate-500 uppercase">Verification Code</label>
                  <input
                    id="code"
                    type="text"
                    required
                    placeholder="123456"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCode(val);
                      if (val.length === 6) {
                        setStep("SIGNUP_COMPLETE");
                      }
                    }}
                    className="w-full text-center tracking-widest text-lg font-bold py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => {
                    if (code.trim().length === 6) {
                      setStep("SIGNUP_COMPLETE");
                    } else {
                      toast({ title: "Please enter a valid 6-digit code", variant: "destructive" });
                    }
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all"
                >
                  Verify Code
                </button>
              </div>
            )}

            {/* Step 6: Complete Signup Information */}
            {step === "SIGNUP_COMPLETE" && (
              <form onSubmit={handleCompleteSignup} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="complete-password" className="text-xs font-bold text-slate-500 uppercase">Set Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      id="complete-password"
                      type="password"
                      required
                      placeholder="Choose a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Sign Up"}
                </button>
              </form>
            )}
          </div>

          {/* Social login divider (only show on email entry screen) */}
          {step === "EMAIL_INPUT" && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-semibold tracking-wide">Or connect with</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-350 transition-all disabled:opacity-60 active:scale-98"
                >
                  <GoogleIcon />
                  Google
                </button>
                <button
                  onClick={() => handleOAuthSignIn("microsoft-entra-id")}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-350 transition-all disabled:opacity-60 active:scale-98"
                >
                  <MicrosoftIcon />
                  Microsoft
                </button>
              </div>
            </>
          )}

          <p className="text-center text-xs text-slate-400 leading-relaxed">
            By signing in, you agree to our terms of service and privacy policy.
            <br />Your data is protected with enterprise-grade security.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
