"use client";

import { useState } from "react";

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

export default function NotesModule({ notes, isLoading, error, onCreate, onUpdate, onDelete }: NotesModuleProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim()) {
      setValidation("Add a title before saving the note.");
      return;
    }

    setValidation(null);
    await onCreate({ title, content });
    setTitle("");
    setContent("");
    setIsCreating(false);
  }

  return (
    <section className="rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Notes</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Shared thoughts, drafts, and reminders.
            </p>
          </div>
        {!isCreating && (
            <button
              type="button"
              onClick={() => {
                setValidation(null);
                setIsCreating(true);
              }}
              className="rounded-md border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-muted"
            >
              New note
            </button>
        )}
        </div>
      </div>

      <div className="p-4">
      {error && (
        <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {validation && (
        <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          {validation}
        </div>
      )}

      {isCreating && (
        <div className="mb-4 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write something..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-md border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No notes yet. Add one when something is worth keeping.
        </p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {editingId === note.id ? (
                <EditForm note={note} onSave={onUpdate} onCancel={() => setEditingId(null)} />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-sm text-zinc-900 dark:text-zinc-100">{note.title}</strong>
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setEditingId(note.id)}
                        className="font-medium text-primary"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(note.id)}
                        className="font-medium text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-500 dark:text-zinc-400">
                    {note.content}
                  </p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
    </section>
  );
}

function EditForm({ note, onSave, onCancel }: EditFormProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  async function handleSave() {
    if (!title.trim()) return;
    await onSave(note.id, { title, content });
    onCancel();
  }

  return (
    <div className="space-y-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <div className="flex gap-2 text-xs">
        <button type="button" onClick={handleSave} className="font-medium text-primary">
          Save
        </button>
        <button type="button" onClick={onCancel} className="font-medium text-zinc-500">
          Cancel
        </button>
      </div>
    </div>
  );
}
