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
  const trimmed = payload.trim();

  if (!trimmed) {
    return [];
  }

  if (looksLikeJson(trimmed)) {
    try {
      return parseChromeJson(trimmed);
    } catch (error) {
      if (!looksLikeHtml(trimmed)) {
        throw error;
      }
      // fallthrough to HTML parsing
    }
  }

  if (looksLikeHtml(trimmed)) {
    return parseNetscapeHtml(trimmed);
  }

  throw new Error(
    "Formato no soportado. Sube el archivo JSON (`Bookmarks`) o el HTML exportado desde Chrome.",
  );
}

function parseChromeJson(payload: string): BookmarkNode[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `No se pudo interpretar el JSON: ${error.message}`
        : "No se pudo interpretar el JSON proporcionado.",
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

function parseNetscapeHtml(payload: string): BookmarkNode[] {
  const parser = new DOMParser();
  const document = parser.parseFromString(payload, "text/html");

  const rootList = document.body.querySelector("dl");

  if (!rootList) {
    throw new Error("No se encontró la estructura principal de marcadores en el HTML.");
  }

  let sequence = 0;
  const nextId = () => {
    sequence += 1;
    return `html-${sequence}`;
  };

  return visitHtmlList(rootList as HTMLDListElement, [], nextId);
}

function visitHtmlList(
  list: HTMLDListElement,
  path: string[],
  nextId: () => string,
): BookmarkNode[] {
  const nodes: BookmarkNode[] = [];
  let current: Element | null = list.firstElementChild;

  while (current) {
    if (current.tagName === "DT") {
      const heading = current.querySelector("h3, h4");
      const anchor = current.querySelector("a");

      if (heading) {
        const title = heading.textContent?.trim() ?? "Carpeta sin título";
        const folderPath = path.length ? [...path, title] : [title];
        const folderNode: BookmarkNode = {
          id: nextId(),
          title,
          type: "folder",
          dateAdded: heading.getAttribute("add_date") ?? undefined,
          dateModified: heading.getAttribute("last_modified") ?? undefined,
          path: folderPath,
          children: []
        };

        const siblingList = findNextList(current);
        if (siblingList) {
          folderNode.children = visitHtmlList(siblingList, folderPath, nextId);
          current = siblingList;
        }

        nodes.push(folderNode);
      } else if (anchor) {
        const title =
          anchor.textContent?.trim() ||
          anchor.getAttribute("href") ||
          "Marcador sin título";

        nodes.push({
          id: nextId(),
          title,
          type: "url",
          url: anchor.getAttribute("href") ?? undefined,
          dateAdded: anchor.getAttribute("add_date") ?? undefined,
          dateModified: anchor.getAttribute("last_modified") ?? undefined,
          path
        });
      }
    }

    current = current.nextElementSibling;
  }

  return nodes;
}

function findNextList(element: Element): HTMLDListElement | null {
  const childList = Array.from(element.children).find(
    (child) => child.tagName === "DL",
  );
  if (childList) {
    return childList as HTMLDListElement;
  }

  let pointer: Element | null = element.nextElementSibling;

  while (pointer) {
    if (pointer.tagName === "DL") {
      return pointer as HTMLDListElement;
    }

    pointer = pointer.nextElementSibling;
  }

  return null;
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

function looksLikeJson(payload: string) {
  const firstChar = payload[0];
  return firstChar === "{" || firstChar === "[";
}

function looksLikeHtml(payload: string) {
  return payload.startsWith("<");
}
