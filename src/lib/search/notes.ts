import { searchNotes as searchNotesImpl } from "./notes.mjs";

export interface SearchableNote {
  id: string;
  title: string;
  content: string;
  updated_at?: string;
}

export interface NoteSearchResult {
  id: string;
  title: string;
  description: string;
  score: number;
  updated_at?: string;
}

export function searchNotes(notes: SearchableNote[], query: string): NoteSearchResult[] {
  return searchNotesImpl(notes, query) as NoteSearchResult[];
}
