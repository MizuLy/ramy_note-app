import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NoteList from "./NoteList";
import NoteEditor from "./NoteEditor";
import { useEffect } from "react";

export default function Trash() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  const handleSelectedNote = (nextNoteId) => {
    navigate(nextNoteId ? `/trash/${nextNoteId}` : "/trash");
  };

  const handleTrashed = () => {
    handleRefresh();
    navigate("/trash");
  };

  useEffect(() => {
    document.title = "Trash | Ramy";
  }, []);

  return (
    <div className="flex h-screen w-full">
      <NoteList
        selectedNoteId={id}
        onSelectNote={handleSelectedNote}
        refreshKey={refreshKey}
        isTrash={true}
        onRefresh={handleRefresh}
      />

      <NoteEditor
        noteId={id}
        onSelectNote={handleSelectedNote}
        onNoteUpdated={handleRefresh}
        onTrashed={handleTrashed}
        isTrash={true}
      />
    </div>
  );
}
