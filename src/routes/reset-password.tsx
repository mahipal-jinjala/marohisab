import { tr, translatedError } from "@/lib/i18n";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: tr("નવો પાસવર્ડ — મારો હિસાબ") }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "description", content: tr("નવો પાસવર્ડ સેટ કરો.") }, { property: "og:title", content: tr("નવો પાસવર્ડ — મારો હિસાબ") }, { property: "og:description", content: tr("નવો પાસવર્ડ સેટ કરો.") }] }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) return setErr(tr("ઓછામાં ઓછા 6 અક્ષર"));
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setErr(translatedError(error));
    navigate({ to: "/dashboard" });
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero p-4">
      <form onSubmit={save} className="w-full max-w-md space-y-4 rounded-3xl bg-card p-6 shadow-card">
        <h1 className="text-2xl font-bold">{tr("નવો પાસવર્ડ")}</h1>
        <Input className="h-12" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={tr("નવો પાસવર્ડ")} />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button type="submit" size="lg" className="h-12 w-full">{tr("સાચવો")}</Button>
      </form>
    </div>
  );
}
