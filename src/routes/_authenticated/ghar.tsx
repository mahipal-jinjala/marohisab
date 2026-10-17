import { tr } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { SectionPage } from "@/components/SectionPage";

export const Route = createFileRoute("/_authenticated/ghar")({
  head: () => ({ meta: [{ title: tr("ઘર વેરેન્ટેજ — મારો હિસાબ") }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "description", content: tr("ઘર સંબંધિત ખર્ચ, વેરો અને સમારકામનો અલગ હિસાબ.") }, { property: "og:title", content: tr("ઘર વેરેન્ટેજ — મારો હિસાબ") }, { property: "og:description", content: tr("ઘર સંબંધિત ખર્ચ, વેરો અને સમારકામનો અલગ હિસાબ.") }] }),
  component: () => (
    <SectionPage section="ghar" title={tr("ઘર વેરેન્ટેજ")}
      intro={tr("તમારી જરૂરિયાત પ્રમાણે કેટેગરી ઉમેરો — સમારકામ, વેરો, બાંધકામ વગેરે.")}
      actions={[{ k: "expense", l: tr("ખર્ચ ઉમેરો") }, { k: "asset_buy", l: tr("ઘર / મિલકત ખર્ચ") }, { k: "loan_taken", l: tr("ઘર લોન") }, { k: "loan_repay", l: tr("હપ્તો ચૂકવ્યો") }]} />
  ),
});
