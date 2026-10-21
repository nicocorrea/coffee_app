"use client";

import { ViewTransition } from "react";
import { favKey } from "@/lib/favourites";
import type { BrewResult } from "@/lib/schema";

/**
 * A coffee's name. Opening a coffee from a list morphs this name into the recipe heading, so it reads
 * as the same thing moving rather than a new page. Each name may appear only once per screen.
 */
export function BeanName({ result, className = "" }: { result: Pick<BrewResult, "bean">; className?: string }) {
  return (
    <ViewTransition name={`bean-${favKey(result).replace(/[^a-z0-9]+/g, "-")}`} share="morph" default="none">
      <span className={className}>{result.bean.name}</span>
    </ViewTransition>
  );
}
