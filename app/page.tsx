import { RecentList } from "@/components/RecentList";
import { SavedList } from "@/components/SavedList";
import { SearchBox } from "@/components/SearchBox";

export default function Home() {
  return (
    <main className="px-5 pt-8">
      <p className="text-sm font-medium text-cascara">Crema for Meraki Gen 2</p>
      <h1 className="condensed mt-10 text-[3.25rem] leading-[0.95] font-bold tracking-tight">
        What’s in your hopper?
      </h1>
      <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
        Name a coffee by roaster and bag, or by origin and process. Crema finds it and dials in your machine.
      </p>
      <div className="mt-8">
        <SearchBox />
      </div>
      <SavedList variant="strip" />
      <RecentList />
    </main>
  );
}
