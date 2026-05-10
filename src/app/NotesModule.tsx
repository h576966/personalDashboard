"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  ActionButton,
  EmptyState,
  InlineNotice,
  ModuleCard,
  ModuleHeader,
  ResultCount,
  ShowMoreButton,
  SkeletonList,
  ToolbarInput,
} from "./components/ModuleChrome";
import type { AppCopy } from "@/lib/i18n";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface NoteInput {
  title: string;
  content: string;
}

interface NotesModuleProps {
  notes: Note[];
  isLoading: boolean;
  error?: string | null;
  onCreate: (note: NoteInput) => Promise<void>;
  onUpdate: (id: string, note: NoteInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  copy: AppCopy;
}

interface EditFormProps {
  note: Note;
  onSave: (id: string, note: NoteInput) => Promise<void>;
  onCancel: () => void;
  copy: AppCopy;
}

const PAGE_SIZE = 8;

export default function NotesModule({
  notes,
  isLoading,
  error,
  onCreate,
  onUpdate,
  onDelete,
  copy,
}: NotesModuleProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notes;

    return notes.filter((note) =>
      `${note.title} ${note.content}`.toLowerCase().includes(query),
    );
  }, [notes, searchQuery]);
  const visibleNotes = filteredNotes.slice(0, visibleCount);
  const hiddenCount = Math.max(filteredNotes.length - visibleNotes.length, 0);

  async function handleCreate() {
    if (!title.trim()) {
      setValidation(copy.notes.titleRequired);
      return;
    }

    setValidation(null);
    setIsSaving(true);
    await onCreate({ title: title.trim(), content });
    setIsSaving(false);
    setTitle("");
    setContent("");
    setIsCreating(false);
  }

  return (
    <ModuleCard>
      <ModuleHeader
        title={copy.notes.title}
        description={copy.notes.description}
        action={
          !isCreating && (
            <ActionButton
              onClick={() => {
                setValidation(null);
                setIsCreating(true);
              }}
              className="min-h-8 px-2.5 py-1.5 text-xs"
            >
              <Plus className="h-4 w-4" />
              {copy.notes.newNote}
            </ActionButton>
          )
        }
      />

      <div className="space-y-4 p-4">
        {error && <InlineNotice tone="error">{error}</InlineNotice>}
        {validation && <InlineNotice tone="warning">{validation}</InlineNotice>}

        {isCreating && (
          <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-700 dark:bg-zinc-900/50">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={copy.notes.titlePlaceholder}
              className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={copy.notes.contentPlaceholder}
              rows={5}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={handleCreate} disabled={isSaving} variant="primary">
                {isSaving ? copy.notes.saving : copy.notes.saveNote}
              </ActionButton>
              <ActionButton
                onClick={() => {
                  setIsCreating(false);
                  setValidation(null);
                }}
              >
                {copy.notes.cancel}
              </ActionButton>
            </div>
          </div>
        )}

        {isLoading ? (
          <SkeletonList count={3} />
        ) : notes.length === 0 ? (
          <EmptyState
            title={copy.notes.noNotesTitle}
            description={copy.notes.noNotesDescription}
          />
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <ToolbarInput
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder={copy.notes.search}
              />
              <ResultCount>
                {searchQuery.trim()
                  ? copy.counts.match(filteredNotes.length)
                  : copy.counts.note(notes.length)}
              </ResultCount>
            </div>

            {filteredNotes.length === 0 ? (
              <EmptyState
                title={copy.notes.noMatchesTitle}
                description={copy.notes.noMatchesDescription}
              />
            ) : (
              <>
                <ul className="space-y-2 sm:space-y-3">
                  {visibleNotes.map((note) => (
                    <li
                      key={note.id}
                      className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900 sm:p-4"
                    >
                      {editingId === note.id ? (
                        <EditForm
                          note={note}
                          onSave={onUpdate}
                          onCancel={() => setEditingId(null)}
                          copy={copy}
                        />
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {note.title}
                              </h3>
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <ActionButton
                                variant="ghost"
                                onClick={() => setEditingId(note.id)}
                                className="min-h-8 w-8 px-0"
                                aria-label={copy.notes.editNote}
                              >
                                <Pencil className="h-4 w-4" />
                              </ActionButton>
                              <ActionButton
                                variant="ghost"
                                onClick={() => onDelete(note.id)}
                                className="min-h-8 w-8 px-0 hover:text-red-600"
                                aria-label={copy.notes.deleteNote}
                              >
                                <Trash2 className="h-4 w-4" />
                              </ActionButton>
                            </div>
                          </div>
                          {note.content ? (
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                              {note.content}
                            </p>
                          ) : (
                            <p className="mt-2 text-sm text-zinc-400">{copy.notes.noDetails}</p>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                <ShowMoreButton
                  hiddenCount={hiddenCount}
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  label={copy.showMore(hiddenCount)}
                />
              </>
            )}
          </div>
        )}
      </div>
    </ModuleCard>
  );
}

function EditForm({ note, onSave, onCancel, copy }: EditFormProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [validation, setValidation] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      setValidation(copy.notes.editTitleRequired);
      return;
    }

    setValidation(null);
    setIsSaving(true);
    await onSave(note.id, { title: title.trim(), content });
    setIsSaving(false);
    onCancel();
  }

  return (
    <div className="space-y-3">
      {validation && <InlineNotice tone="warning">{validation}</InlineNotice>}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={handleSave} disabled={isSaving} variant="primary">
        {isSaving ? copy.notes.saving : copy.notes.save}
      </ActionButton>
      <ActionButton onClick={onCancel}>{copy.notes.cancel}</ActionButton>
      </div>
    </div>
  );
}
