import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Building2, KeyRound, LoaderCircle, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

function AuthFrame({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-md border border-border bg-card p-6 shadow-xl sm:p-8">
        <Link to="/" className="mb-8 inline-flex items-center gap-3" aria-label="Lineage Properties Pvt Ltd home">
          <span className="flex size-10 items-center justify-center border border-border bg-secondary text-primary"><Building2 className="size-5" /></span>
          <span className="font-serif text-lg font-semibold">Lineage Properties Pvt Ltd</span>
        </Link>
        <div className="mb-6 border-b border-border pb-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Private admin access</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {children}
      </section>
    </main>
  );
}

export function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signInWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw new Error("Email or password was not accepted.");
      await navigate({ to: "/admin", replace: true });
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Sign-in could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function sendResetEmail() {
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw new Error("A password reset email could not be sent.");
      setNotice("If this address belongs to an admin account, a reset link is on its way.");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "A password reset email could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithProvider(provider: "google" | "lovable") {
    setBusy(true);
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });
      if (result.error) throw new Error("Sign-in with this provider could not be started.");
      if (!result.redirected) await navigate({ to: "/admin", replace: true });
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Sign-in could not be completed.");
      setBusy(false);
    }
  }

  return (
    <AuthFrame title="Master Admin sign in" description="Sign in with your master administrator credentials or PIN.">
      <div className="space-y-3">
        <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => void signInWithProvider("google")}>
          <Mail /> Continue with Google
        </Button>
        <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => void signInWithProvider("lovable")}>
          <KeyRound /> Continue with Lovable
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>or admin credentials</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={signInWithPassword} className="space-y-4">
        <label className="block space-y-1.5 text-xs font-medium text-secondary-foreground">
          Email address
          <Input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="block space-y-1.5 text-xs font-medium text-secondary-foreground">
          Password / PIN
          <Input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground" role="alert">{error}</p> : null}
        {notice ? <p className="border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-secondary-foreground" role="status">{notice}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="submit" disabled={busy} className="min-w-36">
            {busy ? <LoaderCircle className="animate-spin" /> : null}
            Admin Sign in
          </Button>
          <Button type="button" variant="link" size="sm" disabled={busy} onClick={() => void sendResetEmail()}>
            Forgot password?
          </Button>
        </div>
      </form>
      <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
        Strict administrator access only. Staff invitations and public agent logins are permanently disabled.
      </p>
    </AuthFrame>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [isRecovery, setIsRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setIsRecovery(new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery");
  }, []);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("The password could not be updated. Request a new reset link and try again.");
      setBusy(false);
      return;
    }
    await navigate({ to: "/admin", replace: true });
    setBusy(false);
  }

  return (
    <AuthFrame title="Set a new password" description="Choose a new password for your admin account.">
      {!isRecovery ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Open the password-reset link from your email to continue.</p>
          <Button asChild variant="outline"><Link to="/auth">Back to sign in</Link></Button>
        </div>
      ) : (
        <form onSubmit={updatePassword} className="space-y-4">
          <label className="block space-y-1.5 text-xs font-medium text-secondary-foreground">
            New password
            <Input type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label className="block space-y-1.5 text-xs font-medium text-secondary-foreground">
            Confirm new password
            <Input type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </label>
          {error ? <p className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground" role="alert">{error}</p> : null}
          <Button type="submit" disabled={busy} className="w-full">{busy ? <LoaderCircle className="animate-spin" /> : null}Update password</Button>
        </form>
      )}
    </AuthFrame>
  );
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Checking your sign-in…");

  useEffect(() => {
    let active = true;
    const finish = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (data.user && !error) {
        await navigate({ to: "/admin", replace: true });
        return;
      }
      setMessage("Sign-in could not be completed. Return to the admin sign-in page and try again.");
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && (event === "SIGNED_IN" || event === "USER_UPDATED") && session?.user) {
        void navigate({ to: "/admin", replace: true });
      }
    });
    void finish();
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthFrame title="Finishing sign in" description={message}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Please wait</div>
      <Button asChild variant="outline" className="mt-5"><Link to="/auth">Admin sign in</Link></Button>
    </AuthFrame>
  );
}

export function NoAccessPage() {
  const navigate = useNavigate();
  async function switchAccount() {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  return (
    <AuthFrame title="Access not assigned" description="This account is signed in, but it has not been added to the CRM team.">
      <p className="text-sm leading-relaxed text-muted-foreground">Ask a CRM administrator to invite you. Your account will not see client records until access is assigned.</p>
      <Button type="button" variant="outline" className="mt-5" onClick={() => void switchAccount()}><KeyRound />Use another account</Button>
    </AuthFrame>
  );
}