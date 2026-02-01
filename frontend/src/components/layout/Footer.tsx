import React from "react";

export function Footer() {
  return (
    <footer className="py-6">
      <div className="container mx-auto px-4">
        <div className="rounded-xl border bg-background/80 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Description */}
            <div className="flex flex-col gap-1 text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                Histoboard aggregates benchmark results from multiple sources.
                Data is collected from public benchmarks and papers.
              </p>
              <p className="text-xs text-muted-foreground">
                Last updated: January 2025
              </p>
            </div>

            {/* Right: Contact info */}
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">Developed and maintained by Alexandre Filiot</p>
              <div className="flex items-center gap-2">
                <a
                  href="mailto:afiliot46@gmail.com"
                  className="text-lg hover:scale-110 transition-transform"
                  title="Send email"
                >
                  📧
                </a>
                <a
                  href="https://afiliot.github.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg hover:scale-110 transition-transform"
                  title="Personal website"
                >
                  🌐
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
