import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type KeyboardEvent,
  type MouseEvent
} from "react";
import type { BookmarkNode } from "@/lib/bookmarks";
import styles from "./BookmarkDiagram.module.css";

type DiagramNode = {
  node: BookmarkNode;
  x: number;
  y: number;
  depth: number;
  parentId?: string;
  hasChildren: boolean;
};

type DiagramLink = {
  sourceId: string;
  targetId: string;
};

type DiagramLayout = {
  nodes: DiagramNode[];
  links: DiagramLink[];
  size: {
    width: number;
    height: number;
  };
};

type TransformState = {
  x: number;
  y: number;
  scale: number;
};

const NODE_WIDTH = 200;
const NODE_HEIGHT = 120;
const CANVAS_PADDING = 160;
const SECOND_LEVEL_HORIZONTAL_OFFSET = NODE_WIDTH + 160;
const THIRD_LEVEL_HORIZONTAL_OFFSET = NODE_WIDTH + 140;
const GRANDCHILD_HORIZONTAL_GAP = NODE_WIDTH + 120;
const SECOND_LEVEL_VERTICAL_GAP = 220;
const GROUP_SPACING = 220;
const MAX_VISIBLE_DEPTH = 2;
const FIT_MARGIN = 48;
const DEFAULT_TRANSFORM: TransformState = { x: 48, y: 48, scale: 1 };
const MIN_SCALE = 0.3;
const MAX_SCALE = 2.75;

type Props = {
  nodes: BookmarkNode[];
  focusMode?: boolean;
  trail: BookmarkNode[];
  onOpenFolder: (node: BookmarkNode) => void;
  onNavigate: (targetIndex: number) => void;
};

export function BookmarkDiagram({
  nodes,
  focusMode = false,
  trail,
  onOpenFolder,
  onNavigate
}: Props) {
  const diagram = useMemo(() => computeLayout(nodes), [nodes]);
  const nodeLookup = useMemo(() => {
    const map = new Map<string, DiagramNode>();
    diagram.nodes.forEach((item) => map.set(item.node.id, item));
    return map;
  }, [diagram.nodes]);
  const diagramWidth = diagram.size.width;
  const diagramHeight = diagram.size.height;

  const [transform, setTransform] = useState<TransformState>(() => DEFAULT_TRANSFORM);
  const [isPanning, setIsPanning] = useState(false);

  const panState = useRef({
    active: false,
    pointerId: 0,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0
  });

  const viewportRef = useRef<HTMLDivElement>(null);
  const fitDiagram = useCallback(
    (options?: { smooth?: boolean }) => {
      const viewport = viewportRef.current;
      const next =
        !viewport || diagramWidth === 0 || diagramHeight === 0
          ? DEFAULT_TRANSFORM
          : computeFitTransform({ width: diagramWidth, height: diagramHeight }, viewport);

      setTransform((current) => {
        if (areTransformsSimilar(current, next)) {
          return current;
        }
        return next;
      });

      if (viewport) {
        viewport.scrollTo({
          top: 0,
          left: 0,
          behavior: options?.smooth ? "smooth" : "auto"
        });
      }
    },
    [diagramHeight, diagramWidth],
  );

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    const targetElement = event.target as HTMLElement | null;
    if (targetElement?.closest("a, button")) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    panState.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: transform.x,
      originY: transform.y
    };
    setIsPanning(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!panState.current.active || panState.current.pointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - panState.current.startX;
    const dy = event.clientY - panState.current.startY;

    setTransform((current) => ({
      ...current,
      x: panState.current.originX + dx,
      y: panState.current.originY + dy
    }));
  };

  const stopPan = (event: PointerEvent<HTMLDivElement>) => {
    if (!panState.current.active || panState.current.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    panState.current = {
      active: false,
      pointerId: 0,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0
    };
    setIsPanning(false);
  };

  const handleResetView = () => {
    fitDiagram({ smooth: true });
  };

  const diagramClassNames = [styles.diagram];
  if (focusMode) {
    diagramClassNames.push(styles.diagramFocus);
  }

  const breadcrumbs = useMemo(
    () => [
      { label: "Inicio", index: -1 },
      ...trail.map((node, index) => ({ label: node.title, index }))
    ],
    [trail],
  );

  const handleBack = () => {
    if (trail.length === 0) {
      return;
    }
    onNavigate(trail.length - 2);
  };

  const viewportClassNames = [styles.viewport];
  if (isPanning) {
    viewportClassNames.push(styles.viewportPanning);
  }
  if (focusMode) {
    viewportClassNames.push(styles.viewportFocus);
  } else {
    viewportClassNames.push(styles.viewportDefault);
  }
  const viewportClass = viewportClassNames.join(" ");

  useEffect(() => {
    fitDiagram();
  }, [fitDiagram, focusMode, nodes, trail]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (diagram.nodes.length === 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const rect = viewport.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;

      setTransform((current) => {
        const nextScale = clamp(current.scale * zoomFactor, MIN_SCALE, MAX_SCALE);
        if (nextScale === current.scale) {
          return current;
        }

        const scaleChange = nextScale / current.scale;
        const offsetX = pointerX - current.x;
        const offsetY = pointerY - current.y;

        return {
          x: pointerX - offsetX * scaleChange,
          y: pointerY - offsetY * scaleChange,
          scale: nextScale
        };
      });
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [diagram.nodes.length]);

  return (
    <div className={diagramClassNames.join(" ")}>
      <header className={styles.diagramHeader}>
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

      <div className={styles.toolbar} role="group" aria-label="Controles de zoom y posición">
        <button
          type="button"
          onClick={() =>
            setTransform((current) => ({
              ...current,
              scale: clamp(current.scale * 1.1, MIN_SCALE, MAX_SCALE)
            }))
          }
          className={styles.toolbarButton}
          aria-label="Acercar"
        >
          +
        </button>
        <button
          type="button"
          onClick={() =>
            setTransform((current) => ({
              ...current,
              scale: clamp(current.scale * 0.9, MIN_SCALE, MAX_SCALE)
            }))
          }
          className={styles.toolbarButton}
          aria-label="Alejar"
        >
          −
        </button>
        <button type="button" onClick={handleResetView} className={styles.toolbarButton}>
          Recentrar
        </button>
      </div>

      <div
        ref={viewportRef}
        className={viewportClass}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopPan}
        onPointerLeave={stopPan}
        onPointerCancel={stopPan}
        role="group"
        aria-label="Lienzo de diagrama"
      >
        <div
          className={styles.inner}
          style={{
            width: Math.max(diagram.size.width, 1),
            height: Math.max(diagram.size.height, 1),
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
          }}
        >
          <svg
            className={styles.linksLayer}
            width={diagram.size.width}
            height={diagram.size.height}
            viewBox={`0 0 ${diagram.size.width} ${diagram.size.height}`}
            aria-hidden
          >
            {diagram.links.map((link) => {
              const source = nodeLookup.get(link.sourceId);
              const target = nodeLookup.get(link.targetId);
              if (!source || !target) {
                return null;
              }
              const path = buildCurve(source, target);
              return <path key={`${link.sourceId}-${link.targetId}`} d={path} className={styles.linkPath} />;
            })}
          </svg>

          <div className={styles.nodesLayer}>
            {diagram.nodes.map((item) => (
              <DiagramNodeCard key={item.node.id} item={item} onOpenFolder={onOpenFolder} />
            ))}
          </div>
        </div>
      </div>

      <p className={styles.helper}>Arrastra para mover el mapa y usa la rueda o los botones para ajustar el zoom.</p>
    </div>
  );
}

