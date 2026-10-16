import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { UnicornShield } from "@/components/wcu/UnicornShield";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Mail, Phone, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — World Crime Unicorn" },
      { name: "description", content: "Create an account or sign in to use live safety sharing." },
      { property: "og:title", content: "Sign in — World Crime Unicorn" },
      { property: "og:description", content: "Secure accounts for community safety tools." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [authType, setAuthType] = React.useState<"email" | "phone">("email");
  const [mode, setMode] = React.useState<"in" | "up">("in");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/account" });
    });
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) navigate({ to: "/account" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth", data: { full_name: name } },
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const sendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      toast.error("Please enter your mobile phone number");
      return;
    }
    const formatted = cleanPhone.startsWith("+") ? cleanPhone : `+27${cleanPhone.replace(/^0/, "")}`;
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formatted,
      });
      if (error) throw error;
      setOtpSent(true);
      toast.success(`Verification code sent to ${formatted}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send SMS code. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const verifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    const cleanPhone = phone.trim();
    const formatted = cleanPhone.startsWith("+") ? cleanPhone : `+27${cleanPhone.replace(/^0/, "")}`;
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formatted,
        token: otpCode,
        type: "sms",
      });
      if (error) throw error;
      if (data.session) {
        toast.success("Successfully signed in!");
        navigate({ to: "/account" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code. Please check and try again.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Google sign-in failed");
  };

  const input = "w-full rounded-2xl border border-border bg-surface-2/60 px-3 py-3 text-sm outline-none focus:border-neon";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <UnicornShield className="mx-auto h-20 w-18" />
      <h1 className="mt-4 text-center font-display text-xl font-bold tracking-wide">
        {authType === "phone" ? "Mobile Verification" : mode === "in" ? "Welcome back" : "Create your account"}
      </h1>

      {/* Auth Type Switcher */}
      <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface-2/40 p-1">
        <button
          type="button"
          onClick={() => { setAuthType("email"); setOtpSent(false); }}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all",
            authType === "email" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Mail className="h-3.5 w-3.5" /> Email
        </button>
        <button
          type="button"
          onClick={() => { setAuthType("phone"); setSent(false); }}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all",
            authType === "phone" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Phone className="h-3.5 w-3.5" /> Mobile SMS
        </button>
      </div>

      {authType === "phone" ? (
        <div className="glass mt-5 rounded-3xl p-5">
          {!otpSent ? (
            <form onSubmit={sendPhoneOtp} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Enter your mobile number to receive a one-time verification code via SMS.
              </p>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone number</label>
                <input
                  className={input}
                  type="tel"
                  placeholder="e.g. 082 123 4567 or +27..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <button
                disabled={busy || !phone.trim()}
                className="glow-electric w-full rounded-2xl bg-gradient-to-r from-electric to-violet py-3 font-display text-sm font-bold tracking-widest text-electric-foreground disabled:opacity-60"
              >
                {busy ? "SENDING CODE…" : "SEND SMS CODE"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyPhoneOtp} className="space-y-4">
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="flex items-center gap-1.5 text-xs text-neon hover:underline"
              >
                <ArrowLeft className="h-3 w-3" /> Change number ({phone})
              </button>
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to your phone.
              </p>
              <div className="flex justify-center py-2">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <button
                disabled={busy || otpCode.length < 6}
                className="glow-electric w-full rounded-2xl bg-gradient-to-r from-electric to-violet py-3 font-display text-sm font-bold tracking-widest text-electric-foreground disabled:opacity-60"
              >
                {busy ? "VERIFYING…" : "VERIFY & SIGN IN"}
              </button>
              <button
                type="button"
                onClick={sendPhoneOtp}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Didn't get a code? Resend SMS
              </button>
            </form>
          )}
        </div>
      ) : sent ? (
        <div className="glass mt-6 rounded-3xl p-5 text-center text-sm">
          Check <b>{email}</b> and tap the link to verify your account, then sign in.
        </div>
      ) : (
        <form onSubmit={submit} className="glass mt-6 space-y-3 rounded-3xl p-5">
          {mode === "up" && (
            <input className={input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input className={input} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={input} type="password" minLength={8} placeholder="Password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button disabled={busy} className="glow-electric w-full rounded-2xl bg-gradient-to-r from-electric to-violet py-3 font-display text-sm font-bold tracking-widest text-electric-foreground disabled:opacity-60">
            {busy ? "PLEASE WAIT…" : mode === "in" ? "SIGN IN" : "CREATE ACCOUNT"}
          </button>
          <button type="button" onClick={google} className="w-full rounded-2xl border border-border py-3 text-sm font-semibold">
            Continue with Google
          </button>
        </form>
      )}

      {authType === "email" && (
        <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setSent(false); }} className="mt-4 text-center text-xs text-neon">
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      )}
    </div>
  );
}

