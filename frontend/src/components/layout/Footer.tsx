import React from "react";

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Histoboard aggregates benchmark results from multiple sources.
          Data is collected from public benchmarks and papers.
        </p>
        <p className="text-sm text-muted-foreground">
          Last updated: December 2024
        </p>
      </div>
    </footer>
  );
}