function DiagramNodeCard({
  item,
  onOpenFolder
}: {
  item: DiagramNode;
  onOpenFolder: (node: BookmarkNode) => void;
}) {
  const { node } = item;
  const isFolder = node.type === "folder";
  const childCount = node.children?.length ?? 0;
  const pathLabel = node.path.length > 0 ? node.path.join(" / ") : node.title;
  const isZoomable = isFolder && childCount > 0;
  const cardClasses = [styles.node, isFolder ? styles.nodeFolder : styles.nodeBookmark];
  if (isZoomable) {
    cardClasses.push(styles.nodeInteractive);
  }

  const interactiveProps = isZoomable
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick: (event: MouseEvent<HTMLDivElement>) => {
          event.stopPropagation();
          onOpenFolder(item.node);
        },
        onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
          event.stopPropagation();
        },
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
    <div
      {...interactiveProps}
      className={cardClasses.join(" ")}
      style={{ left: item.x, top: item.y, width: NODE_WIDTH }}
      title={pathLabel}
    >
      <div className={styles.nodeHeader}>
        <span aria-hidden className={styles.nodeIcon}>
          {isFolder ? "📁" : "🔗"}
        </span>
        {isFolder ? (
          <span className={styles.nodeTitle}>{node.title}</span>
        ) : node.url ? (
          <a href={node.url} target="_blank" rel="noreferrer" className={styles.nodeLink}>
            {node.title}
          </a>
        ) : (
          <span className={styles.nodeTitle}>{node.title}</span>
        )}
      </div>
      {isFolder ? (
        <div className={styles.nodeMeta}>
          <span>{childCount === 1 ? "1 elemento" : `${childCount} elementos`}</span>
        </div>
      ) : null}
    </div>
  );
}

function computeFitTransform(size: DiagramLayout["size"], viewport: HTMLDivElement): TransformState {
  if (size.width <= 0 || size.height <= 0) {
    return DEFAULT_TRANSFORM;
  }

  const availableWidth = Math.max(viewport.clientWidth - FIT_MARGIN * 2, 1);
  const availableHeight = Math.max(viewport.clientHeight - FIT_MARGIN * 2, 1);

  const scale = clamp(
    Math.min(availableWidth / size.width, availableHeight / size.height),
    MIN_SCALE,
    MAX_SCALE
  );

  const scaledWidth = size.width * scale;
  const scaledHeight = size.height * scale;

  const x = (viewport.clientWidth - scaledWidth) / 2;
  const y = (viewport.clientHeight - scaledHeight) / 2;

  return { x, y, scale };
}

