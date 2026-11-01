import { FilmSection } from "@/components/FilmSection";
import { RecentList } from "@/components/RecentList";
import { SavedList } from "@/components/SavedList";
import { SearchBox } from "@/components/SearchBox";

export default function Home() {
  return (
    <main className="px-5 pt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-16 lg:px-12 lg:pt-24 xl:gap-24">
      <div>
        <p className="text-sm font-medium text-cascara lg:hidden">Crema for Meraki Gen 2</p>
        <h1 className="condensed mt-10 text-[3.25rem] leading-[0.95] font-bold tracking-tight lg:mt-0 lg:text-[6rem] lg:leading-[0.9]">
          What’s in your hopper?
        </h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-muted lg:mt-8 lg:text-xl">
          Name a coffee by roaster and bag, or by origin and process. Crema finds it and dials in your machine.
        </p>
        <div className="mt-8 lg:mt-10 lg:max-w-2xl">
          <SearchBox />
        </div>
      </div>
      {/* After the search on phones; a full-width band under both columns on desktop. */}
      <FilmSection />
      <div className="lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-12 lg:pt-3">
        <SavedList variant="strip" />
        <RecentList />
      </div>
    </main>
  );
}
