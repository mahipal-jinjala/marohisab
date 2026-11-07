// Centralized translation: Gujarati is the source text; EN maps it to English.
// `tr()` reads the current language from a tiny global store. The app root
// re-mounts its subtree (key={lang}) on change so every screen re-renders.
import { useSyncExternalStore } from "react";

export type Lang = "gu" | "en";
const KEY = "maro-hisab-lang";
let lang: Lang = "gu";
const subs = new Set<() => void>();

export function getLang() { return lang; }
export function setLang(l: Lang) {
  lang = l;
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  if (typeof document !== "undefined") document.documentElement.lang = l;
  subs.forEach((f) => f());
}
/** Call from useEffect once on the client. */
export function initLang() {
  try { const s = localStorage.getItem(KEY); if (s === "en" || s === "gu") { if (s !== lang) setLang(s); else document.documentElement.lang = s; } } catch { /* ignore */ }
}
export function useLang() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => lang, () => "gu" as Lang);
}
export const dateLocale = () => (lang === "en" ? "en-IN" : "gu-IN");

/** Translate application errors without exposing raw service messages. */
export function translatedError(error: unknown): string {
  const message = typeof error === "string" ? error :
    error && typeof error === "object" && "message" in error ? String(error.message) : "";
  if (EN[message] !== undefined) return tr(message);
  if (/duplicate key|unique/i.test(message)) return tr("આ નામનું ખાતું પહેલેથી છે");
  if (/Failed to fetch|NetworkError|network|fetch failed/i.test(message)) return tr("નેટવર્ક ભૂલ, ફરી પ્રયાસ કરો");
  if (/Invalid login/i.test(message)) return tr("ઇમેઇલ અથવા પાસવર્ડ ખોટો છે");
  if (/Email not confirmed/i.test(message)) return tr("પ્રવેશ પહેલાં તમારું ઇમેઇલ પુષ્ટિ કરો.");
  if (/rate limit|too many requests|security purposes/i.test(message)) return tr("ઘણા પ્રયાસ થયા છે. થોડી વાર પછી ફરી પ્રયાસ કરો.");
  if (/session missing|jwt expired|not authenticated/i.test(message)) return tr("ફરી પ્રવેશ કરો અને પ્રયાસ કરો.");
  return tr("ભૂલ આવી");
}

export function tr(s: string | null | undefined): string {
  if (s == null) return "";
  if (lang === "gu") return s;
  const hit = EN[s] ?? EN[s.trim()];
  if (hit !== undefined) return s.startsWith(" ") && !hit.startsWith(" ") ? " " + hit : hit;
  if (s.startsWith("રદ: ")) return "Reversed: " + tr(s.slice(4));
  return s;
}

