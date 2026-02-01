"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface MultiSelectDropdownProps {
  label: string
  options: { id: string; label: string; color?: string }[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onSelectAll: () => void
  onClearAll: () => void
  className?: string
  size?: "default" | "sm"
}

export function MultiSelectDropdown({
  label,
  options,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
  className,
  size = "default",
}: MultiSelectDropdownProps) {
  const selectedCount = selectedIds.size
  const totalCount = options.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size === "sm" ? "sm" : "default"}
          className={cn(
            "justify-between",
            size === "sm" ? "min-w-[100px] text-xs h-8 px-2" : "min-w-[140px]",
            className
          )}
        >
          <span className="truncate">
            {label} ({selectedCount}/{totalCount})
          </span>
          <ChevronDown className={cn("shrink-0 opacity-50", size === "sm" ? "ml-1 h-3 w-3" : "ml-2 h-4 w-4")} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 max-h-[300px] overflow-y-auto" align="start">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0 text-xs font-normal text-muted-foreground">
            {selectedCount} selected
          </DropdownMenuLabel>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onSelectAll()
              }}
              disabled={selectedCount === totalCount}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onClearAll()
              }}
              disabled={selectedCount === 0}
            >
              None
            </Button>
          </div>
        </div>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.id}
            checked={selectedIds.has(option.id)}
            onCheckedChange={() => onToggle(option.id)}
            onSelect={(e) => e.preventDefault()}
            className={cn(
              option.color && selectedIds.has(option.id) && option.color
            )}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
