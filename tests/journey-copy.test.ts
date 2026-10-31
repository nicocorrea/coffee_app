import { describe, expect, it } from "vitest";
import { buildJourney } from "@/lib/journey/build";
import { COMPARE_COPY, stageCopy } from "@/lib/journey/copy";
import { STAGE_IDS } from "@/lib/journey/types";
import { brew, withFacts } from "./journey-helpers";

const j = buildJourney(brew());

describe("stage copy", () => {
  it("numbers stages without the cover", () => {
    expect(stageCopy(j, "cover").step).toBe("The journey of");
    expect(stageCopy(j, "grown").step).toBe("1 of 9 · Grown");
    expect(stageCopy(j, "cup").step).toBe("9 of 9 · In your cup");
  });
  it("renumbers when shipping is skipped", () =>
    expect(stageCopy(buildJourney(withFacts({ roasterCountry: "Ethiopia" })), "cup").step).toBe("8 of 8 · In your cup"));
  it("grey facts are worded as usual practice", () => expect(stageCopy(j, "picked").text).toMatch(/usually|typically/i));
  it("a natural names its fruit notes", () => expect(stageCopy(j, "processed").text).toMatch(/blueberry/i));
  it("a washed coffee doesn't claim fruit from drying", () =>
    expect(stageCopy(buildJourney(brew({ process: "Washed" })), "processed").text).not.toMatch(/blueberry/i));
  it("machine harvest never mentions hand-picking", () =>
    expect(stageCopy(buildJourney(brew({ origin: "Brazil" })), "picked").text).not.toMatch(/by hand/i));
  it("explains jargon in place", () => {
    expect(stageCopy(j, "milled").text).toMatch(/parchment[^.]*(skin|shell)/i);
    expect(stageCopy(j, "roasted").text).toMatch(/first crack/i);
  });
  it("comparison copy ends the same way", () => {
    for (const t of Object.values(COMPARE_COPY)) expect(t.endsWith("Not this coffee, just to compare.")).toBe(true);
  });
  it("names no producer unless researched", () => expect(stageCopy(j, "grown").text).not.toMatch(/farm of|estate|cooperative/i));

  describe("names a researched producer the way it is involved", () => {
    const grownText = (name: string, kind: "farm" | "washing station" | "cooperative" | "smallholders") =>
      stageCopy(buildJourney(withFacts({ producer: { name, kind, source: "https://example.com/a" } })), "grown").text;
    it("a washing station processed the cherries; it didn't grow them", () => {
      const t = grownText("Daye Bensa", "washing station");
      expect(t).toContain("Its cherries were processed at the Daye Bensa washing station.");
      expect(t).not.toMatch(/grown by/i);
      expect(grownText("Daye Bensa Washing Station", "washing station")).toContain(
        "Its cherries were processed at Daye Bensa Washing Station.",
      );
    });
    it("a farm grows it", () => {
      const t = grownText("Finca La Esperanza", "farm");
      expect(t).toContain("It is grown at Finca La Esperanza.");
      expect(t).not.toMatch(/grown by/i);
    });
    it("a cooperative is where it comes from", () => {
      expect(grownText("Kochere", "cooperative")).toContain("It comes from the Kochere cooperative.");
      expect(grownText("Cooperativa Café Monteverde", "cooperative")).toContain("It comes from Cooperativa Café Monteverde.");
    });
    it("smallholders grow it, written mid-sentence", () =>
      expect(grownText("Smallholder farmers of Hambela Wamena", "smallholders")).toContain(
        "It is grown by smallholder farmers of Hambela Wamena.",
      ));
  });

  describe("alt text matches the drawing", () => {
    it("the cover is a map with a pin", () => {
      expect(stageCopy(j, "cover").alt).toMatch(/map[^.]*pin/i);
      expect(stageCopy(j, "cover").alt).not.toMatch(/bean/i);
      expect(stageCopy(buildJourney(brew({ origin: "Blend", region: "Brazil, Ethiopia" })), "cover").alt).toMatch(
        /world map[^.]*pin/i,
      );
    });
    it("the hand-picking scene shows cherries dropping into a basket, no hand", () => {
      const alt = stageCopy(j, "picked").alt;
      expect(alt).toMatch(/basket/);
      expect(alt).not.toMatch(/\bhand\b/i);
    });
    it("an anaerobic coffee dries as cherries beside a sealed tank", () => {
      const alt = stageCopy(buildJourney(brew({ process: "Anaerobic natural" })), "processed").alt;
      expect(alt).toMatch(/sealed/i);
      expect(alt).toMatch(/cherries/);
      expect(alt).not.toMatch(/beans/);
    });
    it("a washed or honey coffee is milled out of its parchment, a natural out of its husk", () => {
      for (const process of ["Washed", "Red Honey"]) {
        const alt = stageCopy(buildJourney(brew({ process })), "milled").alt;
        expect(alt, process).toMatch(/parchment/);
        expect(alt, process).not.toMatch(/husk/);
      }
      expect(stageCopy(j, "milled").alt).toMatch(/husk/);
    });
    it("the far range follows the altitude", () => {
      const at = (altitude: string | null) => stageCopy(buildJourney(brew({ altitude })), "grown").alt;
      expect(at("1,650 m")).toMatch(/mountains/);
      expect(at("1,650 m")).not.toMatch(/hillside/);
      expect(at("2,100 m")).toMatch(/tall mountains/);
      expect(at("800 m")).toMatch(/hills/);
      expect(at(null)).toMatch(/hillside/);
    });
  });

  describe("milling follows the process", () => {
    const milled = (process: string, confidence: "medium" | "low" = "medium") =>
      stageCopy(buildJourney({ ...brew({ process }), confidence }), "milled").text;
    it("a washed or honey coffee arrives as parchment, with no husk", () => {
      for (const p of ["Washed", "Honey"]) {
        expect(milled(p), p).not.toMatch(/husk/i);
        expect(milled(p), p).toMatch(/parchment[^.]*skin/i);
        expect(milled(p), p).toMatch(/this coffee/);
      }
    });
    it("a natural loses its husk and parchment", () => expect(milled("Natural")).toMatch(/husk[^.]*parchment[^.]*skin/i));
    it("hedges when the process isn't this coffee's own", () => {
      for (const p of ["Washed", "Natural"]) {
        expect(milled(p, "low"), p).not.toMatch(/this coffee/);
        expect(milled(p, "low"), p).toMatch(/^If /);
        expect(milled(p, "low"), p).toMatch(/parchment[^.]*skin/i);
      }
    });
    it("an unknown process names no husk", () => expect(milled("")).not.toMatch(/husk/i));
  });

  it("the cover only mentions sailing when the coffee sails", () => {
    expect(stageCopy(j, "cover").text).toMatch(/sailing/);
    const local = buildJourney(withFacts({ roasterCountry: "Ethiopia" }));
    expect(stageCopy(local, "cover").text).not.toMatch(/sailing/);
    expect(stageCopy(local, "cover").text).toContain("growing, drying and roasting");
  });
  it("explains wet-hulled in place", () => {
    const w = buildJourney(brew({ process: "Wet-hulled", origin: "Indonesia", region: "Sumatra" }));
    expect(stageCopy(w, "milled").text).toMatch(/wet-hulled[^.]*(damp|moist)/i);
  });
  it("hedges wet-hulled at low confidence", () => {
    const w = buildJourney({ ...brew({ process: "Wet-hulled", origin: "Indonesia", region: "Sumatra" }), confidence: "low" });
    const t = stageCopy(w, "milled").text;
    expect(t).toMatch(/usually|typically|often/i);
    expect(t).not.toContain("This coffee is wet-hulled");
    expect(t).toMatch(/wet-hulled[^.]*(damp|moist)/i);
  });
  it("explains parchment wherever it appears, alt text included", () => {
    for (const process of ["Natural", "Washed", "Honey", "Anaerobic", "Wet-hulled", "Experimental"]) {
      const jj = buildJourney(brew({ process, origin: process === "Wet-hulled" ? "Indonesia" : "Ethiopia" }));
      for (const id of jj.stages) {
        const { text, alt } = stageCopy(jj, id);
        for (const sentence of `${text} ${alt}`.split(/(?<=\.)\s/)) {
          if (/parchment/i.test(sentence)) expect(sentence, `${process} ${id}`).toMatch(/skin|shell/i);
        }
      }
    }
  });
  it("uses only <b> markup and fills every stage", () => {
    for (const id of j.stages) {
      const c = stageCopy(j, id);
      expect(c.title && c.text && c.alt).toBeTruthy();
      expect(c.text.replace(/<\/?b>/g, "")).not.toMatch(/[<>]/);
    }
    expect(STAGE_IDS.length).toBe(10);
  });
});
