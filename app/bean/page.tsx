import { Suspense } from "react";
import { BeanScreen } from "@/components/BeanScreen";

export const metadata = { title: "Recipe" };

export default function BeanPage() {
  return (
    <main className="px-5">
      <Suspense fallback={<div className="min-h-[70dvh]" />}>
        <BeanScreen />
      </Suspense>
    </main>
  );
}
