import { createFileRoute } from "@tanstack/react-router";
import { SectionPage } from "@/components/SectionPage";

export const Route = createFileRoute("/_authenticated/dairy")({
  head: () => ({ meta: [{ title: "ભેંસ ડેરી — મારો હિસાબ" }, { name: "description", content: "ભેંસ ખરીદી, ઘાસચારો, દવા, દૂધ વેચાણ અને નફો-નુકસાન." }] }),
  component: () => (
    <SectionPage section="dairy" title="ભેંસ ડેરી વ્યવસાય" showProfit
      intro="ભેંસ, તબેલો અને સાધનો ખરીદી મિલકત તરીકે નોંધાય છે, ખર્ચ તરીકે નહીં."
      actions={[{ k: "income", l: "દૂધ વેચાણ" }, { k: "expense", l: "ઘાસચારો / દવા ખર્ચ" }, { k: "asset_buy", l: "ભેંસ / સાધન ખરીદી" }, { k: "loan_taken", l: "વ્યવસાય લોન" }]} />
  ),
});
