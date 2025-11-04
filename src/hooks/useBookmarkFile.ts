import { useCallback, useMemo, useState } from "react";
import { BookmarkNode, parseBookmarkPayload } from "@/lib/bookmarks";

type FileState =
  | { status: "idle"; nodes: BookmarkNode[]; error: null }
  | { status: "loading"; nodes: BookmarkNode[]; error: null }
  | { status: "loaded"; nodes: BookmarkNode[]; error: null }
  | { status: "error"; nodes: BookmarkNode[]; error: string };

const ACCEPTED_TYPES = new Set([
  "text/html",
  "application/xhtml+xml",
  "application/x-google-chrome-bookmarks"
]);

const ACCEPTED_EXTENSIONS = [".html", ".htm"];

function isSupportedFile(file: File) {
  if (ACCEPTED_TYPES.has(file.type)) {
    return true;
  }

  const normalizedName = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((extension) => normalizedName.endsWith(extension));
}

export function useBookmarkFile(initialNodes: BookmarkNode[] = []) {
  const [fileState, setFileState] = useState<FileState>({
    status: "idle",
    nodes: initialNodes,
    error: null
  });

  const reset = useCallback(() => {
    setFileState({ status: "idle", nodes: [], error: null });
  }, []);

  const onFileSelected = useCallback((file: File) => {
    if (!isSupportedFile(file)) {
      setFileState({
        status: "error",
        nodes: [],
        error: "El archivo debe ser el HTML exportado desde Chrome."
      });
      return;
    }

    setFileState((prev) => ({ ...prev, status: "loading", error: null }));

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result?.toString() ?? "";
        const parsed = parseBookmarkPayload(text);
        setFileState({ status: "loaded", nodes: parsed, error: null });
      } catch (error) {
        setFileState({
          status: "error",
          nodes: [],
          error:
            error instanceof Error
              ? error.message
              : "No se pudo procesar el archivo de marcadores."
        });
      }
    };
    reader.onerror = () => {
      setFileState({
        status: "error",
        nodes: [],
        error: "No se pudo leer el archivo. Intenta nuevamente."
      });
    };
    reader.readAsText(file, "utf-8");
  }, []);

  const helpers = useMemo(
    () => ({
      isIdle: fileState.status === "idle",
      isLoading: fileState.status === "loading",
      isLoaded: fileState.status === "loaded",
      isError: fileState.status === "error"
    }),
    [fileState.status]
  );

  return { ...fileState, ...helpers, onFileSelected, reset };
}
