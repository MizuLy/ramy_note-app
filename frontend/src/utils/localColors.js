const FOLDER_COLORS_KEY = "ramy_folder_colors";
const TAG_COLORS_KEY = "ramy_tag_colors";

export const DEFAULT_ITEM_COLOR = "#3b82f6";

function readMap(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

function writeMap(key, map) {
  localStorage.setItem(key, JSON.stringify(map));
}

export function getFolderColors() {
  return readMap(FOLDER_COLORS_KEY);
}

export function getFolderColor(folderId) {
  if (!folderId) return DEFAULT_ITEM_COLOR;
  return getFolderColors()[folderId] || DEFAULT_ITEM_COLOR;
}

export function setFolderColor(folderId, color) {
  if (!folderId || !color) return;
  const map = getFolderColors();
  map[folderId] = color;
  writeMap(FOLDER_COLORS_KEY, map);
}

export function removeFolderColor(folderId) {
  if (!folderId) return;
  const map = getFolderColors();
  delete map[folderId];
  writeMap(FOLDER_COLORS_KEY, map);
}

export function getTagColors() {
  return readMap(TAG_COLORS_KEY);
}

export function getTagColor(tagId) {
  if (!tagId) return DEFAULT_ITEM_COLOR;
  return getTagColors()[tagId] || DEFAULT_ITEM_COLOR;
}

export function setTagColor(tagId, color) {
  if (!tagId || !color) return;
  const map = getTagColors();
  map[tagId] = color;
  writeMap(TAG_COLORS_KEY, map);
}

export function removeTagColor(tagId) {
  if (!tagId) return;
  const map = getTagColors();
  delete map[tagId];
  writeMap(TAG_COLORS_KEY, map);
}

export function mergeFolderColors(folders) {
  const colors = getFolderColors();
  return folders.map((f) => {
    const id = f.id || f._id;
    return { ...f, color: colors[id] || DEFAULT_ITEM_COLOR };
  });
}

export function mergeTagColors(tags) {
  const colors = getTagColors();
  return tags.map((t) => {
    const id = t.id || t._id;
    return { ...t, color: colors[id] || DEFAULT_ITEM_COLOR };
  });
}
