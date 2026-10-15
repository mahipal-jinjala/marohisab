import { tr } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { SectionPage } from "@/components/SectionPage";

export const Route = createFileRoute("/_authenticated/household")({
  head: () => ({ meta: [{ title: tr("ઘરખર્ચ — મારો હિસાબ") }, { name: "description", content: tr("કરિયાણું, બિલ, શિક્ષણ અને ઘરના રોજિંદા ખર્ચ.") }] }),
  component: () => (
    <SectionPage section="household" title={tr("ઘરખર્ચ")}
      actions={[{ k: "expense", l: tr("ખર્ચ ઉમેરો") }, { k: "income", l: tr("આવક ઉમેરો") }, { k: "transfer", l: tr("ટ્રાન્સફર") }]} />
  ),
});
