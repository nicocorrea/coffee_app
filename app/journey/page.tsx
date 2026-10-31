import { Suspense } from "react";
import { JourneyScreen } from "@/components/journey/JourneyScreen";

export const metadata = { title: "Journey" };

export default function JourneyPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-50 bg-paper" />}>
      <JourneyScreen />
    </Suspense>
  );
}
