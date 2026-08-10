import { useState } from "react";

import NoteList from "./NoteList";

import NoteEditor from "./NoteEditor";

import { useEffect } from "react";

import { useNavigate, useParams, useLocation } from "react-router-dom";

import { useAuth } from "../../../context/AuthProvider";

import { getFolderId, getTags } from "../../../api/axios";

export default function Notes() {
  const { id, folderId, noteId, tagId } = useParams();

  const location = useLocation();

  const isTrash = location.pathname.startsWith("/trash");

  const selectedNoteId = noteId ?? id;

  const navigate = useNavigate();

  const { accessToken } = useAuth();

  const [refreshKey, setRefreshKey] = useState(0);

  const [folderName, setFolderName] = useState("");

  const [tagLabel, setTagLabel] = useState("");

  const handleSelectedNote = (nextNoteId) => {
    if (isTrash) {
      navigate(nextNoteId ? `/trash/${nextNoteId}` : "/trash");
    } else if (folderId) {
      navigate(`/folders/${folderId}/${nextNoteId}`);
    } else if (tagId) {
      navigate(`/tags/${tagId}/${nextNoteId}`);
    } else {
      navigate(`/notes/${nextNoteId}`);
    }
  };

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  const handleTrashed = () => {
    handleRefresh();

    if (isTrash) {
      navigate("/trash");
    } else {
      navigate(
        folderId ? `/folders/${folderId}` : tagId ? `/tags/${tagId}` : "/notes",
      );
    }
  };

  useEffect(() => {
    if (isTrash) {
      document.title = "Trash | Ramy";
    } else if (folderName) {
      document.title = `${folderName} | Ramy`;
    } else if (tagLabel) {
      document.title = `${tagLabel} | Ramy`;
    } else {
      document.title = "Note | Ramy";
    }
  });

  useEffect(() => {
    if (!folderId || !accessToken) {
      setFolderName("");

      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await getFolderId(folderId, accessToken);

        const folder = res?.folder || res?.data || res?.result || res;

        if (!cancelled) {
          setFolderName(folder?.name || "Folder");
        }
      } catch {
        if (!cancelled) setFolderName("Folder");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [folderId, accessToken]);

  useEffect(() => {
    if (!tagId || !accessToken) {
      setTagLabel("");

      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const list = await getTags(accessToken);

        const tags = Array.isArray(list) ? list : [];

        const found = tags.find((t) => (t.id || t._id) === tagId);

        if (!cancelled) setTagLabel(found?.tag || "Tag");
      } catch {
        if (!cancelled) setTagLabel("Tag");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tagId, accessToken]);

  return (
    <div className="flex h-screen w-full">
      <NoteList
        selectedNoteId={selectedNoteId}
        onSelectNote={handleSelectedNote}
        refreshKey={refreshKey}
        folderId={isTrash ? undefined : folderId}
        folderName={folderName}
        tagId={isTrash ? undefined : tagId}
        tagLabel={tagLabel}
        isTrash={isTrash}
        onRefresh={handleRefresh}
      />

      <NoteEditor
        noteId={selectedNoteId}
        onSelectNote={handleSelectedNote}
        onNoteUpdated={handleRefresh}
        onTrashed={handleTrashed}
        defaultFolderId={isTrash ? "" : folderId || ""}
        defaultTagName={isTrash ? "" : tagLabel || ""}
        isTrash={isTrash}
      />
    </div>
  );
}
