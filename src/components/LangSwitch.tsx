import { useEffect } from "react";
import { Languages } from "lucide-react";
import { initLang, setLang, useLang } from "@/lib/i18n";

/** Fixed top-right Gujarati ⇄ English toggle, shown on every page. */
export function LangSwitch() {
  const lang = useLang();
  useEffect(() => { initLang(); }, []);
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "gu" ? "en" : "gu")}
      aria-label={lang === "gu" ? "Switch to English" : "ગુજરાતીમાં બદલો"}
      className="fixed right-3 top-3 z-50 flex h-10 items-center gap-1.5 rounded-full border bg-card px-3 text-sm font-semibold shadow-md hover:bg-muted"
    >
      <Languages className="size-4 text-primary" />
      <span className={lang === "gu" ? "text-primary" : "text-muted-foreground"}>ગુ</span>
      <span className="text-muted-foreground">⇄</span>
      <span className={lang === "en" ? "text-primary" : "text-muted-foreground"}>EN</span>
    </button>
  );
}
