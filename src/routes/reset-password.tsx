import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import brandIcon from "@/assets/images/app_logo_icon_1791456720432.jpg";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — World Crime Unicorn" },
      { name: "description", content: "Choose a new password for your account." },
      { property: "og:title", content: "Reset password — World Crime Unicorn" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:description", content: "Choose a new password for your account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    // Recovery links arrive with type=recovery in the URL hash; supabase-js
    // exchanges it for a recovery session and fires PASSWORD_RECOVERY.
    if (window.location.hash.includes("type=recovery")) setReady(true);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      // Recovery sessions are exempt from current-password checks.
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated — you are signed in");
      navigate({ to: "/account" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-2xl border border-border bg-surface-2/60 px-3 py-3 text-sm outline-none focus:border-neon";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <img src={brandIcon} alt="World Crime Unicorn" className="mx-auto h-20 w-20 rounded-2xl object-cover" />
      <h1 className="mt-4 text-center font-display text-xl font-bold tracking-wide">Choose a new password</h1>

      {ready ? (
        <form onSubmit={submit} className="glass mt-6 space-y-3 rounded-3xl p-5">
          <input
            className={input}
            type="password"
            minLength={8}
            placeholder="New password (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            className={input}
            type="password"
            minLength={8}
            placeholder="Repeat new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <button
            disabled={busy}
            className="glow-electric w-full rounded-2xl bg-gradient-to-r from-electric to-violet py-3 font-display text-sm font-bold tracking-widest text-electric-foreground disabled:opacity-60"
          >
            {busy ? "UPDATING…" : "UPDATE PASSWORD"}
          </button>
        </form>
      ) : (
        <div className="glass mt-6 rounded-3xl p-5 text-center text-sm">
          <p>This page only works from the reset link in your email.</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Open the link we sent you, or{" "}
            <Link to="/auth" className="font-semibold text-neon">
              request a new reset link
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
