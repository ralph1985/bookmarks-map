import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { BookmarkNode } from "@/lib/bookmarks";
import styles from "./BookmarkKanbanBoard.module.css";

type Props = {
  nodes: BookmarkNode[];
  trail: BookmarkNode[];
  onOpenFolder: (node: BookmarkNode) => void;
  onNavigate: (targetIndex: number) => void;
};

type KanbanColumn = {
  id: string;
  title: string;
  items: KanbanItem[];
};

type KanbanItem = {
  node: BookmarkNode;
};

export function BookmarkKanbanBoard({ nodes, trail, onOpenFolder, onNavigate }: Props) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [stickyOffset, setStickyOffset] = useState(80);

  const columns = useMemo(() => buildColumns(nodes), [nodes]);
  const breadcrumbs = useMemo(
    () => [
      { label: "Inicio", index: -1 },
      ...trail.map((node, index) => ({ label: node.title, index }))
    ],
    [trail],
  );

  useEffect(() => {
    const header = headerRef.current;
    if (!header || typeof window === "undefined" || typeof ResizeObserver === "undefined") {
      return;
    }

    const computeOffset = () => {
      setStickyOffset(header.getBoundingClientRect().height + 16);
    };

    computeOffset();

    const resizeObserver = new ResizeObserver(() => computeOffset());
    resizeObserver.observe(header);
    window.addEventListener("resize", computeOffset);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", computeOffset);
    };
  }, [nodes, trail]);

  const handleBack = () => {
    if (trail.length === 0) {
      return;
    }
    onNavigate(trail.length - 2);
  };

  return (
    <div className={styles.board}>
      <header ref={headerRef} className={styles.boardHeader}>
        <button
          type="button"
          onClick={handleBack}
          disabled={trail.length === 0}
          className={styles.backButton}
        >
          ← Atrás
        </button>
        <nav aria-label="Ruta de carpetas" className={styles.breadcrumbs}>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            if (isLast) {
              return (
                <span key={`${crumb.label}-${crumb.index}`} className={styles.breadcrumbCurrent}>
                  {crumb.label}
                </span>
              );
            }
            return (
              <button
                key={`${crumb.label}-${crumb.index}`}
                type="button"
                onClick={() => onNavigate(crumb.index)}
                className={styles.breadcrumbButton}
              >
                {crumb.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className={styles.boardRow}>
        {columns.length === 0 ? (
          <div className={`${styles.emptyNotice} ${styles.emptyBoard}`}>
            Esta carpeta no contiene subcarpetas ni marcadores.
          </div>
        ) : (
          columns.map((column) => (
            <section key={column.id} className={styles.column}>
              <header
                className={styles.columnHeader}
                style={{ top: stickyOffset }}
              >
                <h3 className={styles.columnTitle}>{column.title}</h3>
                <span className={styles.columnCount}>{column.items.length}</span>
              </header>

              <div className={styles.columnBody}>
                {column.items.length === 0 ? (
                  <p className={styles.emptyNotice}>Sin elementos directos.</p>
                ) : (
                  column.items.map((item) => (
                    <KanbanCard key={item.node.id} item={item} onOpenFolder={onOpenFolder} />
                  ))
                )}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function KanbanCard({ item, onOpenFolder }: { item: KanbanItem; onOpenFolder: (node: BookmarkNode) => void }) {
  const isFolder = item.node.type === "folder";
  const childrenCount = item.node.children?.length ?? 0;
  const cardClasses = [styles.card];
  if (isFolder) {
    cardClasses.push(styles.cardInteractive);
  }

  const iconClasses = [styles.icon, isFolder ? styles.iconFolder : styles.iconLink].join(" ");

  const interactiveProps = isFolder
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick: () => onOpenFolder(item.node),
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenFolder(item.node);
          }
        }
      }
    : {
        role: "group" as const,
        tabIndex: -1
      };

  return (
    <div {...interactiveProps} className={cardClasses.join(" ")}>
      <div className={styles.cardHeader}>
        <span aria-hidden className={iconClasses}>
          {isFolder ? "📁" : "🔗"}
        </span>
        {isFolder ? (
          <span className={styles.cardTitle}>{item.node.title}</span>
        ) : item.node.url ? (
          <a href={item.node.url} target="_blank" rel="noreferrer" className={styles.cardLink}>
            {item.node.title}
          </a>
        ) : (
          <span className={styles.cardTitle}>{item.node.title}</span>
        )}
      </div>

    </div>
  );
}

function buildColumns(nodes: BookmarkNode[]): KanbanColumn[] {
  const folderColumns: KanbanColumn[] = nodes
    .filter((node) => node.type === "folder")
    .map((folder) => ({
      id: folder.id,
      title: folder.title,
      items: (folder.children ?? []).map((child) => ({ node: child }))
    }));

  const directBookmarks = nodes.filter((node) => node.type === "url");
  if (directBookmarks.length > 0) {
    folderColumns.push({
      id: `bookmarks-${directBookmarks.map((bookmark) => bookmark.id).join("-") || "root"}`,
      title: "Marcadores sueltos",
      items: directBookmarks.map((bookmark) => ({ node: bookmark }))
    });
  }

  return folderColumns;
}
