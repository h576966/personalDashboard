"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRY_OPTIONS } from "@/lib/db/topics";
import { Clock, Globe } from "lucide-react";

interface SearchModuleProps {
  query: string;
  freshness: string;
  country: string;
  isLoading: boolean;
  onQueryChange: (value: string) => void;
  onFreshnessChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSearch: (query: string) => void;
}

export default function SearchModule({
  query,
  freshness,
  country,
  isLoading,
  onQueryChange,
  onFreshnessChange,
  onCountryChange,
  onSearch,
}: SearchModuleProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch(query);
    }
  }

  return (
    <div className="bg-primary-hover border-b border-primary-hover/70 dark:border-primary-hover/80">
      <div className="flex flex-wrap items-center gap-2 mx-auto max-w-7xl px-4 py-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className="flex-1 min-w-[280px] h-11 border-primary bg-white dark:bg-zinc-800 dark:text-zinc-100"
          disabled={isLoading}
        />
        <Button
          type="button"
          onClick={() => onSearch(query)}
          disabled={!query.trim() || isLoading}
          size="sm"
          className="h-11 bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {isLoading ? "..." : "Go"}
        </Button>
          {/* Freshness */}
        <div className="flex items-center gap-1">
          <span className="text-white">
            <Clock className="w-3.5 h-3.5" />
          </span>
          <Select value={freshness} onValueChange={onFreshnessChange} disabled={isLoading}>
            <SelectTrigger className="rounded-md bg-primary-hover border border-primary px-2 py-1 h-auto text-xs text-white focus:ring-primary w-[110px] [&>svg]:text-white [&>span]:text-white">
              <SelectValue placeholder="Any time" />
            </SelectTrigger>
            <SelectContent className="w-[110px] min-w-[110px] bg-primary border-primary text-white">
              <SelectItem value="all" className="text-white focus:bg-primary-hover focus:text-white text-xs">Any time</SelectItem>
              <SelectItem value="pd" className="text-white focus:bg-primary-hover focus:text-white text-xs">Past Day</SelectItem>
              <SelectItem value="pw" className="text-white focus:bg-primary-hover focus:text-white text-xs">Past Week</SelectItem>
              <SelectItem value="pm" className="text-white focus:bg-primary-hover focus:text-white text-xs">Past Month</SelectItem>
              <SelectItem value="py" className="text-white focus:bg-primary-hover focus:text-white text-xs">Past Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
          {/* Region */}
        <div className="flex items-center gap-1">
          <span className="text-white">
            <Globe className="w-3.5 h-3.5" />
          </span>
          <Select value={country} onValueChange={onCountryChange} disabled={isLoading}>
            <SelectTrigger className="rounded-md bg-primary-hover border border-primary px-2 py-1 h-auto text-xs text-white focus:ring-primary w-[140px] [&>svg]:text-white [&>span]:text-white">
              <SelectValue placeholder="All regions" />
            </SelectTrigger>
            <SelectContent className="w-[140px] min-w-[140px] bg-primary border-primary text-white max-h-[200px]">
              {COUNTRY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-white focus:bg-primary-hover focus:text-white text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
