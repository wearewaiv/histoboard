"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Trophy, Swords, Database, BookOpen, Clock, Info, Star, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "Arena", href: "/arena", icon: Swords },
  { name: "Models", href: "/models", icon: Database },
  { name: "Benchmarks", href: "/benchmarks", icon: BookOpen },
  { name: "Timeline", href: "/timeline", icon: Clock },
  { name: "About", href: "/about", icon: Info },
];

function formatStars(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return count.toString();
}

export function Header() {
  const pathname = usePathname();
  const [starCount, setStarCount] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchStars = async () => {
      const cacheKey = "github-stars-histoboard";
      const cacheExpiry = 1000 * 60 * 60; // 1 hour

      // Check localStorage cache first
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { stars, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < cacheExpiry) {
            setStarCount(stars);
            return;
          }
        } catch {
          // Invalid cache, continue to fetch
        }
      }

      // Fetch from GitHub API
      try {
        const res = await fetch("https://api.github.com/repos/afiliot/histoboard");
        if (res.ok) {
          const data = await res.json();
          const stars = data.stargazers_count;
          setStarCount(stars);
          localStorage.setItem(cacheKey, JSON.stringify({ stars, timestamp: Date.now() }));
        }
      } catch {
        // Silently fail
      }
    };

    fetchStars();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-hematoxylin-200/50 bg-background/90 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="mr-4 md:mr-8">
          <Logo size="sm" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-1 text-sm font-medium transition-colors hover:text-hematoxylin-500",
                  isActive ? "text-hematoxylin-600" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "text-eosin-500")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          {/* GitHub link - hide stars on small screens */}
          <a
            href="https://github.com/afiliot/histoboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-hematoxylin-500 transition-colors"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            {starCount !== null && (
              <span className="hidden sm:flex items-center gap-0.5 text-sm font-medium">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {formatStars(starCount)}
              </span>
            )}
          </a>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-hematoxylin-500 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-hematoxylin-200/50 bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors",
                    isActive
                      ? "bg-hematoxylin-100 text-hematoxylin-600"
                      : "text-muted-foreground hover:bg-hematoxylin-50 hover:text-hematoxylin-500"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive && "text-eosin-500")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
