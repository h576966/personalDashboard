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

  async function handleCreate() {
    if (!title.trim()) return;
    await onCreate({ title, content });
    setTitle("");
    setContent("");
    setIsCreating(false);
  }

  return (
    <div className="rounded-md border bg-white p-4 dark:bg-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Notes</h2>
        {!isCreating && (
          <button onClick={() => setIsCreating(true)} className="text-xs text-primary">New note</button>
        )}
      </div>

      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

      {isCreating && (
        <div className="mb-4 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full border p-2 text-sm"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write something..."
            className="w-full border p-2 text-sm"
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="text-xs text-primary">Save</button>
            <button onClick={() => setIsCreating(false)} className="text-xs">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm">Loading...</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="border p-3">
              {editingId === note.id ? (
                <EditForm note={note} onSave={onUpdate} onCancel={() => setEditingId(null)} />
              ) : (
                <>
                  <div className="flex justify-between">
                    <strong>{note.title}</strong>
                    <div className="text-xs flex gap-2">
                      <button onClick={() => setEditingId(note.id)}>Edit</button>
                      <button onClick={() => onDelete(note.id)}>Delete</button>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500">{note.content}</p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
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
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 text-sm" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full border p-2 text-sm" />
      <div className="flex gap-2 text-xs">
        <button onClick={handleSave}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
