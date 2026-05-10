import { BookMarked, ListChecks, Newspaper, NotebookPen, type LucideIcon } from "lucide-react";
import type { AppCopy } from "@/lib/i18n";

export type ActiveModule = "lists" | "notes" | "news" | "readLater";

export interface DashboardModule {
  id: ActiveModule;
  title: string;
  description: string;
  icon: LucideIcon;
}

export function getDashboardModules(copy: AppCopy): DashboardModule[] {
  return [
    {
      id: "lists",
      title: copy.modules.lists.title,
      description: copy.modules.lists.description,
      icon: ListChecks,
    },
    {
      id: "notes",
      title: copy.modules.notes.title,
      description: copy.modules.notes.description,
      icon: NotebookPen,
    },
    {
      id: "news",
      title: copy.modules.news.title,
      description: copy.modules.news.description,
      icon: Newspaper,
    },
    {
      id: "readLater",
      title: copy.modules.readLater.title,
      description: copy.modules.readLater.description,
      icon: BookMarked,
    },
  ];
}
