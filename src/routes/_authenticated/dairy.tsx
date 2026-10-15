import { tr } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { SectionPage } from "@/components/SectionPage";

export const Route = createFileRoute("/_authenticated/dairy")({
  head: () => ({ meta: [{ title: tr("ભેંસ ડેરી — મારો હિસાબ") }, { name: "description", content: tr("ભેંસ ખરીદી, ઘાસચારો, દવા, દૂધ વેચાણ અને નફો-નુકસાન.") }] }),
  component: () => (
    <SectionPage section="dairy" title={tr("ભેંસ ડેરી વ્યવસાય")} showProfit
      intro={tr("ભેંસ, તબેલો અને સાધનો ખરીદી મિલકત તરીકે નોંધાય છે, ખર્ચ તરીકે નહીં.")}
      actions={[{ k: "income", l: tr("દૂધ વેચાણ") }, { k: "expense", l: tr("ઘાસચારો / દવા ખર્ચ") }, { k: "asset_buy", l: tr("ભેંસ / સાધન ખરીદી") }, { k: "loan_taken", l: tr("વ્યવસાય લોન") }]} />
  ),
});
