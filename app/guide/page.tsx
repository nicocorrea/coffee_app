import { DrinkCard } from "@/components/DrinkCard";
import { FlavourReference } from "@/components/FlavourExplainer";
import { CLASSIC_BASE, deriveDrinks } from "@/lib/drinks";

export const metadata = { title: "Guide" };

const drinks = deriveDrinks(CLASSIC_BASE, "medium");

const RULES = [
  ["Change one thing at a time", "Grind first, then yield, then temperature. Taste every change before making the next."],
  ["Sour, thin or fast", "Go 1 step finer, or raise the temperature 1 °C. Under-extracted shots taste sharp and salty."],
  ["Bitter, dry or slow", "Go 1 step coarser, or drop the temperature 1 °C. Over-extracted shots taste harsh and hollow."],
  ["Temperature by roast", "Light roasts like 93–96 °C, medium 91–94 °C, dark 88–91 °C. The Meraki holds it steady with PID."],
  ["Ratio sets the style", "1:1.5 is dense and syrupy, 1:2 is classic, 1:2.5 and longer gives clarity and lighter body."],
  ["Pre-infusion", "The Meraki pre-infuses at 3 or 4 bar for 5–15 s, or you can switch it off. A gentle 5–10 s at 3 bar evens out the puck. Use the longer end for light roasts and naturals."],
  ["Milk on the Meraki", "Steam at least 180 ml so the probe reads accurately. 55–60 °C is the sweet spot; above 65 °C sweetness drops."],
];

export default function GuidePage() {
  return (
    // Desktop: the ratio table and the dial-in rules sit side by side, the rest spans both columns.
    <main className="px-5 pt-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-16 lg:px-12 lg:pt-16">
      <div className="lg:col-span-2">
        <h1 className="condensed text-[2.75rem] leading-none font-bold tracking-tight lg:text-[4rem]">Every drink, by ratio</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted lg:text-lg">
          The classic reference: 18 g in, 36 g out at 93 °C in 25–30 s. Look up a coffee to get these tuned to the bean.
        </p>
      </div>

      <table className="mt-8 w-full text-left lg:mt-10">
        <thead className="text-sm text-muted">
          <tr className="border-b border-line">
            <th scope="col" className="py-2 font-normal">Drink</th>
            <th scope="col" className="py-2 font-normal">Ratio</th>
            <th scope="col" className="py-2 text-right font-normal">Out</th>
            <th scope="col" className="py-2 text-right font-normal">Milk</th>
          </tr>
        </thead>
        <tbody className="numerals">
          {drinks.map((d) => (
            <tr key={d.id} className="border-b border-line/60">
              <th scope="row" className="py-3 font-medium" style={{ fontVariationSettings: "normal", letterSpacing: "normal" }}>
                {d.name}
              </th>
              <td className="py-3 text-cascara">{d.ratio}</td>
              <td className="py-3 text-right">{d.yieldG} g</td>
              <td className="py-3 text-right text-muted">{d.milk ? `${d.milk.ml} ml` : d.water ? `${d.water.ml} ml water` : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section aria-labelledby="recipes" className="mt-14 lg:col-span-2 lg:mt-20">
        <h2 id="recipes" className="text-2xl font-semibold tracking-tight">
          Full recipes
        </h2>
        <div className="mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-3 lg:space-y-0">
          {drinks.map((d) => (
            <details key={d.id} className="group rounded-2xl bg-surface open:pb-5">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-5 text-lg font-medium [&::-webkit-details-marker]:hidden">
                {d.name}
                <svg viewBox="0 0 24 24" className="size-5 text-muted transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="px-5">
                <DrinkCard drink={d} showHeading={false} />
              </div>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="flavour" className="mt-14 lg:col-span-2 lg:mt-20">
        <h2 id="flavour" className="text-2xl font-semibold tracking-tight">
          Reading the flavour chart
        </h2>
        <p className="mt-2 leading-relaxed text-muted">
          Every coffee is scored from 1 to 5 on five qualities. Here’s what each one means, with foods to compare.
        </p>
        <div className="mt-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-16">
          <FlavourReference />
        </div>
      </section>

      <section aria-labelledby="rules" className="mt-14 lg:col-start-2 lg:row-start-2 lg:mt-10">
        <h2 id="rules" className="text-2xl font-semibold tracking-tight">
          Dialling in on the Meraki
        </h2>
        <dl className="mt-5 divide-y divide-line border-y border-line">
          {RULES.map(([title, body]) => (
            <div key={title} className="py-4">
              <dt className="font-medium">{title}</dt>
              <dd className="mt-1 leading-relaxed text-muted">{body}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
