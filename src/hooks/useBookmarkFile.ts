import { useCallback, useEffect, useMemo, useState } from "react";
import { BookmarkNode, parseBookmarkPayload } from "@/lib/bookmarks";

type FileMeta = {
  fileName: string;
  savedAt: string;
};

type FileState =
  | { status: "idle"; nodes: BookmarkNode[]; error: null; meta: FileMeta | null }
  | { status: "loading"; nodes: BookmarkNode[]; error: null; meta: FileMeta | null }
  | { status: "loaded"; nodes: BookmarkNode[]; error: null; meta: FileMeta | null }
  | { status: "error"; nodes: BookmarkNode[]; error: string; meta: FileMeta | null };

type PersistedPayload = {
  version: 1;
  fileName: string;
  savedAt: string;
  content: string;
};

const ACCEPTED_TYPES = new Set([
  "text/html",
  "application/xhtml+xml",
  "application/x-google-chrome-bookmarks"
]);

const ACCEPTED_EXTENSIONS = [".html", ".htm"];
const STORAGE_KEY = "bookmarks-map.cache";

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
    error: null,
    meta: null
  });

  const reset = useCallback(() => {
    clearPersistedContent();
    setFileState({ status: "idle", nodes: [], error: null, meta: null });
  }, []);

  const onFileSelected = useCallback((file: File) => {
    if (!isSupportedFile(file)) {
      setFileState({
        status: "error",
        nodes: [],
        error: "El archivo debe ser el HTML exportado desde Chrome.",
        meta: fileState.meta
      });
      return;
    }

    setFileState((prev) => ({ ...prev, status: "loading", error: null }));

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result?.toString() ?? "";
        const parsed = parseBookmarkPayload(text);
        const meta: FileMeta = {
          fileName: file.name,
          savedAt: new Date().toISOString()
        };
        persistContent({
          version: 1,
          fileName: meta.fileName,
          savedAt: meta.savedAt,
          content: text
        });

        setFileState({ status: "loaded", nodes: parsed, error: null, meta });
      } catch (error) {
        setFileState({
          status: "error",
          nodes: [],
          error:
            error instanceof Error
              ? error.message
              : "No se pudo procesar el archivo de marcadores.",
          meta: fileState.meta
        });
      }
    };
    reader.onerror = () => {
      setFileState({
        status: "error",
        nodes: [],
        error: "No se pudo leer el archivo. Intenta nuevamente.",
        meta: fileState.meta
      });
    };
    reader.readAsText(file, "utf-8");
  }, [fileState.meta]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const cached = loadPersistedContent();
    if (!cached) {
      return;
    }

    try {
      const nodes = parseBookmarkPayload(cached.content);
      setFileState({
        status: "loaded",
        nodes,
        error: null,
        meta: { fileName: cached.fileName, savedAt: cached.savedAt }
      });
    } catch (error) {
      console.warn("No se pudo restaurar el archivo guardado:", error);
      clearPersistedContent();
      setFileState({ status: "idle", nodes: [], error: null, meta: null });
    }
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

function persistContent(payload: PersistedPayload) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("No se pudo guardar el archivo en localStorage:", error);
  }
}

function loadPersistedContent(): PersistedPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PersistedPayload;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      parsed.version !== 1 ||
      typeof parsed.fileName !== "string" ||
      typeof parsed.savedAt !== "string" ||
      typeof parsed.content !== "string"
    ) {
      throw new Error("Estructura inválida");
    }
    return parsed;
  } catch (error) {
    console.warn("Contenido de localStorage inválido, se limpiará.", error);
    clearPersistedContent();
    return null;
  }
}

function clearPersistedContent() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("No se pudo limpiar el contenido guardado:", error);
  }
}
