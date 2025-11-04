import type { BookmarkNode } from "@/lib/bookmarks";

type KanbanGroup = {
  id: string;
  title: string;
  columns: KanbanColumn[];
};

type KanbanColumn = {
  id: string;
  title: string;
  items: KanbanItem[];
};

type KanbanItem = {
  id: string;
  title: string;
  type: BookmarkNode["type"];
  url?: string;
  path: string[];
  childrenCount: number;
};

type Props = {
  nodes: BookmarkNode[];
};

export function BookmarkKanbanBoard({ nodes }: Props) {
  if (!nodes.length) {
    return (
      <p style={{ color: "#64748b" }}>
        Carga el HTML de marcadores para visualizarlo en formato Kanban.
      </p>
    );
  }

  const groups = buildGroups(nodes);

  return (
    <div style={{ display: "grid", gap: "1.75rem" }}>
      {groups.map((group) => (
        <section key={group.id} style={{ display: "grid", gap: "1rem" }}>
          <header style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#1e293b" }}>
              {group.title}
            </h2>
            <span
              style={{
                fontSize: "0.8rem",
                color: "#475569"
              }}
            >
              {group.columns.length} columna{group.columns.length === 1 ? "" : "s"}
            </span>
          </header>

          <div
            style={{
              display: "flex",
              gap: "1.25rem",
              overflowX: "auto",
              paddingBottom: "0.5rem"
            }}
          >
            {group.columns.map((column) => (
              <article
                key={column.id}
                style={{
                  minWidth: "260px",
                  maxWidth: "320px",
                  flex: "0 0 auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                  backgroundColor: "#f8fafc",
                  borderRadius: "0.75rem",
                  border: "1px solid #e2e8f0",
                  padding: "1rem"
                }}
              >
                <header
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.75rem"
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#1e293b"
                    }}
                  >
                    {column.title}
                  </h3>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#475569",
                      backgroundColor: "#e0e7ff",
                      borderRadius: "999px",
                      padding: "0.15rem 0.6rem"
                    }}
                  >
                    {column.items.length}
                  </span>
                </header>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {column.items.length === 0 ? (
                    <p
                      style={{
                        margin: 0,
                        padding: "0.75rem",
                        borderRadius: "0.65rem",
                        border: "1px dashed #cbd5f5",
                        backgroundColor: "#fff",
                        color: "#64748b",
                        fontSize: "0.85rem"
                      }}
                    >
                      Sin elementos directos.
                    </p>
                  ) : (
                    column.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          borderRadius: "0.75rem",
                          padding: "0.9rem",
                          backgroundColor: "#ffffff",
                          boxShadow: "0 14px 32px -24px rgba(15, 23, 42, 0.45)",
                          border: "1px solid #e2e8f0",
                          display: "grid",
                          gap: "0.4rem"
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.45rem"
                          }}
                        >
                          <span
                            aria-hidden
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "1.5rem",
                              height: "1.5rem",
                              borderRadius: "0.5rem",
                              backgroundColor:
                                item.type === "folder" ? "#4338ca" : "#db2777",
                              color: "#ffffff",
                              fontSize: "0.85rem"
                            }}
                          >
                            {item.type === "folder" ? "📁" : "🔗"}
                          </span>
                          {item.type === "url" && item.url ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "#1d4ed8",
                                fontWeight: 600,
                                textDecoration: "none",
                                wordBreak: "break-word"
                              }}
                            >
                              {item.title}
                            </a>
                          ) : (
                            <strong style={{ fontSize: "0.95rem" }}>{item.title}</strong>
                          )}
                        </div>

                        <footer
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.35rem",
                            fontSize: "0.75rem",
                            color: "#475569"
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: "#f1f5f9",
                              borderRadius: "999px",
                              padding: "0.15rem 0.6rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              fontWeight: 600
                            }}
                          >
                            {item.type === "folder" ? "Carpeta" : "Marcador"}
                          </span>
                          {item.type === "folder" ? (
                            <span>{item.childrenCount} elemento(s)</span>
                          ) : null}
                          {item.path.length > 1 ? (
                            <span style={{ color: "#0f172a" }}>
                              {item.path.slice(0, -1).join(" › ")}
                            </span>
                          ) : null}
                        </footer>
                      </div>
                    ))
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function buildGroups(nodes: BookmarkNode[]): KanbanGroup[] {
  return nodes.map((root) => {
    const columns: KanbanColumn[] = [];
    const looseItems: KanbanItem[] = [];

    const children = root.children ?? [];

    children.forEach((child) => {
      if (child.type === "folder") {
        columns.push({
          id: child.id,
          title: child.title,
          items: collectColumnItems(child, [root.title, child.title])
        });
      } else {
        looseItems.push({
          id: child.id,
          title: child.title,
          type: "url",
          url: child.url,
          path: [root.title, child.title],
          childrenCount: 0
        });
      }
    });

    if (looseItems.length) {
      columns.push({
        id: `${root.id}-inline-bookmarks`,
        title: "Marcadores sueltos",
        items: looseItems
      });
    }

    if (!columns.length) {
      columns.push({
        id: root.id,
        title: root.title,
        items: collectColumnItems(root, [root.title])
      });
    }

    return {
      id: root.id,
      title: root.title,
      columns
    };
  });
}

function collectColumnItems(node: BookmarkNode, parentPath: string[]): KanbanItem[] {
  const children = node.children ?? [];

  return children.map((child) => ({
    id: child.id,
    title: child.title,
    type: child.type,
    url: child.url,
    path: [...parentPath, child.title],
    childrenCount: child.children?.length ?? 0
  }));
}