export const EN: Record<string, string> = {
  "+ નવી લોન": "+ New loan", "+ નવું લેણું": "+ New receivable", "+ નવું રોકાણ ખાતું": "+ New investment account", "+ નવી મિલકત": "+ New asset",
  "+ નવી કેટેગરી": "+ New category", "+ નવું ખાતું": "+ New account", "ઉધાર આપ્યું": "Lent money", "માન્ય વ્યાજ દર દાખલ કરો": "Enter a valid interest rate",
  "આ નામનું ખાતું પહેલેથી છે — તે પસંદ કર્યું": "An account with this name already exists — selected it",
  "મારો હિસાબ": "My Accounts",
  "મારો હિસાબ — ગુજરાતી હિસાબ એપ": "My Accounts — Gujarati accounting app",
  "મારો હિસાબ રિપોર્ટ": "My Accounts report",
  "મારો હિસાબમાં લૉગિન કરો અથવા નવું ખાતું બનાવો.": "Sign in to My Accounts or create a new account.",
  "ગુજરાતી વ્યક્તિગત અને વ્યવસાયિક હિસાબ એપ": "Personal and business accounting app",
  "ગુજરાતી હિસાબ એપમાં લૉગિન કરો.": "Sign in to the accounting app.",
  "વ્યક્તિગત, ઘરખર્ચ, લોન, રોકાણ અને ભેંસ ડેરીનો સંપૂર્ણ હિસાબ — ગુજરાતીમાં.": "Complete accounts for personal, household, loans, investments and buffalo dairy.",
  "ડબલ-એન્ટ્રી હિસાબ, રિપોર્ટ અને નેટ વર્થ — ગુજરાતીમાં.": "Double-entry accounts, reports and net worth.",
  "આવક, ખર્ચ, લોન, ઉધાર, રોકાણ, ઘર અને ભેંસ ડેરી — બધો હિસાબ એક જગ્યાએ, સાચી ડબલ-એન્ટ્રી સાથે.": "Income, expenses, loans, lending, investments, home and buffalo dairy — all your accounts in one place, with true double-entry.",
  "શરૂ કરો": "Get started",
  // nav
  "ડેશબોર્ડ": "Dashboard", "વ્યવહારો": "Transactions", "ખાતાં": "Accounts", "લોન / ઉધાર": "Loans / Lending",
  "રોકાણ": "Investments", "ઘરખર્ચ": "Household", "ઘર વેરેન્ટેજ": "Home (Ghar Verentej)", "ભેંસ ડેરી": "Buffalo Dairy",
  "રિપોર્ટ": "Reports", "બહાર નીકળો": "Sign out", "સાઇડબાર": "Sidebar", "નવો વ્યવહાર": "New transaction", "+ નવો વ્યવહાર": "+ New transaction",
  "ડેશબોર્ડ — મારો હિસાબ": "Dashboard — My Accounts", "વ્યવહારો — મારો હિસાબ": "Transactions — My Accounts",
  "ખાતાં — મારો હિસાબ": "Accounts — My Accounts", "લોન અને ઉધાર — મારો હિસાબ": "Loans & Lending — My Accounts",
  "રોકાણ અને મિલકત — મારો હિસાબ": "Investments & Assets — My Accounts", "ઘરખર્ચ — મારો હિસાબ": "Household — My Accounts",
  "ઘર વેરેન્ટેજ — મારો હિસાબ": "Home — My Accounts", "ભેંસ ડેરી — મારો હિસાબ": "Buffalo Dairy — My Accounts",
  "રિપોર્ટ — મારો હિસાબ": "Reports — My Accounts", "પ્રવેશ — મારો હિસાબ": "Sign in — My Accounts", "નવો પાસવર્ડ — મારો હિસાબ": "New password — My Accounts",
  "તમારો નાણાકીય સારાંશ.": "Your financial summary.", "બધા વ્યવહારો શોધો અને ફિલ્ટર કરો.": "Search and filter all transactions.",
  "ખાતાવહી અને ખાતાંઓની યાદી.": "Ledger and list of accounts.", "લીધેલી લોન, આપેલ ઉધાર, ચૂકવણી અને વ્યાજ.": "Loans taken, money lent, repayments and interest.",
  "FD, RD, શેર, મ્યુચ્યુઅલ ફંડ, સોનું અને વ્યવસાયિક રોકાણ.": "FD, RD, shares, mutual funds, gold and business investments.",
  "કરિયાણું, બિલ, શિક્ષણ અને ઘરના રોજિંદા ખર્ચ.": "Groceries, bills, education and daily household expenses.",
  "ઘર સંબંધિત ખર્ચ, વેરો અને સમારકામનો અલગ હિસાબ.": "Separate accounts for home expenses, tax and repairs.",
  "ભેંસ ખરીદી, ઘાસચારો, દવા, દૂધ વેચાણ અને નફો-નુકસાન.": "Buffalo purchases, fodder, medicine, milk sales and profit/loss.",
  "દૈનિક, માસિક, વાર્ષિક રિપોર્ટ, બેલેન્સ શીટ અને નેટ વર્થ.": "Daily, monthly, yearly reports, balance sheet and net worth.",
  "નવો પાસવર્ડ સેટ કરો.": "Set a new password.",
  // auth
  "તમારા ખાતામાં પ્રવેશ કરો": "Sign in to your account", "નવું ખાતું બનાવો": "Create a new account", "પાસવર્ડ ભૂલી ગયા?": "Forgot password?",
  "ઇમેઇલ": "Email", "પાસવર્ડ": "Password", "પ્રવેશ": "Sign in", "ખાતું બનાવો": "Create account", "લિંક મોકલો": "Send link",
  "રાહ જુઓ…": "Please wait…", "પ્રવેશ પર પાછા": "Back to sign in", "માન્ય ઇમેઇલ દાખલ કરો": "Enter a valid email",
  "પાસવર્ડ ઓછામાં ઓછો 6 અક્ષરનો હોવો જોઈએ": "Password must be at least 6 characters",
  "ઇમેઇલ તપાસો અને ખાતું પુષ્ટિ કરો.": "Check your email and confirm your account.",
  "પાસવર્ડ રીસેટ લિંક ઇમેઇલ પર મોકલી છે.": "A password reset link has been sent to your email.",
  "ઇમેઇલ અથવા પાસવર્ડ ખોટો છે": "Email or password is incorrect", "નવો પાસવર્ડ": "New password", "ઓછામાં ઓછા 6 અક્ષર": "At least 6 characters",
  // common
  "સાચવો": "Save", "સાચવી રહ્યા છીએ…": "Saving…", "લોડ થઈ રહ્યું છે…": "Loading…", "ડેટા લોડ ન થયો:": "Could not load data:",
  "આજે": "Today", "આ મહિને": "This month", "આ વર્ષે": "This year", "બધું": "All", "થી": "From", "સુધી": "To",
  "શોધો…": "Search…", "બધા પ્રકાર": "All types", "બધા વિભાગ": "All sections", "આ ફિલ્ટરમાં કોઈ વ્યવહાર નથી": "No transactions match this filter",
  "હજી કોઈ વ્યવહાર નથી": "No transactions yet", "કોઈ ખાતું નથી": "No accounts", "આ સમયગાળામાં ડેટા નથી": "No data for this period",
  "સુધારો": "Edit", "રદ કરો": "Reverse", "આર્કાઇવ": "Archive", "ના": "No", "હા, રદ કરો": "Yes, reverse",
  "વ્યવહાર રદ કરવો છે?": "Reverse this transaction?",
  "ખાતાવહીમાં ઉલટી એન્ટ્રી ઉમેરાશે. મૂળ રેકોર્ડ ઓડિટ માટે રહેશે.": "An opposite entry will be added to the ledger. The original record stays for audit.",
  "વ્યવહાર રદ થયો": "Transaction reversed", "વ્યવહાર સાચવ્યો": "Transaction saved", "વ્યવહાર સુધાર્યો": "Transaction updated",
  "વ્યવહાર સુધારો": "Edit transaction", " · રદ થયેલ": " · reversed", " · રદ એન્ટ્રી": " · reversal entry", "રદ": "Reversed", "રદ એન્ટ્રી": "Reversal entry", "સક્રિય": "Active",
  "ભૂલ આવી": "Something went wrong", "નેટવર્ક ભૂલ, ફરી પ્રયાસ કરો": "Network error, please try again", "આ નામનું ખાતું પહેલેથી છે": "An account with this name already exists",
  "છુપાવવું છે?": "hide this account?", "ખાતું છુપાવ્યું": "Account hidden", "ખાતું બન્યું": "Account created", "નામ દાખલ કરો": "Enter a name",
  // form
  "પ્રકાર": "Type", "વિભાગ": "Section", "રકમ (₹)": "Amount (₹)", "રકમ": "Amount", "તારીખ": "Date", "ખાતું": "Account",
  "વ્યક્તિ / પક્ષ": "Person / party", "પક્ષ": "Party", "નોંધ": "Note", "નામ": "Name", "વ્યક્તિ / બેંક": "Person / bank", "વ્યાજ દર (%)": "Interest rate (%)", "વ્યાજ": "interest",
  "— પહેલા ખાતું બનાવો —": "— Create an account first —", "માન્ય રકમ દાખલ કરો": "Enter a valid amount", "કુલ ચુકવણી": "Total payment", "વ્યાજ ઋણ ન હોઈ શકે": "Interest cannot be negative",
  "બંને ખાતા પસંદ કરો": "Select both accounts", "બંને ખાતા અલગ હોવા જોઈએ": "The two accounts must be different", "વ્યાજ ખાતું પસંદ કરો": "Select an interest account",
  "રકમ શૂન્યથી વધુ હોવી જોઈએ": "Amount must be greater than zero", "અમાન્ય તારીખ": "Invalid date", "અમાન્ય વ્યવહાર પ્રકાર": "Invalid transaction type",
  "ખાતું મળ્યું નહીં": "Account not found", "આ વ્યવહાર માટે ખાતાનો પ્રકાર યોગ્ય નથી": "Account type is not valid for this transaction",
  "વ્યાજ આ વ્યવહારમાં માન્ય નથી": "Interest is not allowed for this transaction", "વ્યાજ ખર્ચ ખાતું પસંદ કરો": "Select an interest expense account",
  "આવક ખાતું પસંદ કરો": "Select an income account", "વ્યવહાર મળ્યો નહીં": "Transaction not found", "આ વ્યવહાર પહેલેથી રદ થયેલ છે": "This transaction is already reversed",
  "ઉપયોગમાં લેવાયેલ ખાતાનો પ્રકાર બદલી શકાય નહીં": "The type of an account in use cannot be changed",
  // kinds & labels
  "આવક": "Income", "ખર્ચ": "Expense", "ટ્રાન્સફર": "Transfer", "લોન / ઉધાર લીધા": "Loan / borrowed", "લોન ચૂકવણી": "Loan repayment",
  "ઉધાર આપ્યા": "Money lent", "ઉધાર પાછા મળ્યા": "Lent money received back", "રોકાણ ઉપાડ": "Investment withdrawal", "મિલકત ખરીદી": "Asset purchase",
  "મિલકત વેચાણ (મૂળ કિંમતે)": "Asset sale (at cost)", "શરૂઆતનું બેલેન્સ (મિલકત)": "Opening balance (asset)", "શરૂઆતનું દેવું": "Opening debt",
  "ક્યાં જમા થયા": "Received into", "આવકનો પ્રકાર": "Income type", "ખર્ચનો પ્રકાર": "Expense type", "ક્યાંથી ચૂકવ્યા": "Paid from",
  "ક્યાં": "To", "ક્યાંથી": "From", "લોન ખાતું": "Loan account", "વ્યાજ ચૂકવ્યું": "Interest paid", "કોને (લેણું ખાતું)": "To whom (receivable account)",
  "ક્યાંથી આપ્યા": "Paid from", "લેણું ખાતું": "Receivable account", "વ્યાજ મળ્યું": "Interest received", "રોકાણ ખાતું": "Investment account",
  "નફો / વ્યાજ": "Profit / interest", "મિલકત": "Assets", "મૂડી": "Capital", "દેવું ખાતું": "Debt account",
  "રોકડ": "Cash", "બેંક": "Bank", "લેણું (ઉધાર આપેલ)": "Receivable (lent)", "લોન (લીધેલ)": "Loan (taken)", "અન્ય દેવું": "Other liability",
  "વ્યક્તિગત": "Personal", "વ્યવસાય": "Business",
  // dashboard
  "+ આવક": "+ Income", "− ખર્ચ": "− Expense", "લોન લીધી": "Loan taken", "લોન ચૂકવી": "Loan repaid",
  "ઉપલબ્ધ નાણાં (રોકડ + બેંક + UPI)": "Available money (cash + bank + UPI)", "ખર્ચ પછીની કમાણી": "Earnings after expenses",
  "બાકી વ્યક્તિગત લોન": "Outstanding personal loans", "લોન બાદ કર્યા પછીની કમાણી": "Earnings after deducting loans",
  "લેણું": "Receivables", "લેણું (ઉધાર આપેલ) ": "Receivables", "કુલ દેવું": "Total liabilities", "નેટ વર્થ": "Net worth",
  "ભેંસ ડેરી નફો / નુકસાન": "Buffalo dairy profit / loss", "ઘર વેરેન્ટેજ ખર્ચ": "Home expenses", "ઝડપી ઉમેરો": "Quick add", "તાજેતરના વ્યવહારો": "Recent transactions",
  // money-out (પૈસા ક્યાં ગયા)
  "પૈસા ક્યાં ગયા": "Where money went", "પૈસા ક્યાં ગયા — મારો હિસાબ": "Where money went — My Accounts",
  "કઈ કેટેગરીમાં કેટલા પૈસા વપરાયા — સરળ દેખાવ.": "How much was spent in each category — a simple view.",
  "કુલ આવક": "Total income", "કુલ ખર્ચ": "Total expense", "બચત / કમાણી": "Savings / earnings",
  "કઈ કેટેગરીમાં કેટલા વપરાયા": "Spending by category", "આ સમયગાળામાં કોઈ ખર્ચ નથી": "No expenses in this period",
  "હવે પાસે કેટલા પૈસા છે": "Money you have now", "વિગત જુઓ →": "See details →",
  "ટ્રાન્સફર, લોન ચૂકવણી અને રોકાણ ખર્ચમાં ગણાતા નથી — અહીં ફક્ત સાચો ખર્ચ બતાવ્યો છે.": "Transfers, loan repayments and investments are not counted as expenses — only true spending is shown here.",
  // accounts page
  "મિલકત (Assets)": "Assets", "દેવું (Liabilities)": "Liabilities", "આવક — આ મહિને": "Income — this month", "ખર્ચ — આ મહિને": "Expenses — this month",
  "ખાતાં (ચાર્ટ ઓફ એકાઉન્ટ્સ)": "Accounts (chart of accounts)", "શરૂઆતનું બેલેન્સ": "Opening balance", "નવું ખાતું / કેટેગરી": "New account / category", "નવું ખાતું": "New account",
  // loans
  "લોન અને ઉધાર": "Loans & Lending", "નવી લોન": "New loan", "નવું લેણું": "New receivable", "બાકી લોન (કુલ)": "Outstanding loans (total)",
  "લેવાના બાકી (ઉધાર આપેલ)": "To receive (money lent)", "લોન ચૂકવી + વ્યાજ": "Loan repaid + interest", "લીધેલી લોન": "Loans taken",
  "આપેલ ઉધાર (લેણું)": "Money lent (receivable)", "લોન વ્યવહારો": "Loan transactions",
  // investments
  "રોકાણ અને મિલકત": "Investments & Assets", "નવું રોકાણ / મિલકત": "New investment / asset", "કુલ નાણાકીય રોકાણ": "Total financial investments",
  "કુલ સ્થાવર / વ્યવસાયિક મિલકત": "Total fixed / business assets", "રોકાણ કર્યું": "Invested", "રોકાણ ઉપાડ્યું": "Withdrew investment",
  "મિલકત વેચી": "Sold asset", "નાણાકીય રોકાણ": "Financial investments", "મિલકત (વ્યવસાયિક સહિત)": "Assets (incl. business)", "રોકાણ વ્યવહારો": "Investment transactions",
  // sections
  "નવી કેટેગરી / ખાતું": "New category / account", "નફો / નુકસાન": "Profit / loss", "મિલકત (આ વિભાગ)": "Assets (this section)",
  "આવક / ખર્ચ કેટેગરી (સમયગાળો)": "Income / expense categories (period)", "મિલકત અને દેવું": "Assets & liabilities",
  "ભેંસ ડેરી વ્યવસાય": "Buffalo dairy business", "ભેંસ, તબેલો અને સાધનો ખરીદી મિલકત તરીકે નોંધાય છે, ખર્ચ તરીકે નહીં.": "Buffaloes, shed and equipment purchases are recorded as assets, not expenses.",
  "દૂધ વેચાણ": "Milk sales", "ઘાસચારો / દવા ખર્ચ": "Fodder / medicine expense", "ભેંસ / સાધન ખરીદી": "Buffalo / equipment purchase", "વ્યવસાય લોન": "Business loan",
  "તમારી જરૂરિયાત પ્રમાણે કેટેગરી ઉમેરો — સમારકામ, વેરો, બાંધકામ વગેરે.": "Add categories as you need — repairs, tax, construction, etc.",
  "ખર્ચ ઉમેરો": "Add expense", "આવક ઉમેરો": "Add income", "ઘર / મિલકત ખર્ચ": "Home / property spend", "ઘર લોન": "Home loan", "હપ્તો ચૂકવ્યો": "Paid instalment",
  // reports
  "ચોખ્ખી કમાણી": "Net earnings", "બેલેન્સ શીટ": "Balance sheet", "કુલ મિલકત": "Total assets", "કુલ દેવું (લોન સહિત)": "Total liabilities (incl. loans)",
  "વિભાગ મુજબ નફો / ખર્ચ": "Profit / expense by section", "આવક વિ. ખર્ચ": "Income vs expenses", "દૈનિક": "Daily", "માસિક": "Monthly", "વાર્ષિક": "Yearly",
  "સમયગાળો": "Period", "ચોખ્ખું": "Net", "ખાતા મુજબ (જનરલ લેજર સારાંશ)": "By account (general ledger summary)", "બેલેન્સ": "Balance",
  "સારાંશ": "Summary", "બાકી લોન": "Outstanding loans", "લોન બાદ કમાણી": "Earnings after loans", "નફો/નુકસાન": "Profit/loss",
  "સમયગાળાનો ફેરફાર": "Period change", "અંતિમ બેલેન્સ": "Closing balance", "ઉધાર (Dr)": "Debit (Dr)", "જમા (Cr)": "Credit (Cr)", "સ્થિતિ": "Status",
  // default account names
  "બેંક ખાતું": "Bank account", "UPI વોલેટ": "UPI wallet", "શરૂઆતની મૂડી": "Opening capital", "પગાર": "Salary", "અન્ય આવક": "Other income",
  "વ્યાજ આવક": "Interest income", "રોકાણ નફો": "Investment gain", "વ્યાજ ખર્ચ": "Interest expense", "અન્ય ખર્ચ": "Other expense",
  "કરિયાણું": "Groceries", "વીજળી બિલ": "Electricity bill", "શિક્ષણ": "Education", "દવા": "Medicine", "ઘર સમારકામ": "Home repairs", "ઘર વેરો": "Property tax",
  "ભેંસ વેચાણ": "Buffalo sales", "ઘાસચારો / દાણ": "Fodder / feed", "પશુ દવા / ડૉક્ટર": "Veterinary / medicine", "મજૂરી": "Labour",
  "ભેંસો": "Buffaloes", "તબેલો (શેડ)": "Shed", "સાધનો": "Equipment", "શેર": "Shares", "મ્યુચ્યુઅલ ફંડ": "Mutual funds", "સોનું": "Gold",
  // language switch
  "ભાષા": "Language",
  "બંધ કરો": "Close",
  "પાનું મળ્યું નહીં": "Page not found",
  "આ પાનું ઉપલબ્ધ નથી અથવા તેનું સરનામું બદલાયું છે.": "This page is unavailable or its address has changed.",
  "મુખ્ય પાને જાઓ": "Go home",
  "આ પાનું લોડ થયું નહીં": "This page didn't load",
  "ફરી પ્રયાસ કરો અથવા મુખ્ય પાને પાછા જાઓ.": "Try again or return to the home page.",
  "ફરી પ્રયાસ કરો": "Try again",
  "પ્રવેશ પહેલાં તમારું ઇમેઇલ પુષ્ટિ કરો.": "Confirm your email before signing in.",
  "ઘણા પ્રયાસ થયા છે. થોડી વાર પછી ફરી પ્રયાસ કરો.": "Too many attempts. Please try again shortly.",
  "ફરી પ્રવેશ કરો અને પ્રયાસ કરો.": "Sign in again and retry.",
};
