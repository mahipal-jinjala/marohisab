import { createFileRoute } from "@tanstack/react-router";
import { SectionPage } from "@/components/SectionPage";

export const Route = createFileRoute("/_authenticated/ghar")({
  head: () => ({ meta: [{ title: "ઘર વેરેન્ટેજ — મારો હિસાબ" }, { name: "description", content: "ઘર સંબંધિત ખર્ચ, વેરો અને સમારકામનો અલગ હિસાબ." }] }),
  component: () => (
    <SectionPage section="ghar" title="ઘર વેરેન્ટેજ"
      intro="તમારી જરૂરિયાત પ્રમાણે કેટેગરી ઉમેરો — સમારકામ, વેરો, બાંધકામ વગેરે."
      actions={[{ k: "expense", l: "ખર્ચ ઉમેરો" }, { k: "asset_buy", l: "ઘર / મિલકત ખર્ચ" }, { k: "loan_taken", l: "ઘર લોન" }, { k: "loan_repay", l: "હપ્તો ચૂકવ્યો" }]} />
  ),
});
