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

export function parseBookmarkPayload(payload: string): BookmarkNode[] {
  const trimmed = payload.trim();

  if (!trimmed) {
    return [];
  }

  if (!looksLikeHtml(trimmed)) {
    throw new Error("Formato no soportado. Sube el HTML exportado desde Chrome.");
  }

  return parseNetscapeHtml(trimmed);
}

function parseNetscapeHtml(payload: string): BookmarkNode[] {
  if (typeof DOMParser === "undefined") {
    throw new Error(
      "DOMParser no está disponible en este entorno. Ejecuta el procesamiento en el navegador.",
    );
  }

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

function looksLikeHtml(payload: string) {
  return payload.startsWith("<");
}
