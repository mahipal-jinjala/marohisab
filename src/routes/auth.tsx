import { tr, translatedError } from "@/lib/i18n";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: tr("પ્રવેશ — મારો હિસાબ") }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      { name: "description", content: tr("મારો હિસાબમાં લૉગિન કરો અથવા નવું ખાતું બનાવો.") },
      { property: "og:title", content: tr("પ્રવેશ — મારો હિસાબ") },
      { property: "og:description", content: tr("ગુજરાતી હિસાબ એપમાં લૉગિન કરો.") },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg({ ok: false, t: tr("માન્ય ઇમેઇલ દાખલ કરો") });
    if (mode !== "reset" && password.length < 6) return setMsg({ ok: false, t: tr("પાસવર્ડ ઓછામાં ઓછો 6 અક્ષરનો હોવો જોઈએ") });
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/dashboard" } });
        if (error) throw error;
        if (data.session) navigate({ to: "/dashboard" });
        else setMsg({ ok: true, t: tr("ઇમેઇલ તપાસો અને ખાતું પુષ્ટિ કરો.") });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        setMsg({ ok: true, t: tr("પાસવર્ડ રીસેટ લિંક ઇમેઇલ પર મોકલી છે.") });
      }
    } catch (err) {
      setMsg({ ok: false, t: translatedError(err) });
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero p-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-card md:p-8">
        <h1 className="text-center text-4xl font-bold text-primary">{tr("મારો હિસાબ")}</h1>
        <p className="mb-6 mt-1 text-center text-muted-foreground">
          {mode === "in" ? tr("તમારા ખાતામાં પ્રવેશ કરો") : mode === "up" ? tr("નવું ખાતું બનાવો") : tr("પાસવર્ડ ભૂલી ગયા?")}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="em">{tr("ઇમેઇલ")}</Label>
            <Input id="em" className="h-12" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {mode !== "reset" && <div className="space-y-1.5"><Label htmlFor="pw">{tr("પાસવર્ડ")}</Label>
            <Input id="pw" className="h-12" type="password" autoComplete={mode === "up" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></div>}
          {msg && <p className={`rounded-lg p-2 text-sm ${msg.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{msg.t}</p>}
          <Button type="submit" size="lg" className="h-12 w-full text-lg" disabled={busy}>
            {busy ? tr("રાહ જુઓ…") : mode === "in" ? tr("પ્રવેશ") : mode === "up" ? tr("ખાતું બનાવો") : tr("લિંક મોકલો")}
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm">
          <button className="text-primary underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>
            {mode === "in" ? tr("નવું ખાતું બનાવો") : tr("પ્રવેશ પર પાછા")}
          </button>
          {mode === "in" && <button className="text-muted-foreground underline" onClick={() => { setMode("reset"); setMsg(null); }}>{tr("પાસવર્ડ ભૂલી ગયા?")}</button>}
        </div>
      </div>
    </div>
  );
}
