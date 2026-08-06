import { useState } from "react";
import NoteList from "./NoteList";
import NoteEditor from "./NoteEditor";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function Notes() {
  const { id: selectedNoteId } = useParams();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectedNote = (noteId) => {
    navigate(`/notes/${noteId}`);
  };

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  useEffect(() => {
    document.title = "Note | Ramy";
  });

  return (
    <div className="flex h-screen w-full">
      <NoteList
        selectedNoteId={selectedNoteId}
        onSelectNote={handleSelectedNote} // Shared state setter
        refreshKey={refreshKey}
      />
      <NoteEditor
        noteId={selectedNoteId}
        onSelectNote={handleSelectedNote} // Allows editor to switch notes directly on creation!
        onNoteUpdated={handleRefresh}
      />
    </div>
  );
}
