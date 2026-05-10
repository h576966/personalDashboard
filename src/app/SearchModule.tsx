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
import type { AppCopy } from "@/lib/i18n";
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
  copy: AppCopy;
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
  copy,
}: SearchModuleProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch(query);
    }
  }

  return (
    <div className="border-b border-primary-hover/60 bg-primary-hover dark:border-primary-hover/80">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-2 px-4 py-2 md:grid-cols-[minmax(320px,1fr)_auto_auto_auto] md:items-center">
        <Input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={copy.search.placeholder}
          className="h-10 min-w-0 border-primary/40 bg-white text-sm dark:bg-zinc-800 dark:text-zinc-100"
          disabled={isLoading}
        />
        <Button
          type="button"
          onClick={() => onSearch(query)}
          disabled={!query.trim() || isLoading}
          size="sm"
          className="h-10 bg-muted px-4 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {isLoading ? "..." : copy.search.go}
        </Button>
        <div className="flex items-center gap-1">
          <span className="text-white">
            <Clock className="w-3.5 h-3.5" />
          </span>
          <Select value={freshness} onValueChange={onFreshnessChange} disabled={isLoading}>
            <SelectTrigger className="h-9 w-[130px] rounded-md border border-white/20 bg-white/5 px-2 py-1 text-xs text-white focus:ring-primary [&>span]:text-white [&>svg]:text-white">
              <SelectValue placeholder={copy.search.anyTime} />
            </SelectTrigger>
            <SelectContent className="w-[130px] min-w-[130px] bg-primary border-primary text-white">
              <SelectItem value="all" className="text-white focus:bg-primary-hover focus:text-white text-xs">{copy.search.anyTime}</SelectItem>
              <SelectItem value="pd" className="text-white focus:bg-primary-hover focus:text-white text-xs">{copy.search.pastDay}</SelectItem>
              <SelectItem value="pw" className="text-white focus:bg-primary-hover focus:text-white text-xs">{copy.search.pastWeek}</SelectItem>
              <SelectItem value="pm" className="text-white focus:bg-primary-hover focus:text-white text-xs">{copy.search.pastMonth}</SelectItem>
              <SelectItem value="py" className="text-white focus:bg-primary-hover focus:text-white text-xs">{copy.search.pastYear}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-white">
            <Globe className="w-3.5 h-3.5" />
          </span>
          <Select value={country} onValueChange={onCountryChange} disabled={isLoading}>
            <SelectTrigger className="h-9 w-[150px] rounded-md border border-white/20 bg-white/5 px-2 py-1 text-xs text-white focus:ring-primary [&>span]:text-white [&>svg]:text-white">
              <SelectValue placeholder={copy.search.allRegions} />
            </SelectTrigger>
            <SelectContent className="w-[150px] min-w-[150px] bg-primary border-primary text-white max-h-[200px]">
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
