import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, ArrowRight, X } from "lucide-react";
import splashCity from "@/assets/splash-city.jpg";
import { UnicornShield } from "@/components/wcu/UnicornShield";
import { ROLES, type Role } from "@/lib/wcu/data";
import { useWcu } from "@/lib/wcu/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "World Crime Unicorn — The Crime-Fighting OS In Your Pocket" },
      {
        name: "description",
        content:
          "Join the global fight against crime. Report incidents, follow live crime maps and get AI threat alerts from one app.",
      },
      { property: "og:title", content: "World Crime Unicorn — One App. Safer Communities." },
      {
        property: "og:description",
        content:
          "Detect, prevent, respond, protect. A community crime-fighting app with live maps, AI alerts and instant reporting.",
      },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const { setRole, role } = useWcu();
  const [picking, setPicking] = React.useState(false);
  const [signingIn, setSigningIn] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const choose = (r: Role) => {
    setRole(r);
    navigate({ to: "/home" });
  };

  const signIn = (e: React.FormEvent) => {
    e.preventDefault();
    setRole(role ?? "citizen");
    navigate({ to: "/home" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <img
        src={splashCity}
        alt=""
        width={1024}
        height={1536}
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--background) 92%, transparent) 0%, color-mix(in oklab, var(--background) 45%, transparent) 45%, var(--background) 92%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-6 pt-16 pb-10 text-center">
        <div className="relative mb-2">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-neon via-electric to-violet opacity-60 blur-xl animate-pulse" />
          <img
            src="/icon-192.png"
            alt="World Crime Unicorn Emblem"
            width={112}
            height={112}
            className="relative h-28 w-28 rounded-3xl border border-neon/50 shadow-2xl object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <h1 className="mt-5 font-display text-3xl leading-tight font-black tracking-wider">
          <span className="block text-foreground">WORLD CRIME</span>
          <span className="text-gradient-brand block text-4xl">UNICORN</span>
        </h1>
        <p className="mt-2 text-[11px] font-semibold tracking-[0.18em] text-neon">
          ONE APP · SAFER COMMUNITIES · A STRONGER WORLD
        </p>

        <p className="mt-6 max-w-xs text-sm text-foreground/80">
          Join the global fight against crime. Together we make safer communities.
        </p>

        <div className="mt-auto w-full pt-12">
          {picking ? (
            <div className="glass animate-fade-in rounded-3xl p-4 text-left">
              <p className="font-display text-sm font-bold tracking-wide">Choose your role</p>
              <p className="mb-3 text-xs text-muted-foreground">
                Your tools adapt to how you fight crime.
              </p>
              <div className="space-y-2">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => choose(r.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface-2/60 p-3 text-left transition-colors hover:border-neon/60"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-electric/20 text-neon">
                      <ShieldCheck className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{r.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{r.blurb}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setPicking(true)}
              className="glow-electric w-full rounded-2xl bg-gradient-to-r from-electric to-violet py-4 font-display text-sm font-bold tracking-widest text-electric-foreground"
            >
              GET STARTED
            </button>
          )}

          <p className="mt-5 text-xs text-muted-foreground">
            Already have an account?{" "}
            <button onClick={() => setSigningIn(true)} className="font-semibold text-neon">
              Sign In
            </button>
          </p>
        </div>
      </div>

      {signingIn ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 px-4 pb-8 backdrop-blur-sm">
          <form
            onSubmit={signIn}
            className="glass w-full max-w-md animate-fade-in rounded-3xl p-5 text-left"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold tracking-wide">Welcome back</h2>
                <p className="text-xs text-muted-foreground">Sign in to continue the fight.</p>
              </div>
              <button
                type="button"
                onClick={() => setSigningIn(false)}
                className="shrink-0 text-muted-foreground"
                aria-label="Close sign in"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <label htmlFor="email" className="mt-4 mb-1 block text-xs text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-border bg-surface-2/60 px-3 py-3 text-sm outline-none focus:border-neon"
            />
            <label htmlFor="password" className="mt-3 mb-1 block text-xs text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-border bg-surface-2/60 px-3 py-3 text-sm outline-none focus:border-neon"
            />
            <button
              type="submit"
              className="glow-electric mt-5 w-full rounded-2xl bg-gradient-to-r from-electric to-violet py-3 font-display text-sm font-bold tracking-widest text-electric-foreground"
            >
              SIGN IN
            </button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Demo sign-in — no account is created.
            </p>
          </form>
        </div>
      ) : null}
    </div>
  );
}
