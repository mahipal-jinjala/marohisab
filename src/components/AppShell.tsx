import { tr } from "@/lib/i18n";
import { createContext, useContext, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, List, Wallet, HandCoins, TrendingUp, Milk, Home, ShoppingBasket, BarChart3, LogOut, Plus, PanelLeftClose, PanelLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TxnDialog, type TxnPreset } from "./TxnDialog";

const Ctx = createContext<(p: TxnPreset) => void>(() => {});
export const useOpenTxn = () => useContext(Ctx);

const NAV = [
  { to: "/dashboard", label: "ડેશબોર્ડ", icon: LayoutDashboard },
  { to: "/transactions", label: "વ્યવહારો", icon: List },
  { to: "/accounts", label: "ખાતાં", icon: Wallet },
  { to: "/loans", label: "લોન / ઉધાર", icon: HandCoins },
  { to: "/investments", label: "રોકાણ", icon: TrendingUp },
  { to: "/household", label: "ઘરખર્ચ", icon: ShoppingBasket },
  { to: "/ghar", label: "ઘર વેરેન્ટેજ", icon: Home },
  { to: "/dairy", label: "ભેંસ ડેરી", icon: Milk },
  { to: "/reports", label: "રિપોર્ટ", icon: BarChart3 },
] as const;
const MOBILE = ["/dashboard", "/transactions", "/loans", "/reports"];

export function AppShell({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<TxnPreset | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const logout = async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); };

  return (
    <Ctx.Provider value={setPreset}>
      <div className="flex min-h-screen">
        <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-all md:flex ${collapsed ? "w-20" : "w-64"}`}>
          <div className="flex items-center justify-between p-4">
            {!collapsed && <span className="font-display text-2xl font-bold">{tr("મારો હિસાબ")}</span>}
            <button aria-label={tr("સાઇડબાર")} className="rounded-lg p-2 hover:bg-sidebar-accent" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} title={tr(label)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base hover:bg-sidebar-accent"
                activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary" }}>
                <Icon className="size-5 shrink-0" />{!collapsed && tr(label)}
              </Link>
            ))}
          </nav>
          <button onClick={logout} className="m-3 flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-sidebar-accent">
            <LogOut className="size-5" />{!collapsed && tr("બહાર નીકળો")}
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 py-3 pl-4 pr-28 backdrop-blur md:hidden">
            <span className="font-display text-xl font-bold text-primary">{tr("મારો હિસાબ")}</span>
            <Button variant="ghost" size="icon" aria-label={tr("બહાર નીકળો")} onClick={logout}><LogOut className="size-5" /></Button>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4 md:px-8 md:pb-10 md:pt-16">{children}</main>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
          {NAV.filter((n) => MOBILE.includes(n.to)).slice(0, 2).map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground" activeProps={{ className: "text-primary font-semibold" }}>
              <Icon className="size-6" />{tr(label)}
            </Link>
          ))}
          <button aria-label={tr("નવો વ્યવહાર")} onClick={() => setPreset({ kind: "expense" })} className="flex items-center justify-center">
            <span className="-mt-6 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-card"><Plus className="size-7" /></span>
          </button>
          {NAV.filter((n) => MOBILE.includes(n.to)).slice(2).map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground" activeProps={{ className: "text-primary font-semibold" }}>
              <Icon className="size-6" />{tr(label)}
            </Link>
          ))}
        </nav>
        <TxnDialog preset={preset} onClose={() => setPreset(null)} />
      </div>
    </Ctx.Provider>
  );
}

export function MobileMore() {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
      {NAV.filter((n) => !MOBILE.includes(n.to)).map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to} className="flex shrink-0 items-center gap-1.5 rounded-full border bg-card px-3 py-2 text-sm"
          activeProps={{ className: "border-primary text-primary" }}><Icon className="size-4" />{tr(label)}</Link>
      ))}
    </div>
  );
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <>
      <MobileMore />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
    </>
  );
}

export function Stat({ label, value, tone = "default", hint }: { label: string; value: string; tone?: "default" | "good" | "bad" | "hero"; hint?: string }) {
  const toneCls = { default: "bg-card", good: "bg-card", bad: "bg-card", hero: "bg-hero text-primary-foreground" }[tone];
  const valCls = { default: "", good: "text-success", bad: "text-destructive", hero: "" }[tone];
  return (
    <div className={`rounded-2xl border p-4 shadow-card ${toneCls}`}>
      <p className={`text-sm ${tone === "hero" ? "opacity-85" : "text-muted-foreground"}`}>{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${valCls}`}>{value}</p>
      {hint && <p className={`mt-1 text-xs ${tone === "hero" ? "opacity-75" : "text-muted-foreground"}`}>{hint}</p>}
    </div>
  );
}

export function DateRange({ from, to, onChange }: { from: string; to: string; onChange: (f: string, t: string) => void }) {
  const d = new Date();
  const iso = (x: Date) => x.toLocaleDateString("en-CA");
  const presets = [
    { l: tr("આજે"), f: iso(d), t: iso(d) },
    { l: tr("આ મહિને"), f: iso(new Date(d.getFullYear(), d.getMonth(), 1)), t: iso(d) },
    { l: tr("આ વર્ષે"), f: iso(new Date(d.getFullYear(), 0, 1)), t: iso(d) },
    { l: tr("બધું"), f: "2000-01-01", t: iso(d) },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <Button key={p.l} size="sm" variant={from === p.f && to === p.t ? "default" : "outline"} onClick={() => onChange(p.f, p.t)}>{p.l}</Button>
      ))}
      <input type="date" className="h-9 rounded-lg border bg-card px-2 text-sm" value={from} onChange={(e) => onChange(e.target.value, to)} aria-label={tr("થી")} />
      <input type="date" className="h-9 rounded-lg border bg-card px-2 text-sm" value={to} onChange={(e) => onChange(from, e.target.value)} aria-label={tr("સુધી")} />
    </div>
  );
}

export const Card = ({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) => (
  <section className="rounded-2xl border bg-card p-4 shadow-card md:p-5">
    {(title || action) && <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-lg font-bold">{title}</h2>{action}</div>}
    {children}
  </section>
);

export const Loading = () => <div className="py-16 text-center text-muted-foreground">{tr("લોડ થઈ રહ્યું છે…")}</div>;
