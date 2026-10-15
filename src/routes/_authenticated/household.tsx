import { createFileRoute } from "@tanstack/react-router";
import { SectionPage } from "@/components/SectionPage";

export const Route = createFileRoute("/_authenticated/household")({
  head: () => ({ meta: [{ title: "ઘરખર્ચ — મારો હિસાબ" }, { name: "description", content: "કરિયાણું, બિલ, શિક્ષણ અને ઘરના રોજિંદા ખર્ચ." }] }),
  component: () => (
    <SectionPage section="household" title="ઘરખર્ચ"
      actions={[{ k: "expense", l: "ખર્ચ ઉમેરો" }, { k: "income", l: "આવક ઉમેરો" }, { k: "transfer", l: "ટ્રાન્સફર" }]} />
  ),
});