function areTransformsSimilar(a: TransformState, b: TransformState) {
  const epsilon = 0.5;
  return (
    Math.abs(a.x - b.x) < epsilon &&
    Math.abs(a.y - b.y) < epsilon &&
    Math.abs(a.scale - b.scale) < 0.01
  );
}

function computeLayout(nodes: BookmarkNode[]): DiagramLayout {
  const diagramNodes: DiagramNode[] = [];
  const diagramLinks: DiagramLink[] = [];

  let cursorX = CANVAS_PADDING;
  let maxRight = 0;
  let maxBottom = CANVAS_PADDING + NODE_HEIGHT / 2;

  nodes.forEach((root) => {
    const rootLeft = cursorX;
    const rootCenterY = CANVAS_PADDING;

    diagramNodes.push({
      node: root,
      x: rootLeft,
      y: rootCenterY,
      depth: 0,
      parentId: undefined,
      hasChildren: (root.children?.length ?? 0) > 0
    });

    let groupRight = rootLeft + NODE_WIDTH;
    let groupBottom = rootCenterY + NODE_HEIGHT / 2;

    const secondLevelLeft = rootLeft + SECOND_LEVEL_HORIZONTAL_OFFSET;
    const visibleChildren =
      MAX_VISIBLE_DEPTH >= 1 ? (root.children ?? []) : ([] as BookmarkNode[]);

    visibleChildren.forEach((child, index) => {
      const childCenterY = rootCenterY + (index + 1) * SECOND_LEVEL_VERTICAL_GAP;
      diagramNodes.push({
        node: child,
        x: secondLevelLeft,
        y: childCenterY,
        depth: 1,
        parentId: root.id,
        hasChildren: (child.children?.length ?? 0) > 0
      });
      diagramLinks.push({ sourceId: root.id, targetId: child.id });

      groupRight = Math.max(groupRight, secondLevelLeft + NODE_WIDTH);
      groupBottom = Math.max(groupBottom, childCenterY + NODE_HEIGHT / 2);

      const thirdLevelLeftBase = secondLevelLeft + THIRD_LEVEL_HORIZONTAL_OFFSET;
      const visibleGrandchildren =
        MAX_VISIBLE_DEPTH >= 2 ? (child.children ?? []) : ([] as BookmarkNode[]);

      visibleGrandchildren.forEach((grandchild, gcIndex) => {
        const grandchildLeft = thirdLevelLeftBase + gcIndex * GRANDCHILD_HORIZONTAL_GAP;
        diagramNodes.push({
          node: grandchild,
          x: grandchildLeft,
          y: childCenterY,
          depth: 2,
          parentId: child.id,
          hasChildren: (grandchild.children?.length ?? 0) > 0
        });
        diagramLinks.push({ sourceId: child.id, targetId: grandchild.id });

        groupRight = Math.max(groupRight, grandchildLeft + NODE_WIDTH);
      });
    });

    const groupWidth = groupRight - rootLeft;
    cursorX = rootLeft + groupWidth + GROUP_SPACING;

    maxRight = Math.max(maxRight, groupRight);
    maxBottom = Math.max(maxBottom, groupBottom);
  });

  if (diagramNodes.length === 0) {
    return {
      nodes: [],
      links: [],
      size: { width: 0, height: 0 }
    };
  }

  return {
    nodes: diagramNodes,
    links: diagramLinks,
    size: {
      width: Math.max(maxRight + CANVAS_PADDING, 640),
      height: Math.max(maxBottom + CANVAS_PADDING, 560)
    }
  };
}

function buildCurve(source: DiagramNode, target: DiagramNode) {
  const startCenterX = source.x + NODE_WIDTH / 2;
  const startCenterY = source.y;
  const endCenterX = target.x + NODE_WIDTH / 2;
  const endCenterY = target.y;

  const dx = endCenterX - startCenterX;
  const dy = endCenterY - startCenterY;

  if (Math.abs(dx) >= Math.abs(dy)) {
    const startX = source.x + NODE_WIDTH;
    const startY = source.y;
    const endX = target.x;
    const endY = target.y;
    const midX = startX + dx / 2;
    return `M ${startX} ${startY} C ${midX} ${startY} ${midX} ${endY} ${endX} ${endY}`;
  }

  const startX = source.x + NODE_WIDTH / 2;
  const startY = source.y + NODE_HEIGHT / 2;
  const endX = target.x + NODE_WIDTH / 2;
  const endY = target.y - NODE_HEIGHT / 2;
  const midY = startY + dy / 2;
  return `M ${startX} ${startY} C ${startX} ${midY} ${endX} ${midY} ${endX} ${endY}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
