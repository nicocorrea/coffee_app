import type { DrinkRecipe } from "@/lib/schema";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="numerals mt-0.5 text-lg">{value}</dd>
    </div>
  );
}

export function DrinkCard({ drink, showHeading = true }: { drink: DrinkRecipe; showHeading?: boolean }) {
  return (
    <div>
      {showHeading && <h3 className="text-2xl font-semibold">{drink.name}</h3>}
      <p className="mt-1 text-muted">{drink.description}</p>

      <p className="numerals mt-5 text-4xl font-semibold">
        {drink.doseG} g <span className="text-muted">→</span> {drink.yieldG} g
        <span className="ml-3 text-xl font-normal text-cascara">{drink.ratio}</span>
      </p>
      {drink.id === "espresso" && (
        <p className="mt-1 text-sm text-muted">per cup, from a double shot split between two cups</p>
      )}

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
        <Fact label="Shot time" value={`${drink.timeMin}–${drink.timeMax} s`} />
        <Fact label="Brew temp" value={`${drink.tempC} °C`} />
        {drink.milk && <Fact label="Steam to" value={`${drink.milk.steamTempC} °C`} />}
        {drink.milk && <Fact label="Pour" value={`${drink.milk.ml} ml milk`} />}
        {drink.water && <Fact label="Hot water" value={`${drink.water.ml} ml`} />}
        {drink.water && <Fact label="Order" value={drink.water.order === "water-first" ? "Water first" : "Shot first"} />}
      </dl>

      <dl className="mt-5 space-y-3 border-t border-line pt-5 text-[0.95rem] leading-relaxed">
        <div>
          <dt className="inline font-medium">Grind: </dt>
          <dd className="inline text-muted">{drink.grind}</dd>
        </div>
        {drink.milk && (
          <div>
            <dt className="inline font-medium">Milk: </dt>
            <dd className="inline text-muted">
              {drink.milk.texture}. Steam {drink.milk.steamMl} ml in the Meraki jug so the probe reads accurately, then
              pour {drink.milk.ml} ml.
            </dd>
          </div>
        )}
        <div>
          <dt className="inline font-medium">Cup: </dt>
          <dd className="inline text-muted">{drink.cup}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Method: </dt>
          <dd className="inline text-muted">{drink.method}</dd>
        </div>
      </dl>

      {drink.note && (
        <p className="mt-5 rounded-xl border-l-2 border-cascara bg-surface-2 px-4 py-3 leading-relaxed">{drink.note}</p>
      )}
    </div>
  );
}
