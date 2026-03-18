/**
 * Site Footer
 *
 * Footer with project links (GitHub, documentation, license) and a build-time
 * "last updated" timestamp. Rendered at the bottom of every page.
 *
 * Used by: app/layout.tsx
 */

// Build-time date for "Last updated" footer text
const BUILD_DATE = new Date().toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
});

const BASE_PATH = process.env.NODE_ENV === "production" ? "/histoboard" : "";

export function Footer() {
  return (
    <footer className="py-6">
      <div className="container mx-auto px-4">
        <div className="rounded-xl border bg-background/80 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Description */}
            <div className="flex flex-col gap-1 text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                Histoboard aggregates results from official benchmarks and papers (see benchmark cards for exact data sources). If you believe any data is incorrect or missing, please open an issue on our GitHub repository.
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 justify-center md:justify-start">
                Initiative sponsored by{" "}
                <a href="https://www.wearewaiv.com" target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${BASE_PATH}/waiv_logo.png`}
                    alt="Waiv"
                    className="inline-block h-5 w-auto relative -top-px"
                  />
                </a> with participation of the Jaume Lab
                <a href="https://guillaumejaume.github.io/" target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${BASE_PATH}/jaumelab_logo.png`}
                    alt="Jaume Lab"
                    className="inline-block h-8 w-auto relative -top-px"
                  />
                </a> 
              </p>
              <p className="text-xs text-muted-foreground">
                Last updated: {BUILD_DATE}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
