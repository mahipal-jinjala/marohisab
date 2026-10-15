import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "મારો હિસાબ — ગુજરાતી હિસાબ એપ" },
      { name: "description", content: "વ્યક્તિગત, ઘરખર્ચ, લોન, રોકાણ અને ભેંસ ડેરીનો સંપૂર્ણ હિસાબ — ગુજરાતીમાં." },
      { property: "og:title", content: "મારો હિસાબ — ગુજરાતી હિસાબ એપ" },
      { property: "og:description", content: "ડબલ-એન્ટ્રી હિસાબ, રિપોર્ટ અને નેટ વર્થ — ગુજરાતીમાં." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/dashboard" }); });
  }, [navigate]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-hero p-6 text-center text-primary-foreground">
      <h1 className="text-6xl font-bold md:text-7xl">મારો હિસાબ</h1>
      <p className="mt-4 max-w-md text-lg opacity-90">આવક, ખર્ચ, લોન, ઉધાર, રોકાણ, ઘર અને ભેંસ ડેરી — બધો હિસાબ એક જગ્યાએ, સાચી ડબલ-એન્ટ્રી સાથે.</p>
      <Button asChild size="lg" variant="secondary" className="mt-8 h-14 px-10 text-lg"><Link to="/auth">શરૂ કરો</Link></Button>
    </div>
  );
}
