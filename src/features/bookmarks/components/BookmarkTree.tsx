import { Fragment } from "react";
import type { BookmarkNode } from "@/lib/bookmarks";

type Props = {
  nodes: BookmarkNode[];
};

export function BookmarkTree({ nodes }: Props) {
  if (!nodes.length) {
    return (
      <p style={{ color: "#64748b" }}>
        Carga un archivo para visualizar la jerarquía de marcadores.
      </p>
    );
  }

  return (
    <div
      style={{
        padding: "1.25rem",
        borderRadius: "1rem",
        background: "white",
        border: "1px solid #e2e8f0",
        boxShadow: "0 12px 30px -16px rgba(15, 23, 42, 0.2)"
      }}
    >
      <TreeList nodes={nodes} />
    </div>
  );
}

function TreeList({ nodes }: Props) {
  return (
    <ul
      style={{
        listStyle: "none",
        margin: 0,
        paddingLeft: "1rem",
        display: "grid",
        gap: "0.5rem"
      }}
    >
      {nodes.map((node) => (
        <TreeItem key={node.id} node={node} />
      ))}
    </ul>
  );
}

function TreeItem({ node }: { node: BookmarkNode }) {
  const isFolder = node.type === "folder";

  return (
    <li
      style={{
        borderLeft: "2px solid #cbd5f5",
        paddingLeft: "0.75rem"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            width: "1.5rem",
            height: "1.5rem",
            borderRadius: "0.5rem",
            background: isFolder ? "#6366f1" : "#ec4899",
            color: "white",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.8rem",
            fontWeight: 600
          }}
        >
          {isFolder ? "📁" : "🔗"}
        </span>
        {isFolder ? (
          <strong>{node.title}</strong>
        ) : (
          <a href={node.url} target="_blank" rel="noreferrer">
            {node.title}
          </a>
        )}
      </div>
      {node.children?.length ? (
        <Fragment>
          <small style={{ color: "#64748b" }}>
            {node.children.length} elemento(s)
          </small>
          <TreeList nodes={node.children ?? []} />
        </Fragment>
      ) : null}
    </li>
  );
}
