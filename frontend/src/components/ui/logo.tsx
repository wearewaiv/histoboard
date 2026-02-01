import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(sizeClasses[size])}
      >
        {/* Background rounded rectangle (tissue cassette) */}
        <rect
          x="2"
          y="2"
          width="36"
          height="28"
          rx="4"
          fill="url(#tissueGradient)"
          stroke="url(#borderGradient)"
          strokeWidth="1.5"
        />

        {/* Stylized tissue pattern - cells */}
        <circle cx="10" cy="10" r="3" fill="hsl(280 55% 45%)" opacity="0.8" />
        <circle cx="20" cy="8" r="2.5" fill="hsl(350 60% 55%)" opacity="0.7" />
        <circle cx="30" cy="11" r="3" fill="hsl(280 55% 45%)" opacity="0.6" />
        <circle cx="8" cy="18" r="2" fill="hsl(350 60% 55%)" opacity="0.6" />
        <circle cx="16" cy="16" r="2.5" fill="hsl(280 50% 50%)" opacity="0.7" />
        <circle cx="24" cy="19" r="2" fill="hsl(350 55% 60%)" opacity="0.8" />
        <circle cx="32" cy="20" r="2.5" fill="hsl(280 55% 45%)" opacity="0.7" />
        <circle cx="12" cy="24" r="2" fill="hsl(280 55% 45%)" opacity="0.5" />
        <circle cx="20" cy="25" r="2.5" fill="hsl(350 60% 55%)" opacity="0.6" />
        <circle cx="28" cy="24" r="2" fill="hsl(280 50% 50%)" opacity="0.7" />

        {/* Bar chart at bottom */}
        <rect x="8" y="36" width="4" height="2" rx="0.5" fill="hsl(280 55% 45%)" />
        <rect x="14" y="34" width="4" height="4" rx="0.5" fill="hsl(280 55% 50%)" />
        <rect x="20" y="32" width="4" height="6" rx="0.5" fill="hsl(320 55% 50%)" />
        <rect x="26" y="33" width="4" height="5" rx="0.5" fill="hsl(350 60% 55%)" />

        {/* Gradients - light theme */}
        <defs>
          <linearGradient id="tissueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(350 70% 97%)" />
            <stop offset="100%" stopColor="hsl(280 50% 96%)" />
          </linearGradient>
          <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(280 55% 45%)" />
            <stop offset="100%" stopColor="hsl(350 60% 55%)" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className={cn("font-bold bg-gradient-to-r from-hematoxylin-600 to-eosin-500 bg-clip-text text-transparent", textSizeClasses[size])}>
          Histoboard
        </span>
      )}
    </div>
  );
}

// Icon-only version for favicons, etc.
export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="2"
        y="2"
        width="36"
        height="28"
        rx="4"
        fill="url(#tissueGradientIcon)"
        stroke="url(#borderGradientIcon)"
        strokeWidth="1.5"
      />

      <circle cx="10" cy="10" r="3" fill="hsl(280 55% 45%)" opacity="0.8" />
      <circle cx="20" cy="8" r="2.5" fill="hsl(350 60% 55%)" opacity="0.7" />
      <circle cx="30" cy="11" r="3" fill="hsl(280 55% 45%)" opacity="0.6" />
      <circle cx="8" cy="18" r="2" fill="hsl(350 60% 55%)" opacity="0.6" />
      <circle cx="16" cy="16" r="2.5" fill="hsl(280 50% 50%)" opacity="0.7" />
      <circle cx="24" cy="19" r="2" fill="hsl(350 55% 60%)" opacity="0.8" />
      <circle cx="32" cy="20" r="2.5" fill="hsl(280 55% 45%)" opacity="0.7" />
      <circle cx="12" cy="24" r="2" fill="hsl(280 55% 45%)" opacity="0.5" />
      <circle cx="20" cy="25" r="2.5" fill="hsl(350 60% 55%)" opacity="0.6" />
      <circle cx="28" cy="24" r="2" fill="hsl(280 50% 50%)" opacity="0.7" />

      <rect x="8" y="36" width="4" height="2" rx="0.5" fill="hsl(280 55% 45%)" />
      <rect x="14" y="34" width="4" height="4" rx="0.5" fill="hsl(280 55% 50%)" />
      <rect x="20" y="32" width="4" height="6" rx="0.5" fill="hsl(320 55% 50%)" />
      <rect x="26" y="33" width="4" height="5" rx="0.5" fill="hsl(350 60% 55%)" />

      <defs>
        <linearGradient id="tissueGradientIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(350 70% 97%)" />
          <stop offset="100%" stopColor="hsl(280 50% 96%)" />
        </linearGradient>
        <linearGradient id="borderGradientIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(280 55% 45%)" />
          <stop offset="100%" stopColor="hsl(350 60% 55%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
