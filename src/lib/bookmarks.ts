export type BookmarkNode = {
  id: string;
  title: string;
  type: "folder" | "url";
  url?: string;
  dateAdded?: string;
  dateModified?: string;
  path: string[];
  children?: BookmarkNode[];
};

type ChromeBookmarkNode = {
  id?: string;
  name?: string;
  type?: string;
  url?: string;
  date_added?: string;
  date_modified?: string;
  children?: ChromeBookmarkNode[];
};

type ChromeBookmarkFile = {
  roots?: Record<string, ChromeBookmarkNode>;
};

function assertIsChromeBookmarkFile(raw: unknown): asserts raw is ChromeBookmarkFile {
  if (
    typeof raw !== "object" ||
    raw === null ||
    !("roots" in raw) ||
    typeof (raw as ChromeBookmarkFile).roots !== "object" ||
    (raw as ChromeBookmarkFile).roots === null
  ) {
    throw new Error("El archivo no parece un export oficial de Chrome.");
  }
}

function visitNode(node: ChromeBookmarkNode, path: string[]): BookmarkNode {
  if (!node.name || !node.type || !node.id) {
    throw new Error("Faltan campos requeridos en un nodo de marcador.");
  }

  if (node.type === "url") {
    return {
      id: node.id,
      title: node.name,
      type: "url",
      url: node.url,
      dateAdded: node.date_added,
      dateModified: node.date_modified,
      path
    };
  }

  if (node.type === "folder") {
    const nextPath = [...path, node.name];
    const children = (node.children ?? []).map((child) => visitNode(child, nextPath));
    return {
      id: node.id,
      title: node.name,
      type: "folder",
      dateAdded: node.date_added,
      dateModified: node.date_modified,
      path,
      children
    };
  }

  throw new Error(`Tipo de nodo desconocido: ${node.type}`);
}

export function parseBookmarkPayload(payload: string): BookmarkNode[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `No se pudo interpretar el JSON: ${error.message}`
        : "No se pudo interpretar el JSON proporcionado."
    );
  }

  assertIsChromeBookmarkFile(parsed);

  const { roots } = parsed;
  const rootEntries = Object.entries(roots);

  if (rootEntries.length === 0) {
    return [];
  }

  return rootEntries.map(([rootKey, node]) =>
    visitNode(node, [formatRootName(rootKey, node.name)]),
  );
}

function formatRootName(key: string, fallback?: string) {
  if (fallback) {
    return fallback;
  }

  switch (key) {
    case "bookmark_bar":
      return "Barra de marcadores";
    case "other":
      return "Otros marcadores";
    case "synced":
      return "Marcadores móviles";
    default:
      return key;
  }
}
