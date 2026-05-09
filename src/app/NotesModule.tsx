"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  ActionButton,
  EmptyState,
  InlineNotice,
  LoadingRow,
  ModuleCard,
  ModuleHeader,
} from "./components/ModuleChrome";

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
}

interface EditFormProps {
  note: Note;
  onSave: (id: string, note: NoteInput) => Promise<void>;
  onCancel: () => void;
}

export default function NotesModule({
  notes,
  isLoading,
  error,
  onCreate,
  onUpdate,
  onDelete,
}: NotesModuleProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate() {
    if (!title.trim()) {
      setValidation("Add a title before saving the note.");
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
        title="Notes"
        description="Small shared thoughts, drafts, and household reference."
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
              New note
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
              placeholder="Title"
              className="min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write something worth keeping..."
              rows={5}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={handleCreate} disabled={isSaving} variant="primary">
                {isSaving ? "Saving..." : "Save note"}
              </ActionButton>
              <ActionButton
                onClick={() => {
                  setIsCreating(false);
                  setValidation(null);
                }}
              >
                Cancel
              </ActionButton>
            </div>
          </div>
        )}

        {isLoading ? (
          <LoadingRow label="Loading notes..." />
        ) : notes.length === 0 ? (
          <EmptyState
            title="No notes yet."
            description="Use notes for the bits that do not belong on a checklist."
          />
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
              >
                {editingId === note.id ? (
                  <EditForm note={note} onSave={onUpdate} onCancel={() => setEditingId(null)} />
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
                          aria-label="Edit note"
                        >
                          <Pencil className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton
                          variant="ghost"
                          onClick={() => onDelete(note.id)}
                          className="min-h-8 w-8 px-0 hover:text-red-600"
                          aria-label="Delete note"
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
                      <p className="mt-2 text-sm text-zinc-400">No details yet.</p>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModuleCard>
  );
}

function EditForm({ note, onSave, onCancel }: EditFormProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [validation, setValidation] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      setValidation("A note needs a title.");
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
          {isSaving ? "Saving..." : "Save"}
        </ActionButton>
        <ActionButton onClick={onCancel}>Cancel</ActionButton>
      </div>
    </div>
  );
}
