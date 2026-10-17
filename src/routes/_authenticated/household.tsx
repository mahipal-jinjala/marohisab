import { tr } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { SectionPage } from "@/components/SectionPage";

export const Route = createFileRoute("/_authenticated/household")({
  head: () => ({ meta: [{ title: tr("ઘરખર્ચ — મારો હિસાબ") }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "description", content: tr("કરિયાણું, બિલ, શિક્ષણ અને ઘરના રોજિંદા ખર્ચ.") }, { property: "og:title", content: tr("ઘરખર્ચ — મારો હિસાબ") }, { property: "og:description", content: tr("કરિયાણું, બિલ, શિક્ષણ અને ઘરના રોજિંદા ખર્ચ.") }] }),
  component: () => (
    <SectionPage section="household" title={tr("ઘરખર્ચ")}
      actions={[{ k: "expense", l: tr("ખર્ચ ઉમેરો") }, { k: "income", l: tr("આવક ઉમેરો") }, { k: "transfer", l: tr("ટ્રાન્સફર") }]} />
  ),
});
