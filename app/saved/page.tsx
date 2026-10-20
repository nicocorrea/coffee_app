import { SavedList } from "@/components/SavedList";

export const metadata = { title: "Saved" };

export default function SavedPage() {
  return (
    <main className="px-5 pt-8">
      <h1 className="condensed text-[2.75rem] leading-none font-bold tracking-tight">Saved coffees</h1>
      <p className="mt-3 text-muted">Recipes stay on this device and open without a connection.</p>
      <div className="mt-8">
        <SavedList variant="list" />
      </div>
    </main>
  );
}
