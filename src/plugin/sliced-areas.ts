/**
 * Stable identifier used by the layout graph to reference an area.
 */
export type AreaId = string

/**
 * External tag used by the host to map content into areas.
 */
export type AreaTag = string

/**
 * Corner identifiers used for drag docking gestures.
 */
export type CornerId = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/**
 * Normalized rectangle in layout space (0..1).
 */
export type AreaRect = {
  left: number
  right: number
  top: number
  bottom: number
}

/**
 * Internal vertex identifier in the planar graph.
 */
type VertId = string

/**
 * Internal edge identifier in the planar graph.
 */
type EdgeId = string

/**
 * Graph vertex with normalized coordinates.
 */
export type GraphVert = {
  id: VertId
  x: number
  y: number
}

/**
 * Graph edge connecting two vertices, optionally on the border.
 */
export type GraphEdge = {
  id: EdgeId
  v1: VertId
  v2: VertId
  border: boolean
}

/**
 * Area represented by four ordered vertices.
 */
export type GraphArea = {
  id: AreaId
  v1: VertId
  v2: VertId
  v3: VertId
  v4: VertId
}

/**
 * Full planar graph for the layout.
 */
export type AreasGraph = {
  verts: Record<VertId, GraphVert>
  edges: Record<EdgeId, GraphEdge>
  areas: Record<AreaId, GraphArea>
}

/**
 * Serializable layout payload used by the host.
 */
export type AreasLayout = {
  areas: Array<{ id?: AreaId; tag: AreaTag; rect: AreaRect }>
}

/**
 * Payload emitted when a corner click is detected.
 */
export type CornerClickDetail = {
  areaId: AreaId
  corner: CornerId
  clientX: number
  clientY: number
}

/**
 * Payload emitted when an area is added.
 */
export type AreaAddedDetail = { areaId: AreaId; tag: AreaTag; rect: AreaRect }

/**
 * Payload emitted when an area is removed.
 */
export type AreaRemovedDetail = { areaId: AreaId; tag: AreaTag }

/**
 * Payload emitted when an area is updated.
 */
export type AreaUpdatedDetail = { areaId: AreaId; tag: AreaTag; oldRect: AreaRect; newRect: AreaRect }

/**
 * Alias for normalized rectangle geometry.
 */
type Rect = AreaRect

/**
 * Axis used for splits and edge moves.
 */
type SplitAxis = 'horizontal' | 'vertical'

/**
 * Direction describing adjacency between two areas.
 */
type JoinDir = 'west' | 'east' | 'north' | 'south' | 'none'

/**
 * Tracks areas created while trimming to overlap ranges.
 */
type RemainderInfo = { id: AreaId; sourceAreaId: AreaId }

/**
 * Result returned by an area resolver.
 */
export type AreaResolverResult =
  | HTMLElement
  | {
      element: HTMLElement
      cleanup?: () => void
    }
  | null
  | undefined

/**
 * Resolves host content for an area tag.
 * @param tag - External tag used to identify the area content type
 * @param areaId - Stable identifier for the specific area instance
 */
export type AreaResolver = {
  (tag: AreaTag, areaId: AreaId): AreaResolverResult
  (tag: AreaTag): AreaResolverResult
}

/**
 * Supported operation identifiers for interactive actions.
 */
export type SlicedAreasOperation =
  | 'resize'
  | 'split'
  | 'join'
  | 'replace'
  | 'swap'
  | 'move'
  | 'maximize'
  | 'restore'

/**
 * Identifiers describing layout mutations.
 */
type GraphChangeReason =
  | 'layout'
  | 'split'
  | 'join'
  | 'swap'
  | 'move'
  | 'replace'
  | 'close'
  | 'retag'
  | 'maximize'
  | 'restore'
  | 'resize'

/**
 * Configuration for enabling or disabling operations.
 */
export type SlicedAreasOperationsConfig = {
  enable?: SlicedAreasOperation[]
  disable?: SlicedAreasOperation[]
}

/**
 * State for resizing drag handles.
 */
type DragState = {
  axis: SplitAxis
  coord: number
  start: number
  end: number
  min: number
  max: number
  pointerId: number
  originX: number
  originY: number
}

/**
 * State for area move/split/join/swap gestures.
 */
type AreaDragState = {
  sourceAreaId: AreaId
  pointerId: number
  startX: number
  startY: number
  lastX: number
  lastY: number
  axis: SplitAxis | null
  swapMode: boolean
  originCorner?: CornerId
  moved?: boolean
}

/**
 * Attribute used to mark internal plugin nodes.
 */
const INTERNAL_ATTR = 'data-sliced-areas-internal'

/**
 * Attribute marking auto-generated area nodes.
 */
const AUTO_ATTR = 'data-sliced-areas-auto'

/**
 * Default split ratio when splitting without a pointer.
 */
const DEFAULT_RATIO = 0.5

/**
 * Minimum allowed area ratio per axis.
 */
const MIN_RATIO = 0.08

/**
 * Floating-point epsilon for geometry comparisons.
 */
const EPS = 1e-6

/**
 * Tolerance used for alignment and grid merging.
 */
const ALIGN_TOLERANCE = 1e-4

/**
 * Tolerance used for area joining alignment.
 */
const JOIN_TOLERANCE = 0.02

/**
 * Visible splitter thickness in pixels.
 */
const DEFAULT_SPLITTER_SIZE = 2

/**
 * Depth of the join target zone relative to the area size.
 */
const JOIN_ZONE_DEPTH = 0.18

/**
 * Movement threshold to start split gesture detection.
 */
const SPLIT_GESTURE_THRESHOLD_PX = 6

/**
 * Axis dominance threshold for split gesture classification.
 */
const SPLIT_AXIS_TOLERANCE_PX = 12

/**
 * Radius in pixels to treat drag as parked (no action).
 */
const DRAG_PARK_TOLERANCE_PX = 20

/**
 * Movement threshold in pixels to treat as a click.
 */
const CLICK_TOLERANCE_PX = 4

/**
 * Pixel snap tolerance for move preview.
 */
const MOVE_SNAP_PX = 12

/**
 * Minimum center zone size for replace action.
 */
const REPLACE_THRESHOLD_RATIO = MIN_RATIO * 3

const ALL_OPERATIONS: ReadonlyArray<SlicedAreasOperation> = [
  'resize',
  'split',
  'join',
  'replace',
  'swap',
  'move',
  'maximize',
  'restore',
]

/**
 * Web component implementing Blender-like area layout behavior.
 */
export class SlicedAreasElement extends HTMLElement {
  /**
   * Current graph model, or null when no layout is active.
   */
  private graph: AreasGraph | null = null

  /**
   * Root container for generated layout nodes.
   */
  private rootEl: HTMLDivElement | null = null

  /**
   * Hidden container used to stash detached area nodes.
   */
  private stashEl: HTMLDivElement | null = null

  /**
   * Resize observer to re-render on host size changes.
   */
  private resizeObserver: ResizeObserver | null = null

  /**
   * Active resize drag state for splitters.
   */
  private dragState: DragState | null = null

  /**
   * Active area drag state for move/split/join/swap.
   */
  private areaDragState: AreaDragState | null = null

  /**
   * Last pointer position seen during area drag.
   */
  private lastPointer: { x: number; y: number } | null = null

  /**
   * Overlay element used to preview drop zones.
   */
  private dropOverlay: HTMLDivElement | null = null

  /**
   * Dimmed overlay used to preview join results.
   */
  private dropShade: HTMLDivElement | null = null

  /**
   * Floating label used during drag interactions.
   */
  private dragLabel: HTMLDivElement | null = null

  /**
   * Snapshot used to revert canceled resize drags.
   */
  private dragSnapshot: AreasGraph | null = null

  /**
   * Cached cursor style so it can be restored.
   */
  private dragCursor: string | null = null

  /**
   * Stored graph when an area is maximized.
   */
  private storedGraph: AreasGraph | null = null

  /**
   * Stored tag mapping when an area is maximized.
   */
  private storedTags: Map<AreaId, AreaTag> | null = null

  /**
   * Configuration for enabled operations.
   */
  private operationsConfig: SlicedAreasOperationsConfig = {}

  /**
   * Resolved set of enabled operations.
   */
  private enabledOperations: Set<SlicedAreasOperation> = new Set(ALL_OPERATIONS)

  /**
   * Resolver used to materialize area content.
   */
  private areaResolver: AreaResolver | null = null

  /**
   * Cache of resolved area nodes by id.
   */
  private resolvedNodes = new Map<AreaId, HTMLElement>()

  /**
   * Cleanup callbacks for resolved area nodes.
   */
  private cleanupCallbacks = new Map<AreaId, () => void>()

  /**
   * Tag mapping for areas in the current graph.
   */
  private areaTags = new Map<AreaId, AreaTag>()

  /**
   * Counter for generating unique vertex ids.
   */
  private vertCounter = 0

  /**
   * Counter for generating unique edge ids.
   */
  private edgeCounter = 0

  /**
   * Counter for generating unique area ids.
   */
  private areaCounter = 0

  /**
   * Returns the current serialized layout.
   *
   * @returns Current layout or null when empty.
   */
  get layout(): AreasLayout | null {
    if (!this.graph) return null
    return this.serializeLayout(this.graph)
  }

  /**
   * Applies a serialized layout to the component.
   *
   * @param value Layout to apply, or null to clear.
   */
  set layout(value: AreasLayout | null) {
    if (!value) {
      this.graph = null
      this.areaTags.clear()
      this.storedGraph = null
      this.storedTags = null
      this.resolvedNodes.clear()
      this.render()
      return
    }
    if (value.areas.length === 0) {
      this.graph = null
      this.areaTags.clear()
      this.storedGraph = null
      this.storedTags = null
      this.resolvedNodes.clear()
      this.render()
      return
    }
    this.storedGraph = null
    this.storedTags = null
    const oldGraph = this.graph
    const oldTags = new Map(this.areaTags)
    const newGraph = this.buildGraphFromLayout(value)
    this.applyGraphChange(newGraph, 'layout', oldGraph, oldTags)
  }

  /**
   * Gets or sets which operations are enabled.
   */
  get operations(): SlicedAreasOperationsConfig {
    return this.operationsConfig
  }

  set operations(value: SlicedAreasOperationsConfig | null) {
    this.operationsConfig = value ?? {}
    this.syncOperations()
  }

  /**
   * Sets a resolver for auto-providing area content.
   *
   * @param resolver Callback for resolving an area tag to a node.
   */
  setResolver(resolver: AreaResolver | null): void {
    for (const [areaId, cleanup] of this.cleanupCallbacks.entries()) {
      try {
        cleanup()
      } catch (error) {
        console.error(`Error during cleanup for area ${areaId}:`, error)
      }
    }
    this.cleanupCallbacks.clear()
    this.areaResolver = resolver
    this.resolvedNodes.clear()
    if (resolver) {
      this.render()
    }
  }

  /**
   * Initializes internal DOM and observers when connected.
   */
  connectedCallback(): void {
    this.ensureRoot()
    this.addEventListener('sliced-areas:retag', this.onRetagRequest as EventListener)
    this.ensureResizeObserver()
    this.render()
  }

  /**
   * Cleans up observers and listeners when disconnected.
   */
  disconnectedCallback(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    this.detachDragListeners()
    this.removeEventListener('sliced-areas:retag', this.onRetagRequest as EventListener)
  }

  /**
   * Splits an area by zone, optionally using a pointer position.
   *
   * @param sourceAreaId Area to split.
   * @param zone Split direction.
   * @param clientX Pointer X position.
   * @param clientY Pointer Y position.
   */
  split(
    sourceAreaId: AreaId,
    zone: 'left' | 'right' | 'top' | 'bottom' = 'right',
    clientX = 0,
    clientY = 0,
  ): void {
    if (!this.isOperationEnabled('split')) return
    if (!this.graph) return
    const newAreaId = this.nextAreaId()
    const updated =
      Number.isFinite(clientX) && Number.isFinite(clientY) && this.rootEl
        ? this.splitAreaAtPointer(this.graph, sourceAreaId, zone, clientX, clientY, newAreaId)
        : this.splitAreaByZone(this.graph, sourceAreaId, zone, DEFAULT_RATIO, newAreaId)
    if (!updated) return
    this.ensureAreaNode(newAreaId, sourceAreaId, true)
    const normalized = this.normalizeGraph(updated)
    this.applyGraphChange(normalized, 'split')
  }

  /**
   * Joins two adjacent areas when alignment permits.
   *
   * @param sourceAreaId Area being merged into the target.
   * @param targetAreaId Area that remains after the join.
   */
  join(sourceAreaId: AreaId, targetAreaId: AreaId): void {
    if (!this.isOperationEnabled('join')) return
    if (!this.graph) return
    if (!this.canJoin(sourceAreaId, targetAreaId)) return
    const oldGraph = this.graph
    const oldTags = new Map(this.areaTags)
    const updated = this.joinAreas(this.graph, sourceAreaId, targetAreaId)
    if (!updated) return
    const normalized = this.normalizeGraph(updated)
    this.applyGraphChange(normalized, 'join', oldGraph, oldTags)
    this.pruneAreaTags(normalized)
  }

  /**
   * Replaces the target area with the source area content.
   *
   * @param sourceAreaId Area providing the content.
   * @param targetAreaId Area to remove.
   */
  replace(sourceAreaId: AreaId, targetAreaId: AreaId): void {
    if (!this.isOperationEnabled('replace')) return
    if (!this.graph) return
    const oldGraph = this.graph
    const oldTags = new Map(this.areaTags)
    const updated = this.replaceArea(this.graph, sourceAreaId, targetAreaId)
    if (!updated) return
    this.removeAreaNode(targetAreaId)
    const normalized = this.normalizeGraph(updated)
    this.applyGraphChange(normalized, 'replace', oldGraph, oldTags)
    this.pruneAreaTags(normalized)
  }

  /**
   * Swaps the ids (and therefore content) between two areas.
   *
   * @param sourceAreaId First area id.
   * @param targetAreaId Second area id.
   */
  swap(sourceAreaId: AreaId, targetAreaId: AreaId): void {
    if (!this.isOperationEnabled('swap')) return
    if (!this.graph) return
    const updated = this.swapAreaIds(this.graph, sourceAreaId, targetAreaId)
    if (!updated) return
    this.applyGraphChange(updated, 'swap')
  }

  /**
   * Moves one area into another, producing overlay and remainder areas.
   *
   * @param sourceAreaId Area being moved.
   * @param targetAreaId Area being split to receive the move.
   * @param overlay Target rectangle for the moved area.
   * @param remainder Remaining rectangle for the target area.
   */
  move(sourceAreaId: AreaId, targetAreaId: AreaId, overlay: Rect, remainder: Rect): void {
    if (!this.isOperationEnabled('move')) return
    if (!this.graph) return
    const updated = this.moveArea(this.graph, sourceAreaId, targetAreaId, overlay, remainder)
    if (!updated) return
    const normalized = this.normalizeGraph(updated)
    this.applyGraphChange(normalized, 'move')
  }

  /**
   * Removes an area from the layout if possible.
   *
   * @param areaId Area to close.
   */
  close(areaId: AreaId): void {
    if (!this.graph) return
    if (!this.graph.areas[areaId]) return
    if (Object.keys(this.graph.areas).length <= 1) return

    const oldGraph = this.graph
    const oldTags = new Map(this.areaTags)
    const next: AreasGraph = {
      verts: { ...this.graph.verts },
      edges: { ...this.graph.edges },
      areas: { ...this.graph.areas },
    }

    delete next.areas[areaId]
    this.removeAreaNode(areaId)
    const normalized = this.normalizeGraph(next)
    this.applyGraphChange(normalized, 'close', oldGraph, oldTags)
    this.pruneAreaTags(normalized)
  }

  /**
   * Updates the tag for a specific area.
   *
   * @param areaId Area to retag.
   * @param tag New tag value.
   */
  retag(areaId: AreaId, tag: AreaTag): void {
    if (!this.graph) return
    if (!this.graph.areas[areaId]) return
    if (this.areaTags.get(areaId) === tag) return
    const oldGraph = this.graph
    const oldTags = new Map(this.areaTags)
    this.areaTags.set(areaId, tag)
    this.resolvedNodes.delete(areaId)
    this.detachAreaNode(areaId)
    this.applyGraphChange(this.graph, 'retag', oldGraph, oldTags)
  }

  /**
   * Maximizes a single area and stores the previous layout.
   *
   * @param areaId Area to maximize.
   */
  maximize(areaId: AreaId): void {
    if (!this.isOperationEnabled('maximize')) return
    if (!this.graph) return
    if (this.storedGraph) return
    if (!this.graph.areas[areaId]) return
    const oldGraph = this.graph
    const oldTags = new Map(this.areaTags)
    this.storedGraph = this.graph
    this.storedTags = new Map(this.areaTags)
    const nextGraph = this.createBaseGraph(areaId)
    const nextTags = new Map<AreaId, AreaTag>()
    const tag = this.storedTags.get(areaId)
    if (tag) {
      nextTags.set(areaId, tag)
    }
    this.areaTags = nextTags
    this.applyGraphChange(nextGraph, 'maximize', oldGraph, oldTags)
  }

  /**
   * Restores the layout from a previous maximize action.
   */
  restore(): void {
    if (!this.isOperationEnabled('restore')) return
    if (!this.storedGraph) return
    const oldGraph = this.graph
    const oldTags = new Map(this.areaTags)
    const restoredGraph = this.storedGraph
    const restoredTags = this.storedTags ? new Map(this.storedTags) : new Map<AreaId, AreaTag>()
    this.storedGraph = null
    this.storedTags = null
    this.areaTags = restoredTags
    this.applyGraphChange(restoredGraph, 'restore', oldGraph, oldTags)
  }

  /**
   * Creates the root container element if it does not exist.
   */
  private ensureRoot(): void {
    if (this.rootEl) return

    const existing = this.querySelector<HTMLDivElement>(':scope > .sliced-areas-root')
    this.rootEl = existing ?? document.createElement('div')
    this.rootEl.classList.add('sliced-areas-root')
    this.rootEl.setAttribute(INTERNAL_ATTR, 'true')

    if (!existing) {
      this.appendChild(this.rootEl)
    }

    this.rootEl.addEventListener('pointerdown', this.onPointerDown)
    this.ensureStash()
  }

  /**
   * Creates the stash container used to hold detached nodes.
   */
  private ensureStash(): void {
    if (this.stashEl) return
    const existing = this.querySelector<HTMLDivElement>(':scope > .sliced-areas-stash')
    this.stashEl = existing ?? document.createElement('div')
    this.stashEl.classList.add('sliced-areas-stash')
    this.stashEl.setAttribute(INTERNAL_ATTR, 'true')
    if (!existing) {
      this.appendChild(this.stashEl)
    }
  }

  /**
   * Attaches a ResizeObserver to trigger re-rendering.
   */
  private ensureResizeObserver(): void {
    if (this.resizeObserver) return

    this.resizeObserver = new ResizeObserver(() => {
      this.render()
    })
    this.resizeObserver.observe(this)
  }

  /**
   * Emits a layout change event with serialized data.
   */
  private emitLayoutChange(): void {
    if (!this.graph) return
    this.dispatchEvent(
      new CustomEvent('sliced-areas:layoutchange', {
        detail: { layout: this.serializeLayout(this.graph) },
      }),
    )
  }

  /**
   * Emits a corner click event for docking actions.
   *
   * @param detail Corner click payload.
   */
  private emitCornerClick(detail: CornerClickDetail): void {
    if (detail.corner !== 'top-left') return
    this.dispatchEvent(new CustomEvent('sliced-areas:cornerclick', { detail }))
  }

  /**
   * Computes the difference between two graphs and tag sets.
   */
  private calculateLayoutDiff(
    oldGraph: AreasGraph | null,
    oldTags: Map<AreaId, AreaTag>,
    newGraph: AreasGraph,
    newTags: Map<AreaId, AreaTag>,
  ): {
    added: AreaId[]
    removed: AreaId[]
    updated: AreaId[]
  } {
    const added: AreaId[] = []
    const removed: AreaId[] = []
    const updated: AreaId[] = []

    const oldIds = new Set(oldGraph ? Object.keys(oldGraph.areas) : [])
    const newIds = new Set(Object.keys(newGraph.areas))

    for (const id of newIds) {
      if (!oldIds.has(id)) {
        added.push(id)
        continue
      }
      const oldArea = oldGraph!.areas[id]
      const newArea = newGraph.areas[id]
      if (!oldArea || !newArea) continue
      const oldRect = this.getAreaRect(oldGraph!, oldArea)
      const newRect = this.getAreaRect(newGraph, newArea)
      const oldTag = oldTags.get(id)
      const newTag = newTags.get(id)

      const rectChanged =
        Math.abs(oldRect.left - newRect.left) > EPS ||
        Math.abs(oldRect.top - newRect.top) > EPS ||
        Math.abs(oldRect.right - newRect.right) > EPS ||
        Math.abs(oldRect.bottom - newRect.bottom) > EPS

      if (rectChanged || oldTag !== newTag) {
        updated.push(id)
      }
    }

    for (const id of oldIds) {
      if (!newIds.has(id)) {
        removed.push(id)
      }
    }

    return { added, removed, updated }
  }

  /**
   * Applies a graph update and emits events as needed.
   */
  private applyGraphChange(
    newGraph: AreasGraph,
    reason: GraphChangeReason,
    oldGraph: AreasGraph | null = this.graph,
    oldTags: Map<AreaId, AreaTag> = new Map(this.areaTags),
  ): void {
    this.graph = newGraph

    if (oldGraph) {
      const diff = this.calculateLayoutDiff(oldGraph, oldTags, newGraph, this.areaTags)

      for (const id of diff.removed) {
        this.resolvedNodes.delete(id)
      }

      for (const id of diff.updated) {
        const oldTag = oldTags.get(id)
        const newTag = this.areaTags.get(id)
        if (oldTag !== newTag) {
          this.resolvedNodes.delete(id)
          this.detachAreaNode(id)
        }
      }

      this.render()
      this.emitLayoutChange()

      if (reason !== 'maximize' && reason !== 'restore') {
        this.emitGranularEvents(diff, oldGraph, oldTags)
      }
    } else {
      this.render()
    }
  }

  /**
   * Emits granular area events for added/removed/updated items.
   */
  private emitGranularEvents(
    diff: { added: AreaId[]; removed: AreaId[]; updated: AreaId[] },
    oldGraph: AreasGraph,
    oldTags: Map<AreaId, AreaTag>,
  ): void {
    if (!this.graph) return

    for (const id of diff.added) {
      const area = this.graph.areas[id]
      if (!area) continue
      this.dispatchEvent(
        new CustomEvent<AreaAddedDetail>('sliced-areas:area-added', {
          detail: {
            areaId: id,
            tag: this.areaTags.get(id) ?? id,
            rect: this.formatRect(this.getAreaRect(this.graph, area)),
          },
        }),
      )
    }

    for (const id of diff.removed) {
      this.dispatchEvent(
        new CustomEvent<AreaRemovedDetail>('sliced-areas:area-removed', {
          detail: {
            areaId: id,
            tag: oldTags.get(id) ?? id,
          },
        }),
      )
    }

    for (const id of diff.updated) {
      const area = this.graph.areas[id]
      if (!area) continue
      const oldRect = oldGraph.areas[id]
        ? this.getAreaRect(oldGraph, oldGraph.areas[id])
        : { left: 0, top: 1, right: 1, bottom: 0 }
      this.dispatchEvent(
        new CustomEvent<AreaUpdatedDetail>('sliced-areas:area-updated', {
          detail: {
            areaId: id,
            tag: this.areaTags.get(id) ?? id,
            oldRect: this.formatRect(oldRect),
            newRect: this.formatRect(this.getAreaRect(this.graph, area)),
          },
        }),
      )
    }
  }

  /**
   * Rebuilds the enabled operation set and re-renders.
   */
  private syncOperations(): void {
    const allowed = new Set(ALL_OPERATIONS)
    const enabled = new Set<SlicedAreasOperation>()
    const enableList = (this.operationsConfig.enable ?? []).filter(
      (op): op is SlicedAreasOperation => allowed.has(op),
    )
    if (enableList.length > 0) {
      for (const op of enableList) {
        enabled.add(op)
      }
    } else {
      for (const op of ALL_OPERATIONS) {
        enabled.add(op)
      }
    }
    const disableList = (this.operationsConfig.disable ?? []).filter(
      (op): op is SlicedAreasOperation => allowed.has(op),
    )
    for (const op of disableList) {
      enabled.delete(op)
    }
    this.enabledOperations = enabled
    this.render()
  }

  /**
   * Checks whether an operation is currently enabled.
   */
  private isOperationEnabled(operation: SlicedAreasOperation): boolean {
    return this.enabledOperations.has(operation)
  }

  /**
   * Returns whether any area drag operations are enabled.
   */
  private hasAreaDragOperations(): boolean {
    return (
      this.isOperationEnabled('split') ||
      this.isOperationEnabled('join') ||
      this.isOperationEnabled('move') ||
      this.isOperationEnabled('replace') ||
      this.isOperationEnabled('swap')
    )
  }

  /**
   * Reconciles area wrappers without tearing down the DOM tree.
   */
  private reconcileAreaWrappers(areaNodes: Map<AreaId, HTMLElement>): void {
    if (!this.rootEl || !this.graph) return

    const rect = this.rootEl.getBoundingClientRect()
    const width = Math.max(rect.width, 1)
    const height = Math.max(rect.height, 1)
    const splitterInset = DEFAULT_SPLITTER_SIZE / 2

    const existingWrappers = new Map<AreaId, HTMLDivElement>()
    const wrapperElements = this.rootEl.querySelectorAll<HTMLDivElement>('.sliced-areas-area')

    for (const wrapper of wrapperElements) {
      const overlay = wrapper.querySelector('.sliced-areas-overlay')
      const handle = overlay?.querySelector('.sliced-areas-corner')
      const areaId = handle?.getAttribute('data-area-id')
      if (areaId) {
        existingWrappers.set(areaId, wrapper)
      }
    }

    for (const area of Object.values(this.graph.areas)) {
      const areaRect = this.getAreaRect(this.graph, area)
      const left = areaRect.left * width + splitterInset
      const top = (1 - areaRect.top) * height + splitterInset
      const areaWidth = (areaRect.right - areaRect.left) * width - splitterInset * 2
      const areaHeight = (areaRect.top - areaRect.bottom) * height - splitterInset * 2

      const existingWrapper = existingWrappers.get(area.id)
      if (existingWrapper) {
        existingWrapper.style.left = `${left}px`
        existingWrapper.style.top = `${top}px`
        existingWrapper.style.width = `${Math.max(areaWidth, 0)}px`
        existingWrapper.style.height = `${Math.max(areaHeight, 0)}px`

        const currentNode = Array.from(existingWrapper.children).find(
          (child) => !child.hasAttribute(INTERNAL_ATTR),
        )
        const expectedNode = areaNodes.get(area.id)
        if (expectedNode && currentNode !== expectedNode) {
          if (currentNode) {
            const cleanup = this.cleanupCallbacks.get(area.id)
            if (cleanup) {
              try {
                cleanup()
              } catch (error) {
                console.error(`Error during cleanup for area ${area.id}:`, error)
              }
              this.cleanupCallbacks.delete(area.id)
            }
            currentNode.remove()
          }
          existingWrapper.appendChild(expectedNode)
        }

        existingWrappers.delete(area.id)
        continue
      }

      const wrapper = document.createElement('div')
      wrapper.classList.add('sliced-areas-area')
      wrapper.setAttribute(INTERNAL_ATTR, 'true')
      wrapper.style.left = `${left}px`
      wrapper.style.top = `${top}px`
      wrapper.style.width = `${Math.max(areaWidth, 0)}px`
      wrapper.style.height = `${Math.max(areaHeight, 0)}px`

      const overlay = document.createElement('div')
      overlay.classList.add('sliced-areas-overlay')
      overlay.setAttribute(INTERNAL_ATTR, 'true')
      wrapper.appendChild(overlay)

      const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const
      for (const corner of corners) {
        const handle = document.createElement('div')
        handle.classList.add('sliced-areas-corner')
        handle.classList.add(`is-${corner}`)
        handle.setAttribute(INTERNAL_ATTR, 'true')
        handle.dataset.areaId = area.id
        handle.dataset.corner = corner
        overlay.appendChild(handle)
      }

      const areaNode = areaNodes.get(area.id)
      if (areaNode) {
        wrapper.appendChild(areaNode)
      } else {
        throw new Error(`Missing area content for ${area.id}`)
      }

      this.rootEl.appendChild(wrapper)
    }

    for (const [_areaId, wrapper] of existingWrappers) {
      wrapper.remove()
    }
  }

  /**
   * Renders the current graph into positioned DOM nodes.
   */
  private render(): void {
    if (!this.rootEl || !this.graph) return

    const areaNodes = this.collectAreaNodes()
    this.ensureStash()
    if (this.stashEl) {
      this.stashEl.innerHTML = ''
    }
    let missing = Object.values(this.graph.areas).filter((area) => !areaNodes.has(area.id))
    if (missing.length > 0 && this.areaResolver) {
      for (const area of missing) {
        const cached = this.resolvedNodes.get(area.id)
        if (cached) {
          areaNodes.set(area.id, cached)
          continue
        }
        const tag = this.areaTags.get(area.id) ?? area.id
        const result = this.areaResolver(tag, area.id)
        const resolved = this.extractResolverElement(result, area.id)
        if (resolved) {
          this.assertFreshResolvedNode(area.id, tag, resolved)
          resolved.dataset.areaId = area.id
          resolved.setAttribute(AUTO_ATTR, 'true')
          this.resolvedNodes.set(area.id, resolved)
          areaNodes.set(area.id, resolved)
        }
      }
      missing = Object.values(this.graph.areas).filter((area) => !areaNodes.has(area.id))
    }
    if (missing.length > 0) {
      const detail = {
        missing: missing.map((area) => area.id),
        areas: Object.values(this.graph.areas).map((area) => ({
          id: area.id,
          rect: this.formatRect(this.getAreaRect(this.graph as AreasGraph, area)),
        })),
      }
      throw new Error(`Missing area content detected: ${JSON.stringify(detail)}`)
    }

    this.reconcileAreaWrappers(areaNodes)

    if (this.stashEl) {
      for (const [areaId, node] of areaNodes.entries()) {
        if (!this.graph.areas[areaId]) {
          this.stashEl.appendChild(node)
        }
      }
    }

    const oldHandles = this.rootEl.querySelectorAll('.sliced-areas-handle')
    for (const handle of oldHandles) {
      handle.remove()
    }

    if (this.isOperationEnabled('resize')) {
      const rect = this.rootEl.getBoundingClientRect()
      const width = Math.max(rect.width, 1)
      const height = Math.max(rect.height, 1)
      for (const handle of this.buildResizeHandles(this.graph, width, height)) {
        this.rootEl.appendChild(handle)
      }
    }
  }

  /**
   * Collects host-provided area nodes keyed by area id.
   *
   * @returns Map of area ids to nodes.
   */
  private collectAreaNodes(): Map<AreaId, HTMLElement> {
    const map = new Map<AreaId, HTMLElement>()
    const candidates = Array.from(this.querySelectorAll<HTMLElement>('[data-area-id]'))

    for (const node of candidates) {
      if (node.hasAttribute(INTERNAL_ATTR)) continue
      const id = node.dataset.areaId
      if (!id) continue
      const isAuto = node.hasAttribute(AUTO_ATTR)
      const existing = map.get(id)
      if (existing) {
        const existingIsAuto = existing.hasAttribute(AUTO_ATTR)
        if (existingIsAuto && !isAuto) {
          existing.remove()
          map.set(id, node)
        }
        continue
      }
      map.set(id, node)
    }

    return map
  }

  /**
   * Validates that a resolver returns a fresh node per area.
   *
   * @param areaId Area id being resolved.
   * @param tag Resolver tag for error context.
   * @param resolved Resolved node returned by the resolver.
   */
  private assertFreshResolvedNode(areaId: AreaId, tag: string, resolved: HTMLElement): void {
    const existingId = resolved.dataset.areaId
    if (existingId && existingId !== areaId) {
      throw new Error(
        `Resolver must return a fresh element per area. Got an element already assigned to "${existingId}" for tag "${tag}".`,
      )
    }
    for (const [resolvedId, node] of this.resolvedNodes.entries()) {
      if (node === resolved && resolvedId !== areaId) {
        throw new Error(
          `Resolver must return a fresh element per area. Got the same element for "${resolvedId}" and "${areaId}" (tag "${tag}").`,
        )
      }
    }
  }

  /**
   * Extracts element and cleanup callback from resolver result.
   */
  private extractResolverElement(result: AreaResolverResult, areaId: AreaId): HTMLElement | null {
    if (!result) {
      return null
    }

    if (result instanceof HTMLElement) {
      return result
    }

    if (typeof result === 'object' && 'element' in result) {
      const { element, cleanup } = result
      if (cleanup && typeof cleanup === 'function') {
        this.cleanupCallbacks.set(areaId, cleanup)
      }
      return element
    }

    return null
  }

  /**
   * Ensures a DOM node exists for a newly created area.
   *
   * @param newAreaId Area id needing a node.
   * @param sourceAreaId Area id to clone or inherit from.
   * @param cloneSource Whether to clone the source node when possible.
   */
  private ensureAreaNode(newAreaId: AreaId, sourceAreaId: AreaId, cloneSource = true): void {
    const existing = Array.from(
      this.querySelectorAll<HTMLElement>(`[data-area-id="${newAreaId}"]`),
    ).find((node) => !node.hasAttribute(INTERNAL_ATTR))
    if (existing) return

    this.inheritAreaTag(newAreaId, sourceAreaId)
    const sourceTag = this.areaTags.get(sourceAreaId) ?? this.areaTags.get(newAreaId)

    const source = Array.from(
      this.querySelectorAll<HTMLElement>(`[data-area-id="${sourceAreaId}"]`),
    ).find((node) => !node.hasAttribute(INTERNAL_ATTR))
    const sourceIsAuto = source?.hasAttribute(AUTO_ATTR) ?? false
    if (cloneSource && source && (!sourceIsAuto || !this.areaResolver)) {
      const clone = source.cloneNode(true) as HTMLElement
      clone.dataset.areaId = newAreaId
      clone.setAttribute(AUTO_ATTR, 'true')
      this.appendChild(clone)
      return
    }

    if (sourceTag && this.areaResolver) {
      const result = this.areaResolver(sourceTag, newAreaId)
      const resolved = this.extractResolverElement(result, newAreaId)
      if (resolved) {
        this.assertFreshResolvedNode(newAreaId, sourceTag, resolved)
        resolved.dataset.areaId = newAreaId
        resolved.setAttribute(AUTO_ATTR, 'true')
        this.appendChild(resolved)
        return
      }
    }

    const placeholder = document.createElement('div')
    placeholder.dataset.areaId = newAreaId
    placeholder.classList.add('sliced-areas-auto-content')
    placeholder.setAttribute(AUTO_ATTR, 'true')
    placeholder.textContent = sourceTag ?? 'Area'
    this.appendChild(placeholder)
  }

  /**
   * Copies a tag from an existing area when creating a new one.
   *
   * @param newAreaId Area id to assign a tag to.
   * @param sourceAreaId Area id to inherit the tag from.
   */
  private inheritAreaTag(newAreaId: AreaId, sourceAreaId: AreaId): void {
    if (this.areaTags.has(newAreaId)) return
    const tag = this.areaTags.get(sourceAreaId)
    if (tag) {
      this.areaTags.set(newAreaId, tag)
      return
    }
    this.areaTags.set(newAreaId, sourceAreaId)
  }

  /**
   * Ensures every layout item has a stable area id.
   */
  private assignAreaIds(layout: AreasLayout): Array<{ id: AreaId; tag: AreaTag; rect: Rect }> {
    const seen = new Set<AreaId>()
    const result: Array<{ id: AreaId; tag: AreaTag; rect: Rect }> = []

    for (const area of layout.areas) {
      let id: AreaId
      if (area.id) {
        if (seen.has(area.id)) {
          throw new Error(`Duplicate area ID: ${area.id}`)
        }
        id = area.id
        const match = /^area-(\d+)$/.exec(id)
        if (match) {
          /* v8 ignore next */
          const num = Number.parseInt(match[1] ?? '0', 10)
          /* v8 ignore next */
          if (num >= this.areaCounter) {
            this.areaCounter = num
          }
        }
      } else {
        id = this.nextAreaId()
      }
      seen.add(id)
      result.push({ id, tag: area.tag, rect: area.rect })
    }

    return result
  }

  /**
   * Builds a graph from a serialized layout payload.
   *
   * @param layout Serialized layout data.
   * @returns Graph representation of the layout.
   */
  private buildGraphFromLayout(layout: AreasLayout): AreasGraph {
    this.areaTags.clear()
    const assigned = this.assignAreaIds(layout)
    const rects: Array<{ id: AreaId; rect: Rect }> = []

    for (const item of assigned) {
      rects.push({ id: item.id, rect: item.rect })
      this.areaTags.set(item.id, item.tag)
    }
    const graph = this.buildGraphFromRects(rects)
    return this.normalizeGraph(graph)
  }

  /**
   * Converts the graph into a serialized layout payload.
   *
   * @param graph Graph to serialize.
   * @returns Layout payload for events.
   */
  private serializeLayout(graph: AreasGraph): AreasLayout {
    return {
      areas: Object.values(graph.areas).map((area) => ({
        id: area.id,
        tag: this.areaTags.get(area.id) ?? area.id,
        rect: this.formatRect(this.getAreaRect(graph, area)),
      })),
    }
  }

  /**
   * Removes tags for areas that no longer exist.
   *
   * @param graph Current graph for validation.
   */
  private pruneAreaTags(graph: AreasGraph): void {
    for (const areaId of this.areaTags.keys()) {
      if (!graph.areas[areaId]) {
        this.areaTags.delete(areaId)
        this.resolvedNodes.delete(areaId)
        this.cleanupCallbacks.delete(areaId)
      }
    }
  }

  /**
   * Handles bubbled retag events from area content.
   *
   * @param event Retag event from child content.
   */
  private onRetagRequest = (event: Event): void => {
    const detail = (event as CustomEvent<{ tag?: AreaTag }>).detail
    const nextTag = detail?.tag
    if (!nextTag || typeof nextTag !== 'string') return
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const areaNode = target.closest('[data-area-id]')
    if (!areaNode || !(areaNode instanceof HTMLElement)) return
    const areaId = areaNode.dataset.areaId
    if (!areaId) return
    if (!this.graph?.areas[areaId]) return
    event.stopPropagation()
    this.retag(areaId, nextTag)
  }

  /**
   * Normalizes rectangles so the layout spans the unit square.
   *
   * @param rects Rectangles to normalize.
   * @returns Normalized rectangles.
   */
  private normalizeRectsToUnit(
    rects: Array<{ id: AreaId; rect: Rect }>,
  ): Array<{ id: AreaId; rect: Rect }> {
    let minLeft = Infinity
    let maxRight = -Infinity
    let minBottom = Infinity
    let maxTop = -Infinity

    for (const item of rects) {
      minLeft = Math.min(minLeft, item.rect.left)
      maxRight = Math.max(maxRight, item.rect.right)
      minBottom = Math.min(minBottom, item.rect.bottom)
      maxTop = Math.max(maxTop, item.rect.top)
    }

    if (
      !Number.isFinite(minLeft) ||
      !Number.isFinite(maxRight) ||
      !Number.isFinite(minBottom) ||
      !Number.isFinite(maxTop)
    ) {
      return rects
    }

    const spanX = maxRight - minLeft
    const spanY = maxTop - minBottom
    if (spanX <= EPS || spanY <= EPS) return rects

    if (
      Math.abs(minLeft) <= EPS &&
      Math.abs(maxRight - 1) <= EPS &&
      Math.abs(minBottom) <= EPS &&
      Math.abs(maxTop - 1) <= EPS
    ) {
      return rects
    }

    return rects.map((item) => ({
      id: item.id,
      rect: {
        left: (item.rect.left - minLeft) / spanX,
        right: (item.rect.right - minLeft) / spanX,
        bottom: (item.rect.bottom - minBottom) / spanY,
        top: (item.rect.top - minBottom) / spanY,
      },
    }))
  }

  /**
   * Builds a graph from normalized rectangles.
   *
   * @param rects Rectangles that describe areas.
   * @returns Graph built from the rectangles.
   */
  private buildGraphFromRects(rects: Array<{ id: AreaId; rect: Rect }>): AreasGraph {
    const verts: Record<VertId, GraphVert> = {}
    const edges: Record<EdgeId, GraphEdge> = {}
    const areas: Record<AreaId, GraphArea> = {}
    const vertMap = new Map<string, VertId>()

    const getVert = (x: number, y: number): VertId => {
      const key = `${x.toFixed(6)}|${y.toFixed(6)}`
      const existing = vertMap.get(key)
      if (existing) return existing
      const id = this.addVert(verts, x, y)
      vertMap.set(key, id)
      return id
    }

    for (const item of rects) {
      const rect = item.rect
      const v1 = getVert(rect.left, rect.bottom)
      const v2 = getVert(rect.left, rect.top)
      const v3 = getVert(rect.right, rect.top)
      const v4 = getVert(rect.right, rect.bottom)
      areas[item.id] = { id: item.id, v1, v2, v3, v4 }
      this.addEdge(edges, v1, v2)
      this.addEdge(edges, v2, v3)
      this.addEdge(edges, v3, v4)
      this.addEdge(edges, v4, v1)
    }

    return { verts, edges, areas }
  }

  /**
   * Creates a single-area graph spanning the full layout.
   *
   * @param areaId Area id for the base graph.
   * @returns Graph with a single area.
   */
  private createBaseGraph(areaId: AreaId): AreasGraph {
    const verts: Record<VertId, GraphVert> = {}
    const edges: Record<EdgeId, GraphEdge> = {}
    const areas: Record<AreaId, GraphArea> = {}

    const v1 = this.addVert(verts, 0, 0)
    const v2 = this.addVert(verts, 0, 1)
    const v3 = this.addVert(verts, 1, 1)
    const v4 = this.addVert(verts, 1, 0)

    const e1 = this.nextEdgeId(edges)
    edges[e1] = { id: e1, v1, v2, border: true }
    const e2 = this.nextEdgeId(edges)
    edges[e2] = { id: e2, v1: v2, v2: v3, border: true }
    const e3 = this.nextEdgeId(edges)
    edges[e3] = { id: e3, v1: v3, v2: v4, border: true }
    const e4 = this.nextEdgeId(edges)
    edges[e4] = { id: e4, v1: v4, v2: v1, border: true }

    areas[areaId] = { id: areaId, v1, v2, v3, v4 }

    return { verts, edges, areas }
  }

  /**
   * Splits an area by a zone using a ratio.
   *
   * @param graph Graph to update.
   * @param areaId Area to split.
   * @param zone Split direction.
   * @param ratio Split ratio within the area.
   * @param newAreaId Id for the new area.
   * @returns Updated graph or null when split is invalid.
   */
  private splitAreaByZone(
    graph: AreasGraph,
    areaId: AreaId,
    zone: 'left' | 'right' | 'top' | 'bottom',
    ratio: number,
    newAreaId: AreaId,
  ): AreasGraph | null {
    const area = graph.areas[areaId]
    if (!area) return null

    const rect = this.getAreaRect(graph, area)
    const clampedRatio = Math.max(MIN_RATIO, Math.min(1 - MIN_RATIO, ratio))

    if (zone === 'left' || zone === 'right') {
      const width = rect.right - rect.left
      const splitX =
        zone === 'left' ? rect.left + width * clampedRatio : rect.left + width * (1 - clampedRatio)
      const keep: 'min' | 'max' = zone === 'left' ? 'max' : 'min'
      return this.splitAreaAt(graph, areaId, 'vertical', splitX, newAreaId, keep)
    }

    const height = rect.top - rect.bottom
    const splitY =
      zone === 'bottom'
        ? rect.bottom + height * clampedRatio
        : rect.bottom + height * (1 - clampedRatio)
    const keep: 'min' | 'max' = zone === 'bottom' ? 'max' : 'min'
    return this.splitAreaAt(graph, areaId, 'horizontal', splitY, newAreaId, keep)
  }

  /**
   * Splits an area using a pointer position inside the component.
   *
   * @param graph Graph to update.
   * @param areaId Area to split.
   * @param zone Split direction.
   * @param clientX Pointer X position.
   * @param clientY Pointer Y position.
   * @param newAreaId Id for the new area.
   * @returns Updated graph or null when split is invalid.
   */
  private splitAreaAtPointer(
    graph: AreasGraph,
    areaId: AreaId,
    zone: 'left' | 'right' | 'top' | 'bottom',
    clientX: number,
    clientY: number,
    newAreaId: AreaId,
  ): AreasGraph | null {
    const area = graph.areas[areaId]
    if (!area || !this.rootEl) return null

    const rect = this.rootEl.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = 1 - (clientY - rect.top) / rect.height
    const areaRect = this.getAreaRect(graph, area)

    const clampedX = Math.min(Math.max(x, areaRect.left + MIN_RATIO), areaRect.right - MIN_RATIO)
    const clampedY = Math.min(Math.max(y, areaRect.bottom + MIN_RATIO), areaRect.top - MIN_RATIO)

    if (zone === 'left' || zone === 'right') {
      const keep: 'min' | 'max' = zone === 'left' ? 'max' : 'min'
      return this.splitAreaAt(graph, areaId, 'vertical', clampedX, newAreaId, keep)
    }

    const keep: 'min' | 'max' = zone === 'bottom' ? 'max' : 'min'
    return this.splitAreaAt(graph, areaId, 'horizontal', clampedY, newAreaId, keep)
  }

  /**
   * Splits an area along a coordinate on a given axis.
   *
   * @param graph Graph to update.
   * @param areaId Area to split.
   * @param axis Axis to split along.
   * @param splitCoord Coordinate for the split.
   * @param newAreaId Id for the new area.
   * @param keep Which side keeps the original area id.
   * @returns Updated graph or null when split is invalid.
   */
  private splitAreaAt(
    graph: AreasGraph,
    areaId: AreaId,
    axis: SplitAxis,
    splitCoord: number,
    newAreaId: AreaId,
    keep: 'min' | 'max',
  ): AreasGraph | null {
    const area = graph.areas[areaId]
    if (!area) return null

    const rect = this.getAreaRect(graph, area)
    if (axis === 'vertical') {
      if (splitCoord <= rect.left + EPS || splitCoord >= rect.right - EPS) return null
    } else if (splitCoord <= rect.bottom + EPS || splitCoord >= rect.top - EPS) {
      return null
    }

    const next: AreasGraph = {
      verts: { ...graph.verts },
      edges: { ...graph.edges },
      areas: { ...graph.areas },
    }

    if (axis === 'horizontal') {
      const sv1 = this.addVert(next.verts, rect.left, splitCoord)
      const sv2 = this.addVert(next.verts, rect.right, splitCoord)
      this.addEdge(next.edges, area.v1, sv1)
      this.addEdge(next.edges, sv1, area.v2)
      this.addEdge(next.edges, area.v3, sv2)
      this.addEdge(next.edges, sv2, area.v4)
      this.addEdge(next.edges, sv1, sv2)

      const bottomArea: GraphArea = {
        id: keep === 'min' ? area.id : newAreaId,
        v1: area.v1,
        v2: sv1,
        v3: sv2,
        v4: area.v4,
      }
      const topArea: GraphArea = {
        id: keep === 'max' ? area.id : newAreaId,
        v1: sv1,
        v2: area.v2,
        v3: area.v3,
        v4: sv2,
      }

      next.areas[bottomArea.id] = bottomArea
      next.areas[topArea.id] = topArea
      if (bottomArea.id !== area.id && topArea.id !== area.id) {
        delete next.areas[area.id]
      }
    } else {
      const sv1 = this.addVert(next.verts, splitCoord, rect.bottom)
      const sv2 = this.addVert(next.verts, splitCoord, rect.top)
      this.addEdge(next.edges, area.v1, sv1)
      this.addEdge(next.edges, sv1, area.v4)
      this.addEdge(next.edges, area.v2, sv2)
      this.addEdge(next.edges, sv2, area.v3)
      this.addEdge(next.edges, sv1, sv2)

      const leftArea: GraphArea = {
        id: keep === 'min' ? area.id : newAreaId,
        v1: area.v1,
        v2: area.v2,
        v3: sv2,
        v4: sv1,
      }
      const rightArea: GraphArea = {
        id: keep === 'max' ? area.id : newAreaId,
        v1: sv1,
        v2: sv2,
        v3: area.v3,
        v4: area.v4,
      }

      next.areas[leftArea.id] = leftArea
      next.areas[rightArea.id] = rightArea
      if (leftArea.id !== area.id && rightArea.id !== area.id) {
        delete next.areas[area.id]
      }
    }

    return next
  }

  /**
   * Joins two areas, trimming to overlapping ranges as needed.
   *
   * @param graph Graph to update.
   * @param areaAId First area id.
   * @param areaBId Second area id.
   * @returns Updated graph or null when join is invalid.
   */
  private joinAreas(graph: AreasGraph, areaAId: AreaId, areaBId: AreaId): AreasGraph | null {
    let next = graph
    let areaA = next.areas[areaAId]
    let areaB = next.areas[areaBId]
    if (!areaA || !areaB) return null

    const dir = this.getOrientation(next, areaA, areaB)
    if (dir === 'none') return null

    const rectA = this.getAreaRect(next, areaA)
    const rectB = this.getAreaRect(next, areaB)

    let created: RemainderInfo[] = []
    if (dir === 'west' || dir === 'east') {
      const overlapBottom = Math.max(rectA.bottom, rectB.bottom)
      const overlapTop = Math.min(rectA.top, rectB.top)
      if (overlapTop - overlapBottom <= EPS) return null

      const trimA = this.trimAreaToRange(next, areaAId, 'horizontal', overlapBottom, overlapTop)
      next = trimA.graph
      areaA = next.areas[trimA.keptAreaId]
      if (!areaA) return null
      created = created.concat(trimA.created)

      const trimB = this.trimAreaToRange(next, areaBId, 'horizontal', overlapBottom, overlapTop)
      next = trimB.graph
      areaB = next.areas[trimB.keptAreaId]
      if (!areaB) return null
      created = created.concat(trimB.created)
    } else {
      const overlapLeft = Math.max(rectA.left, rectB.left)
      const overlapRight = Math.min(rectA.right, rectB.right)
      if (overlapRight - overlapLeft <= EPS) return null

      const trimA = this.trimAreaToRange(next, areaAId, 'vertical', overlapLeft, overlapRight)
      next = trimA.graph
      areaA = next.areas[trimA.keptAreaId]
      if (!areaA) return null
      created = created.concat(trimA.created)

      const trimB = this.trimAreaToRange(next, areaBId, 'vertical', overlapLeft, overlapRight)
      next = trimB.graph
      areaB = next.areas[trimB.keptAreaId]
      if (!areaB) return null
      created = created.concat(trimB.created)
    }

    const aligned = this.joinAreasAligned(next, areaAId, areaBId)
    if (!aligned) return null
    if (created.length === 0) return aligned
    return this.processRemainders(aligned, created, areaBId)
  }

  /**
   * Trims an area to a range and records created remainder areas.
   *
   * @param graph Graph to update.
   * @param areaId Area to trim.
   * @param axis Axis to trim along.
   * @param rangeStart Range start coordinate.
   * @param rangeEnd Range end coordinate.
   * @returns Updated graph, kept area id, and created remainders.
   */
  private trimAreaToRange(
    graph: AreasGraph,
    areaId: AreaId,
    axis: SplitAxis,
    rangeStart: number,
    rangeEnd: number,
  ): { graph: AreasGraph; keptAreaId: AreaId; created: RemainderInfo[] } {
    let next = graph
    const keptAreaId = areaId
    const created: RemainderInfo[] = []

    const area = next.areas[keptAreaId]
    if (!area) return { graph: next, keptAreaId, created }

    const rect = this.getAreaRect(next, area)

    if (axis === 'horizontal') {
      if (rect.bottom < rangeStart - EPS) {
        const newId = this.nextAreaId()
        const split = this.splitAreaAt(next, keptAreaId, axis, rangeStart, newId, 'max')
        if (split) {
          next = split
          created.push({ id: newId, sourceAreaId: areaId })
        }
      }

      const updated = next.areas[keptAreaId]
      if (updated) {
        const updatedRect = this.getAreaRect(next, updated)
        if (updatedRect.top > rangeEnd + EPS) {
          const newId = this.nextAreaId()
          const split = this.splitAreaAt(next, keptAreaId, axis, rangeEnd, newId, 'min')
          if (split) {
            next = split
            created.push({ id: newId, sourceAreaId: areaId })
          }
        }
      }
    } else {
      if (rect.left < rangeStart - EPS) {
        const newId = this.nextAreaId()
        const split = this.splitAreaAt(next, keptAreaId, axis, rangeStart, newId, 'max')
        if (split) {
          next = split
          created.push({ id: newId, sourceAreaId: areaId })
        }
      }

      const updated = next.areas[keptAreaId]
      if (updated) {
        const updatedRect = this.getAreaRect(next, updated)
        if (updatedRect.right > rangeEnd + EPS) {
          const newId = this.nextAreaId()
          const split = this.splitAreaAt(next, keptAreaId, axis, rangeEnd, newId, 'min')
          if (split) {
            next = split
            created.push({ id: newId, sourceAreaId: areaId })
          }
        }
      }
    }

    return { graph: next, keptAreaId, created }
  }

  /**
   * Applies remainder areas created during a join.
   *
   * @param graph Graph to update.
   * @param remainders Remainder areas created during trimming.
   * @param targetAreaId Target area being joined.
   * @returns Updated graph with remainders processed.
   */
  private processRemainders(
    graph: AreasGraph,
    remainders: RemainderInfo[],
    targetAreaId: AreaId,
  ): AreasGraph {
    let next = graph
    const targetRemainders = remainders.filter((item) => item.sourceAreaId === targetAreaId)
    const sourceRemainders = remainders.filter((item) => item.sourceAreaId !== targetAreaId)

    if (targetRemainders.length > 0) {
      const primary = targetRemainders[0]
      const rest = targetRemainders.slice(1)
      if (primary && next.areas[primary.id] && !next.areas[targetAreaId]) {
        next = this.renameAreaId(next, primary.id, targetAreaId)
      }
      this.ensureAreaNode(targetAreaId, targetAreaId, true)
      for (const remainder of rest) {
        this.ensureAreaNode(remainder.id, targetAreaId, true)
      }
    } else {
      this.removeAreaNode(targetAreaId)
    }

    for (const remainder of sourceRemainders) {
      delete next.areas[remainder.id]
      this.removeAreaNode(remainder.id)
    }

    return next
  }

  /**
   * Replaces an area with a new rectangle in the graph.
   *
   * @param graph Graph to update.
   * @param areaId Area to update.
   * @param rect New rectangle.
   * @returns Updated graph.
   */
  private setAreaRect(graph: AreasGraph, areaId: AreaId, rect: Rect): AreasGraph {
    const area = graph.areas[areaId]
    if (!area) return graph

    const next: AreasGraph = {
      verts: { ...graph.verts },
      edges: { ...graph.edges },
      areas: { ...graph.areas },
    }

    const v1 = this.addVert(next.verts, rect.left, rect.bottom)
    const v2 = this.addVert(next.verts, rect.left, rect.top)
    const v3 = this.addVert(next.verts, rect.right, rect.top)
    const v4 = this.addVert(next.verts, rect.right, rect.bottom)

    this.addEdge(next.edges, v1, v2)
    this.addEdge(next.edges, v2, v3)
    this.addEdge(next.edges, v3, v4)
    this.addEdge(next.edges, v4, v1)

    next.areas[areaId] = { id: areaId, v1, v2, v3, v4 }
    return next
  }

  /**
   * Moves an area into an overlay region and shrinks the target.
   *
   * @param graph Graph to update.
   * @param sourceAreaId Area being moved.
   * @param targetAreaId Area receiving the move.
   * @param overlay Rectangle for the moved area.
   * @param remainder Rectangle for the remainder of target.
   * @returns Updated graph or null when invalid.
   */
  private moveArea(
    graph: AreasGraph,
    sourceAreaId: AreaId,
    targetAreaId: AreaId,
    overlay: Rect,
    remainder: Rect,
  ): AreasGraph | null {
    const sourceArea = graph.areas[sourceAreaId]
    const targetArea = graph.areas[targetAreaId]
    if (!sourceArea || !targetArea) return null
    if (sourceAreaId === targetAreaId) return null

    const next: AreasGraph = {
      verts: { ...graph.verts },
      edges: { ...graph.edges },
      areas: { ...graph.areas },
    }

    const overlayWidth = overlay.right - overlay.left
    const overlayHeight = overlay.top - overlay.bottom
    const remainderWidth = remainder.right - remainder.left
    const remainderHeight = remainder.top - remainder.bottom
    if (
      overlayWidth <= EPS ||
      overlayHeight <= EPS ||
      remainderWidth <= EPS ||
      remainderHeight <= EPS
    ) {
      return null
    }

    const moved = this.setAreaRect(next, sourceAreaId, overlay)
    const updated = this.setAreaRect(moved, targetAreaId, remainder)
    return updated
  }

  /**
   * Replaces the target area with the source area rectangle.
   *
   * @param graph Graph to update.
   * @param sourceAreaId Area providing the rectangle.
   * @param targetAreaId Area to remove.
   * @returns Updated graph or null when invalid.
   */
  private replaceArea(
    graph: AreasGraph,
    sourceAreaId: AreaId,
    targetAreaId: AreaId,
  ): AreasGraph | null {
    const sourceArea = graph.areas[sourceAreaId]
    const targetArea = graph.areas[targetAreaId]
    if (!sourceArea || !targetArea) return null
    if (sourceAreaId === targetAreaId) return null

    const targetRect = this.getAreaRect(graph, targetArea)

    const next: AreasGraph = {
      verts: { ...graph.verts },
      edges: { ...graph.edges },
      areas: { ...graph.areas },
    }

    const moved = this.setAreaRect(next, sourceAreaId, targetRect)
    delete moved.areas[targetAreaId]

    return moved
  }

  /**
   * Renames an area id and updates DOM references.
   *
   * @param graph Graph to update.
   * @param fromId Existing area id.
   * @param toId New area id.
   * @returns Updated graph.
   */
  private renameAreaId(graph: AreasGraph, fromId: AreaId, toId: AreaId): AreasGraph {
    if (fromId === toId) return graph
    const area = graph.areas[fromId]
    if (!area) return graph
    if (graph.areas[toId]) {
      throw new Error(`Cannot rename area ${fromId} to ${toId}: target id already exists`)
    }

    const next: AreasGraph = {
      verts: { ...graph.verts },
      edges: { ...graph.edges },
      areas: { ...graph.areas },
    }
    next.areas[toId] = { ...area, id: toId }
    delete next.areas[fromId]

    const targetNode = Array.from(
      this.querySelectorAll<HTMLElement>(`[data-area-id="${toId}"]`),
    ).find((item) => !item.hasAttribute(INTERNAL_ATTR))
    const node = Array.from(this.querySelectorAll<HTMLElement>(`[data-area-id="${fromId}"]`)).find(
      (item) => !item.hasAttribute(INTERNAL_ATTR),
    )
    if (node) {
      if (targetNode) {
        const cleanup = this.cleanupCallbacks.get(fromId)
        if (cleanup) {
          try {
            cleanup()
          } catch (error) {
            console.error(`Error during cleanup for area ${fromId}:`, error)
          }
          this.cleanupCallbacks.delete(fromId)
        }
        node.remove()
      } else {
        node.dataset.areaId = toId
        const cleanup = this.cleanupCallbacks.get(fromId)
        if (cleanup) {
          this.cleanupCallbacks.delete(fromId)
          this.cleanupCallbacks.set(toId, cleanup)
        }
      }
    }

    const tag = this.areaTags.get(fromId)
    if (tag) {
      this.areaTags.set(toId, tag)
      this.areaTags.delete(fromId)
    }

    const resolved = this.resolvedNodes.get(fromId)
    if (resolved) {
      this.resolvedNodes.set(toId, resolved)
      this.resolvedNodes.delete(fromId)
    }

    return next
  }

  /**
   * Removes an area node and its cached metadata.
   *
   * @param areaId Area to remove.
   */
  private removeAreaNode(areaId: AreaId): void {
    const cleanup = this.cleanupCallbacks.get(areaId)
    if (cleanup) {
      try {
        cleanup()
      } catch (error) {
        console.error(`Error during cleanup for area ${areaId}:`, error)
      }
      this.cleanupCallbacks.delete(areaId)
    }
    const node = Array.from(this.querySelectorAll<HTMLElement>(`[data-area-id="${areaId}"]`)).find(
      (item) => !item.hasAttribute(INTERNAL_ATTR),
    )
    if (node) {
      node.remove()
    }
    this.areaTags.delete(areaId)
    this.resolvedNodes.delete(areaId)
    this.cleanupCallbacks.delete(areaId)
  }

  /**
   * Detaches an area node without altering tags.
   *
   * @param areaId Area to detach.
   */
  private detachAreaNode(areaId: AreaId): void {
    const cleanup = this.cleanupCallbacks.get(areaId)
    if (cleanup) {
      try {
        cleanup()
      } catch (error) {
        console.error(`Error during cleanup for area ${areaId}:`, error)
      }
      this.cleanupCallbacks.delete(areaId)
    }
    const node = Array.from(this.querySelectorAll<HTMLElement>(`[data-area-id="${areaId}"]`)).find(
      (item) => !item.hasAttribute(INTERNAL_ATTR),
    )
    if (node) {
      node.remove()
    }
    this.resolvedNodes.delete(areaId)
  }

  /**
   * Joins two areas that are already aligned.
   *
   * @param graph Graph to update.
   * @param areaAId First area id.
   * @param areaBId Second area id.
   * @returns Updated graph or null when join is invalid.
   */
  private joinAreasAligned(graph: AreasGraph, areaAId: AreaId, areaBId: AreaId): AreasGraph | null {
    const areaA = graph.areas[areaAId]
    const areaB = graph.areas[areaBId]
    if (!areaA || !areaB) return null

    const dir = this.getOrientation(graph, areaA, areaB)
    if (dir === 'none') return null

    if (!this.areAreasAligned(graph, areaA, areaB, dir)) {
      return null
    }

    const next: AreasGraph = {
      verts: { ...graph.verts },
      edges: { ...graph.edges },
      areas: { ...graph.areas },
    }

    const merged = { ...areaA }
    if (dir === 'west') {
      merged.v1 = areaB.v1
      merged.v2 = areaB.v2
      this.addEdge(next.edges, merged.v2, merged.v3)
      this.addEdge(next.edges, merged.v1, merged.v4)
    } else if (dir === 'north') {
      merged.v2 = areaB.v2
      merged.v3 = areaB.v3
      this.addEdge(next.edges, merged.v1, merged.v2)
      this.addEdge(next.edges, merged.v3, merged.v4)
    } else if (dir === 'east') {
      merged.v3 = areaB.v3
      merged.v4 = areaB.v4
      this.addEdge(next.edges, merged.v2, merged.v3)
      this.addEdge(next.edges, merged.v1, merged.v4)
    } else if (dir === 'south') {
      merged.v1 = areaB.v1
      merged.v4 = areaB.v4
      this.addEdge(next.edges, merged.v1, merged.v2)
      this.addEdge(next.edges, merged.v3, merged.v4)
    }

    next.areas[areaAId] = merged
    delete next.areas[areaBId]

    return next
  }

  /**
   * Swaps the ids of two areas in the graph.
   *
   * @param graph Graph to update.
   * @param areaAId First area id.
   * @param areaBId Second area id.
   * @returns Updated graph or null when invalid.
   */
  private swapAreaIds(graph: AreasGraph, areaAId: AreaId, areaBId: AreaId): AreasGraph | null {
    const areaA = graph.areas[areaAId]
    const areaB = graph.areas[areaBId]
    if (!areaA || !areaB) return null

    const next: AreasGraph = {
      verts: { ...graph.verts },
      edges: { ...graph.edges },
      areas: { ...graph.areas },
    }

    next.areas[areaAId] = { ...areaB, id: areaAId }
    next.areas[areaBId] = { ...areaA, id: areaBId }

    return next
  }

  /**
   * Checks whether two areas can be joined.
   *
   * @param areaAId First area id.
   * @param areaBId Second area id.
   * @returns True when join is possible.
   */
  private canJoin(areaAId: AreaId, areaBId: AreaId): boolean {
    if (!this.graph) return false
    const areaA = this.graph.areas[areaAId]
    const areaB = this.graph.areas[areaBId]
    if (!areaA || !areaB) return false
    const dir = this.getOrientation(this.graph, areaA, areaB)
    if (dir === 'none') return false
    const rectA = this.getAreaRect(this.graph, areaA)
    const rectB = this.getAreaRect(this.graph, areaB)
    if (dir === 'west' || dir === 'east') {
      const overlap = Math.min(rectA.top, rectB.top) - Math.max(rectA.bottom, rectB.bottom)
      return overlap > EPS
    }
    const overlap = Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left)
    return overlap > EPS
  }

  /**
   * Checks if two areas align for a join operation.
   *
   * @param graph Graph containing the areas.
   * @param areaA First area.
   * @param areaB Second area.
   * @param dir Expected orientation between areas.
   * @returns True when aligned within tolerance.
   */
  private areAreasAligned(
    graph: AreasGraph,
    areaA: GraphArea,
    areaB: GraphArea,
    dir: JoinDir,
  ): boolean {
    const offset = this.getOffsets(graph, areaA, areaB, dir)
    if (!offset) return false
    return Math.abs(offset.offset1) <= JOIN_TOLERANCE && Math.abs(offset.offset2) <= JOIN_TOLERANCE
  }

  /**
   * Determines the orientation between two areas.
   *
   * @param graph Graph containing the areas.
   * @param areaA First area.
   * @param areaB Second area.
   * @returns Orientation of areaB relative to areaA.
   */
  private getOrientation(graph: AreasGraph, areaA: GraphArea, areaB: GraphArea): JoinDir {
    const rectA = this.getAreaRect(graph, areaA)
    const rectB = this.getAreaRect(graph, areaB)

    const overlapX = Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left)
    const overlapY = Math.min(rectA.top, rectB.top) - Math.max(rectA.bottom, rectB.bottom)

    const minX = Math.min(JOIN_TOLERANCE, rectA.right - rectA.left, rectB.right - rectB.left)
    const minY = Math.min(JOIN_TOLERANCE, rectA.top - rectA.bottom, rectB.top - rectB.bottom)

    if (Math.abs(rectA.top - rectB.bottom) <= EPS && overlapX >= minX) {
      return 'north'
    }
    if (Math.abs(rectA.bottom - rectB.top) <= EPS && overlapX >= minX) {
      return 'south'
    }
    if (Math.abs(rectA.left - rectB.right) <= EPS && overlapY >= minY) {
      return 'west'
    }
    if (Math.abs(rectA.right - rectB.left) <= EPS && overlapY >= minY) {
      return 'east'
    }

    return 'none'
  }

  /**
   * Computes alignment offsets between two areas by orientation.
   *
   * @param graph Graph containing the areas.
   * @param areaA First area.
   * @param areaB Second area.
   * @param dir Orientation between the areas.
   * @returns Offset values or null when invalid.
   */
  private getOffsets(
    graph: AreasGraph,
    areaA: GraphArea,
    areaB: GraphArea,
    dir: JoinDir,
  ): { offset1: number; offset2: number } | null {
    const vA1 = graph.verts[areaA.v1]
    const vA2 = graph.verts[areaA.v2]
    const vA3 = graph.verts[areaA.v3]
    const vA4 = graph.verts[areaA.v4]
    const vB1 = graph.verts[areaB.v1]
    const vB2 = graph.verts[areaB.v2]
    const vB3 = graph.verts[areaB.v3]
    const vB4 = graph.verts[areaB.v4]
    if (!vA1 || !vA2 || !vA3 || !vA4 || !vB1 || !vB2 || !vB3 || !vB4) return null
    if (dir === 'west') {
      return {
        offset1: vB3.y - vA2.y,
        offset2: vB4.y - vA1.y,
      }
    }
    if (dir === 'north') {
      return {
        offset1: vA2.x - vB1.x,
        offset2: vA3.x - vB4.x,
      }
    }
    if (dir === 'east') {
      return {
        offset1: vB2.y - vA3.y,
        offset2: vB1.y - vA4.y,
      }
    }
    if (dir === 'south') {
      return {
        offset1: vA1.x - vB2.x,
        offset2: vA4.x - vB3.x,
      }
    }

    return null
  }

  /**
   * Builds draggable splitter handles for shared edges.
   *
   * @param graph Graph to inspect.
   * @param width Render width in pixels.
   * @param height Render height in pixels.
   * @returns Array of handle elements.
   */
  private buildResizeHandles(graph: AreasGraph, width: number, height: number): HTMLDivElement[] {
    const handles: HTMLDivElement[] = []
    const splitterSize = DEFAULT_SPLITTER_SIZE
    const hitSize = splitterSize + 2
    const edgeMap = new Map<
      string,
      { axis: SplitAxis; coord: number; segments: Array<{ start: number; end: number }> }
    >()

    for (const area of Object.values(graph.areas)) {
      const rect = this.getAreaRect(graph, area)
      this.registerEdge(edgeMap, 'vertical', rect.left, rect.bottom, rect.top)
      this.registerEdge(edgeMap, 'vertical', rect.right, rect.bottom, rect.top)
      this.registerEdge(edgeMap, 'horizontal', rect.bottom, rect.left, rect.right)
      this.registerEdge(edgeMap, 'horizontal', rect.top, rect.left, rect.right)
    }

    for (const edge of edgeMap.values()) {
      if (edge.axis === 'vertical' && (edge.coord <= EPS || edge.coord >= 1 - EPS)) continue
      if (edge.axis === 'horizontal' && (edge.coord <= EPS || edge.coord >= 1 - EPS)) continue

      const sharedSegments = this.computeSharedSegments(edge.segments)
      for (const segment of sharedSegments) {
        const handle = document.createElement('div')
        handle.classList.add('sliced-areas-handle')
        handle.setAttribute(INTERNAL_ATTR, 'true')
        handle.dataset.axis = edge.axis
        handle.dataset.coord = edge.coord.toFixed(6)
        handle.dataset.start = segment.start.toFixed(6)
        handle.dataset.end = segment.end.toFixed(6)

        if (edge.axis === 'vertical') {
          handle.classList.add('is-vertical')
          handle.style.left = `${edge.coord * width - hitSize / 2}px`
          handle.style.top = `${(1 - segment.end) * height}px`
          handle.style.width = `${hitSize}px`
          handle.style.height = `${(segment.end - segment.start) * height}px`
        } else {
          handle.classList.add('is-horizontal')
          handle.style.left = `${segment.start * width}px`
          handle.style.top = `${(1 - edge.coord) * height - hitSize / 2}px`
          handle.style.width = `${(segment.end - segment.start) * width}px`
          handle.style.height = `${hitSize}px`
        }

        handles.push(handle)
      }
    }

    return handles
  }

  /**
   * Registers an edge segment for shared edge detection.
   *
   * @param map Edge aggregation map.
   * @param axis Axis of the edge.
   * @param coord Constant coordinate for the edge.
   * @param start Segment start.
   * @param end Segment end.
   */
  private registerEdge(
    map: Map<
      string,
      { axis: SplitAxis; coord: number; segments: Array<{ start: number; end: number }> }
    >,
    axis: SplitAxis,
    coord: number,
    start: number,
    end: number,
  ): void {
    const min = Math.min(start, end)
    const max = Math.max(start, end)
    const key = `${axis}|${coord.toFixed(6)}`
    const existing = map.get(key)
    const entry = existing ?? { axis, coord, segments: [] }
    entry.segments.push({ start: min, end: max })
    if (!existing) {
      map.set(key, entry)
    }
  }

  /**
   * Computes overlapping segments shared by at least two areas.
   *
   * @param segments Segments to analyze.
   * @returns Shared segments.
   */
  private computeSharedSegments(
    segments: Array<{ start: number; end: number }>,
  ): Array<{ start: number; end: number }> {
    const events: Array<{ pos: number; delta: number }> = []
    for (const segment of segments) {
      const min = Math.min(segment.start, segment.end)
      const max = Math.max(segment.start, segment.end)
      if (max - min <= EPS) continue
      events.push({ pos: min, delta: 1 })
      events.push({ pos: max, delta: -1 })
    }

    events.sort((a, b) => {
      if (Math.abs(a.pos - b.pos) > EPS) return a.pos - b.pos
      return a.delta - b.delta
    })

    const result: Array<{ start: number; end: number }> = []
    let count = 0
    let activeStart: number | null = null

    for (const event of events) {
      const prevCount = count
      count += event.delta
      if (prevCount < 2 && count >= 2) {
        activeStart = event.pos
      } else if (prevCount >= 2 && count < 2 && activeStart !== null) {
        if (event.pos - activeStart > EPS) {
          result.push({ start: activeStart, end: event.pos })
        }
        activeStart = null
      }
    }

    return result
  }

  /**
   * Handles pointer down on resize handles and drag targets.
   *
   * @param event Pointer event.
   */
  private onPointerDown = (event: PointerEvent): void => {
    if (!this.rootEl || !this.graph) return
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target.classList.contains('sliced-areas-grab')) {
      const areaId = target.dataset.areaId
      if (!areaId) return
      if (!this.hasAreaDragOperations()) return
      event.preventDefault()
      this.startAreaDrag(event, areaId)
      return
    }
    if (target.classList.contains('sliced-areas-corner')) {
      const areaId = target.dataset.areaId
      if (!areaId) return
      const corner = target.dataset.corner as CornerId | undefined
      if (!this.hasAreaDragOperations()) return
      event.preventDefault()
      this.startAreaDrag(event, areaId, corner)
      return
    }
    if (!target.classList.contains('sliced-areas-handle')) return
    if (!this.isOperationEnabled('resize')) return
    event.preventDefault()

    const axis = (target.dataset.axis ?? '') as SplitAxis
    const coord = Number(target.dataset.coord)
    const start = Number(target.dataset.start)
    const end = Number(target.dataset.end)
    if (!axis || !Number.isFinite(coord) || !Number.isFinite(start) || !Number.isFinite(end)) return

    const bounds = this.getEdgeDragBounds(this.graph, axis, coord, start, end)
    if (!bounds) return

    target.setPointerCapture(event.pointerId)
    this.dragState = {
      axis,
      coord,
      start,
      end,
      min: bounds.min,
      max: bounds.max,
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
    }
    this.dragSnapshot = this.cloneGraph(this.graph)

    window.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  /**
   * Handles pointer movement for resize and area drag operations.
   *
   * @param event Pointer event.
   */
  private onPointerMove = (event: PointerEvent): void => {
    if (this.areaDragState) {
      this.updateAreaDrag(event)
      return
    }
    if (!this.rootEl || !this.graph || !this.dragState) return

    const rect = this.rootEl.getBoundingClientRect()
    const width = Math.max(rect.width, 1)
    const height = Math.max(rect.height, 1)
    const deltaX = event.clientX - this.dragState.originX
    const deltaY = event.clientY - this.dragState.originY

    const delta = this.dragState.axis === 'vertical' ? deltaX / width : -deltaY / height
    const nextCoord = Math.max(
      this.dragState.min,
      Math.min(this.dragState.max, this.dragState.coord + delta),
    )

    const updated = this.moveEdge(
      this.graph,
      this.dragState.axis,
      this.dragState.coord,
      nextCoord,
      this.dragState.start,
      this.dragState.end,
    )
    if (!updated) return

    this.applyGraphChange(updated, 'resize')
    this.dragState.coord = nextCoord
    this.dragState.originX = event.clientX
    this.dragState.originY = event.clientY
  }

  /**
   * Finalizes drag operations on pointer release.
   *
   * @param event Pointer event.
   */
  private onPointerUp = (event: PointerEvent): void => {
    if (this.areaDragState) {
      const corner = this.areaDragState.originCorner
      const moved = this.areaDragState.moved ?? false
      if (corner === 'top-left' && !moved) {
        this.emitCornerClick({
          areaId: this.areaDragState.sourceAreaId,
          corner,
          clientX: event.clientX,
          clientY: event.clientY,
        })
      }
      this.finishAreaDrag()
      return
    }
    if (!this.dragState) return
    this.dragState = null
    this.detachDragListeners()
    this.detachKeyListener()
    this.dragSnapshot = null
    if (this.graph) {
      const normalized = this.normalizeGraph(this.graph)
      if (normalized !== this.graph) {
        this.graph = normalized
        this.render()
      }
    }
  }

  /**
   * Handles key presses for drag modifiers and cancel.
   *
   * @param event Keyboard event.
   */
  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Control') {
      if (this.areaDragState) {
        this.areaDragState.swapMode = true
        this.refreshAreaDrag()
      }
      return
    }
    if (event.key !== 'Escape') return
    if (this.areaDragState) {
      event.preventDefault()
      this.cancelAreaDrag()
      return
    }
    if (this.dragState) {
      event.preventDefault()
      this.cancelResizeDrag()
    }
  }

  /**
   * Handles key releases for drag modifiers.
   *
   * @param event Keyboard event.
   */
  private onKeyUp = (event: KeyboardEvent): void => {
    if (event.key !== 'Control') return
    if (!this.areaDragState) return
    this.areaDragState.swapMode = false
    this.refreshAreaDrag()
  }

  /**
   * Cancels an area drag and resets UI state.
   */
  private cancelAreaDrag(): void {
    this.areaDragState = null
    this.hideDropOverlay()
    this.hideJoinShade()
    this.hideDragLabel()
    this.detachDragListeners()
    this.detachKeyListener()
    this.resetDragCursor(true)
    this.lastPointer = null
  }

  /**
   * Cancels a resize drag and restores the snapshot.
   */
  private cancelResizeDrag(): void {
    if (this.dragSnapshot) {
      this.graph = this.dragSnapshot
      this.dragSnapshot = null
      this.render()
    }
    this.dragState = null
    this.detachDragListeners()
    this.detachKeyListener()
  }

  /**
   * Re-evaluates the area drag UI at the last pointer.
   */
  private refreshAreaDrag(): void {
    if (!this.areaDragState || !this.lastPointer) return
    this.updateAreaDragAt(this.lastPointer.x, this.lastPointer.y)
  }

  /**
   * Sets a temporary cursor during drag operations.
   *
   * @param cursor CSS cursor value.
   */
  private setDragCursor(cursor: string): void {
    if (!this.rootEl) return
    if (this.dragCursor === null) {
      this.dragCursor = this.rootEl.style.cursor || ''
    }
    this.rootEl.style.cursor = cursor
  }

  /**
   * Restores the cursor to its previous value.
   *
   * @param force Whether to restore even if no cursor is tracked.
   */
  private resetDragCursor(force = false): void {
    if (!this.rootEl) return
    if (this.dragCursor !== null || force) {
      this.rootEl.style.cursor = this.dragCursor ?? ''
      this.dragCursor = null
    }
  }

  /**
   * Deep clones the graph for safe mutation.
   *
   * @param graph Graph to clone.
   * @returns Cloned graph.
   */
  private cloneGraph(graph: AreasGraph): AreasGraph {
    const verts: AreasGraph['verts'] = {}
    for (const [id, vert] of Object.entries(graph.verts)) {
      verts[id] = { ...vert }
    }
    const edges: AreasGraph['edges'] = {}
    for (const [id, edge] of Object.entries(graph.edges)) {
      edges[id] = { ...edge }
    }
    const areas: AreasGraph['areas'] = {}
    for (const [id, area] of Object.entries(graph.areas)) {
      areas[id] = { ...area }
    }
    return { verts, edges, areas }
  }

  /**
   * Detaches pointer drag listeners.
   */
  private detachDragListeners(): void {
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
  }

  /**
   * Detaches keyboard listeners used during drag.
   */
  private detachKeyListener(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  /**
   * Starts an area drag for move/split/join actions.
   *
   * @param event Pointer event.
   * @param areaId Source area id.
   * @param corner Optional corner id for corner drag.
   */
  private startAreaDrag(event: PointerEvent, areaId: AreaId, corner?: CornerId): void {
    if (!this.rootEl) return
    this.areaDragState = {
      sourceAreaId: areaId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      axis: null,
      swapMode: event.ctrlKey,
      originCorner: corner,
      moved: false,
    }
    if (event.target instanceof HTMLElement) {
      event.target.setPointerCapture(event.pointerId)
    }
    window.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  /**
   * Updates area drag state from a pointer event.
   *
   * @param event Pointer event.
   */
  private updateAreaDrag(event: PointerEvent): void {
    if (!this.rootEl || !this.graph || !this.areaDragState) return
    this.areaDragState.swapMode = event.ctrlKey
    this.updateAreaDragAt(event.clientX, event.clientY)
  }

  /**
   * Updates area drag state at a specific pointer position.
   *
   * @param clientX Pointer X position.
   * @param clientY Pointer Y position.
   */
  private updateAreaDragAt(clientX: number, clientY: number): void {
    if (!this.rootEl || !this.graph || !this.areaDragState) return
    const allowSplit = this.isOperationEnabled('split')
    const allowJoin = this.isOperationEnabled('join')
    const allowMove = this.isOperationEnabled('move')
    const allowReplace = this.isOperationEnabled('replace')
    const allowSwap = this.isOperationEnabled('swap')
    this.lastPointer = { x: clientX, y: clientY }
    const startDx = clientX - this.areaDragState.startX
    const startDy = clientY - this.areaDragState.startY
    if (Math.hypot(startDx, startDy) > CLICK_TOLERANCE_PX) {
      this.areaDragState.moved = true
    }
    const parked = Math.hypot(startDx, startDy) <= DRAG_PARK_TOLERANCE_PX
    if (parked) {
      this.hideDropOverlay()
      this.hideJoinShade()
      this.hideDragLabel()
      this.resetDragCursor()
      return
    }
    const sourceAreaId = this.areaDragState.sourceAreaId
    const hit = this.findAreaAtPoint(clientX, clientY)
    if (!hit) {
      this.hideDropOverlay()
      this.hideJoinShade()
      this.hideDragLabel()
      this.resetDragCursor()
      return
    }

    if (hit.areaId === sourceAreaId) {
      if (!allowSplit) {
        this.hideDropOverlay()
        this.hideJoinShade()
        this.hideDragLabel()
        this.resetDragCursor()
        return
      }
      const canSplitVertical = this.canSplitRect(hit.rect, 'vertical')
      const canSplitHorizontal = this.canSplitRect(hit.rect, 'horizontal')
      if (!canSplitVertical && !canSplitHorizontal) {
        this.hideDropOverlay()
        this.hideDragLabel()
        this.resetDragCursor()
        return
      }

      if (canSplitVertical !== canSplitHorizontal) {
        const axis = canSplitVertical ? 'vertical' : 'horizontal'
        const zone = this.getSplitZoneByAxis(hit.rect, clientX, clientY, axis)
        const overlayRect = this.getSplitOverlayRect(hit.rect, zone, clientX, clientY)
        this.showSplitOverlay(hit, zone, overlayRect)
        this.hideJoinShade()
        this.hideDragLabel()
        this.setDragCursor(axis === 'vertical' ? 'col-resize' : 'row-resize')
        return
      }

      const gesture = this.resolveSplitGesture(this.areaDragState, clientX, clientY)
      if (!gesture) {
        this.hideDropOverlay()
        this.hideDragLabel()
        this.resetDragCursor()
        return
      }
      const zone = this.getSplitZone(hit.rect, clientX, clientY, gesture)
      const overlayRect = this.getSplitOverlayRect(hit.rect, zone, clientX, clientY)
      this.showSplitOverlay(hit, zone, overlayRect)
      this.hideJoinShade()
      this.hideDragLabel()
      this.setDragCursor(gesture.axis === 'vertical' ? 'col-resize' : 'row-resize')
      return
    }

    if (this.areaDragState.swapMode && allowSwap) {
      this.showDropOverlay({ areaId: hit.areaId, rect: hit.rect }, 'center', 'swap', hit.rect)
      this.hideJoinShade()
      this.showDragLabel(clientX, clientY, 'Swap')
      this.setDragCursor('copy')
      this.lastDropTarget = { areaId: hit.areaId, rect: hit.rect, zone: 'center', mode: 'swap' }
      return
    }

    const joinTarget = allowJoin
      ? this.findJoinTargetAtPoint(sourceAreaId, clientX, clientY)
      : null
    if (!joinTarget) {
      if (!allowMove && !allowReplace) {
        this.hideDropOverlay()
        this.hideJoinShade()
        this.hideDragLabel()
        this.resetDragCursor()
        return
      }
      const zone = this.getMoveZone(hit.rect, clientX, clientY)
      if (zone === 'center') {
        this.hideDropOverlay()
        this.hideJoinShade()
        this.hideDragLabel()
        this.resetDragCursor()
        return
      }
      const preview = this.getMovePreview(hit.rect, zone, clientX, clientY)
      if (preview.replace && allowReplace) {
        this.showDropOverlay({ areaId: hit.areaId, rect: hit.rect }, zone, 'replace', hit.rect)
        this.hideJoinShade()
        this.showDragLabel(clientX, clientY, 'Replace')
        this.setDragCursor('alias')
        this.lastDropTarget = { areaId: hit.areaId, rect: hit.rect, zone, mode: 'replace' }
        return
      }
      if (!allowMove) {
        this.hideDropOverlay()
        this.hideJoinShade()
        this.hideDragLabel()
        this.resetDragCursor()
        return
      }
      this.showDropOverlay({ areaId: hit.areaId, rect: hit.rect }, zone, 'move', preview.overlay)
      this.hideJoinShade()
      this.showDragLabel(clientX, clientY, 'Move')
      this.setDragCursor('move')
      this.lastDropTarget = {
        areaId: hit.areaId,
        rect: hit.rect,
        zone,
        mode: 'move',
        moveRect: preview.overlay,
        remainderRect: preview.remainder,
      }
      return
    }

    this.showDropOverlay(
      { areaId: joinTarget.areaId, rect: joinTarget.rect },
      joinTarget.zone,
      'join',
      joinTarget.result,
      joinTarget.direction,
    )
    this.showJoinShade(joinTarget.result, joinTarget.sourceRect, joinTarget.rect)
    this.showDragLabel(clientX, clientY, this.getJoinLabel(joinTarget.direction))
    this.setDragCursor('pointer')
  }

  /**
   * Commits the last area drag action if valid.
   */
  private finishAreaDrag(): void {
    if (!this.areaDragState || !this.graph) return
    const { sourceAreaId } = this.areaDragState
    const lastPointer = this.lastPointer
    const hit = this.lastDropTarget
    this.areaDragState = null
    this.hideDropOverlay()
    this.hideJoinShade()
    this.hideDragLabel()
    this.detachDragListeners()
    this.detachKeyListener()
    this.resetDragCursor(true)
    this.lastPointer = null

    if (!hit) return

    if (hit.mode === 'split') {
      if (!this.isOperationEnabled('split')) {
        return
      }
      if (hit.zone !== 'center') {
        const axis = hit.zone === 'left' || hit.zone === 'right' ? 'vertical' : 'horizontal'
        if (!this.canSplitRect(hit.rect, axis)) {
          return
        }
        this.split(sourceAreaId, hit.zone, lastPointer?.x ?? 0, lastPointer?.y ?? 0)
      }
      return
    }

    if (hit.mode === 'replace') {
      if (!this.isOperationEnabled('replace')) {
        return
      }
      this.replace(sourceAreaId, hit.areaId)
      return
    }

    if (hit.mode === 'move') {
      if (!this.isOperationEnabled('move')) {
        return
      }
      if (!hit.moveRect || !hit.remainderRect) return
      if (hit.zone === 'center') return
      this.move(sourceAreaId, hit.areaId, hit.moveRect, hit.remainderRect)
      return
    }

    if (hit.mode === 'swap') {
      if (!this.isOperationEnabled('swap')) {
        return
      }
      this.swap(sourceAreaId, hit.areaId)
      return
    }

    if (hit.areaId === sourceAreaId) return

    if (hit.zone === 'center') {
      if (!this.isOperationEnabled('swap')) {
        return
      }
      this.swap(sourceAreaId, hit.areaId)
      return
    }

    if (
      hit.zone === 'left' ||
      hit.zone === 'right' ||
      hit.zone === 'top' ||
      hit.zone === 'bottom'
    ) {
      if (!this.isOperationEnabled('join')) {
        return
      }
      this.join(sourceAreaId, hit.areaId)
    }
  }

  /**
   * Tracks the latest drop target preview for area drag.
   */
  private lastDropTarget: {
    areaId: AreaId
    rect: Rect
    zone: 'left' | 'right' | 'top' | 'bottom' | 'center'
    mode: 'join' | 'split' | 'move' | 'replace' | 'swap'
    direction?: 'left' | 'right' | 'up' | 'down'
    result?: Rect
    moveRect?: Rect
    remainderRect?: Rect
  } | null = null

  /**
   * Shows the drop overlay for join/split/move/replace/swap.
   *
   * @param target Target area and rect.
   * @param zone Zone to highlight.
   * @param mode Drop mode being previewed.
   * @param overlayRect Optional overlay rect override.
   * @param direction Optional join direction.
   */
  private showDropOverlay(
    target: { areaId: AreaId; rect: Rect },
    zone: 'left' | 'right' | 'top' | 'bottom' | 'center',
    mode: 'join' | 'split' | 'move' | 'replace' | 'swap',
    overlayRect?: Rect,
    direction?: 'left' | 'right' | 'up' | 'down',
  ): void {
    if (!this.rootEl) return
    const rect = this.rootEl.getBoundingClientRect()
    const width = Math.max(rect.width, 1)
    const height = Math.max(rect.height, 1)
    const zoneRect = overlayRect ?? this.getZoneRect(target.rect, zone, mode)

    if (!this.dropOverlay) {
      this.dropOverlay = document.createElement('div')
      this.dropOverlay.classList.add('sliced-areas-drop')
      this.dropOverlay.setAttribute(INTERNAL_ATTR, 'true')
    }
    if (!this.dropOverlay.isConnected) {
      this.rootEl.appendChild(this.dropOverlay)
    }
    this.dropOverlay.innerHTML = ''

    this.dropOverlay.style.left = `${zoneRect.left * width}px`
    this.dropOverlay.style.top = `${(1 - zoneRect.top) * height}px`
    this.dropOverlay.style.width = `${(zoneRect.right - zoneRect.left) * width}px`
    this.dropOverlay.style.height = `${(zoneRect.top - zoneRect.bottom) * height}px`
    this.dropOverlay.dataset.zone = zone
    this.dropOverlay.dataset.mode = mode
    delete this.dropOverlay.dataset.splitMode
    this.dropOverlay.style.display = 'block'
    this.lastDropTarget = { areaId: target.areaId, rect: target.rect, zone, mode, direction }
  }

  /**
   * Shows a split overlay with both resulting regions.
   *
   * @param target Target area and rect.
   * @param zone Split zone.
   * @param overlayRect Primary overlay rectangle.
   */
  private showSplitOverlay(
    target: { areaId: AreaId; rect: Rect },
    zone: 'left' | 'right' | 'top' | 'bottom' | 'center',
    overlayRect: Rect,
  ): void {
    if (!this.rootEl) return
    const rect = this.rootEl.getBoundingClientRect()
    const width = Math.max(rect.width, 1)
    const height = Math.max(rect.height, 1)

    if (!this.dropOverlay) {
      this.dropOverlay = document.createElement('div')
      this.dropOverlay.classList.add('sliced-areas-drop')
      this.dropOverlay.setAttribute(INTERNAL_ATTR, 'true')
    }
    if (!this.dropOverlay.isConnected) {
      this.rootEl.appendChild(this.dropOverlay)
    }

    this.dropOverlay.style.left = '0px'
    this.dropOverlay.style.top = '0px'
    this.dropOverlay.style.width = `${width}px`
    this.dropOverlay.style.height = `${height}px`
    this.dropOverlay.dataset.zone = 'split'
    this.dropOverlay.dataset.mode = 'split'
    this.dropOverlay.dataset.splitMode = 'true'
    this.dropOverlay.innerHTML = ''

    const primary = overlayRect
    let secondary: Rect
    if (zone === 'left') {
      secondary = {
        left: overlayRect.right,
        right: target.rect.right,
        top: target.rect.top,
        bottom: target.rect.bottom,
      }
    } else if (zone === 'right') {
      secondary = {
        left: target.rect.left,
        right: overlayRect.left,
        top: target.rect.top,
        bottom: target.rect.bottom,
      }
    } else if (zone === 'bottom') {
      secondary = {
        left: target.rect.left,
        right: target.rect.right,
        top: target.rect.top,
        bottom: overlayRect.top,
      }
    } else {
      secondary = {
        left: target.rect.left,
        right: target.rect.right,
        top: overlayRect.bottom,
        bottom: target.rect.bottom,
      }
    }

    for (const rect of [primary, secondary]) {
      const piece = document.createElement('div')
      piece.classList.add('sliced-areas-drop-piece')
      piece.style.left = `${rect.left * width}px`
      piece.style.top = `${(1 - rect.top) * height}px`
      piece.style.width = `${(rect.right - rect.left) * width}px`
      piece.style.height = `${(rect.top - rect.bottom) * height}px`
      this.dropOverlay.appendChild(piece)
    }
    this.dropOverlay.style.display = 'block'
    this.lastDropTarget = { areaId: target.areaId, rect: target.rect, zone, mode: 'split' }
  }

  /**
   * Computes overlay and remainder rectangles for move preview.
   *
   * @param targetRect Target area rectangle.
   * @param zone Move zone.
   * @param clientX Pointer X position.
   * @param clientY Pointer Y position.
   * @returns Overlay and remainder rectangles plus replace flag.
   */
  private getMovePreview(
    targetRect: Rect,
    zone: 'left' | 'right' | 'top' | 'bottom',
    clientX: number,
    clientY: number,
  ): { overlay: Rect; remainder: Rect; replace: boolean } {
    if (!this.rootEl) {
      return { overlay: targetRect, remainder: targetRect, replace: true }
    }
    const bounds = this.rootEl.getBoundingClientRect()
    const x = (clientX - bounds.left) / bounds.width
    const y = 1 - (clientY - bounds.top) / bounds.height
    const snapX = MOVE_SNAP_PX / Math.max(bounds.width, 1)
    const snapY = MOVE_SNAP_PX / Math.max(bounds.height, 1)
    const centerX = (targetRect.left + targetRect.right) / 2
    const centerY = (targetRect.bottom + targetRect.top) / 2
    const targetWidth = targetRect.right - targetRect.left
    const targetHeight = targetRect.top - targetRect.bottom
    const replaceSize = Math.min(targetWidth, targetHeight) * REPLACE_THRESHOLD_RATIO
    const replaceHalf = replaceSize / 2
    const replaceLeft = centerX - replaceHalf
    const replaceRight = centerX + replaceHalf
    const replaceBottom = centerY - replaceHalf
    const replaceTop = centerY + replaceHalf
    const replace = x >= replaceLeft && x <= replaceRight && y >= replaceBottom && y <= replaceTop

    if (zone === 'left' || zone === 'right') {
      let split = zone === 'left' ? 2 * x - targetRect.left : 2 * x - targetRect.right
      if (Math.abs(split - centerX) <= snapX) {
        split = centerX
      }
      split = Math.min(Math.max(split, targetRect.left + MIN_RATIO), targetRect.right - MIN_RATIO)
      const overlay =
        zone === 'left'
          ? { left: targetRect.left, right: split, top: targetRect.top, bottom: targetRect.bottom }
          : { left: split, right: targetRect.right, top: targetRect.top, bottom: targetRect.bottom }
      const remainder =
        zone === 'left'
          ? { left: split, right: targetRect.right, top: targetRect.top, bottom: targetRect.bottom }
          : { left: targetRect.left, right: split, top: targetRect.top, bottom: targetRect.bottom }
      const tooSmall = targetWidth <= MIN_RATIO * 2 + EPS
      const finalReplace = replace || tooSmall
      return {
        overlay: finalReplace ? targetRect : overlay,
        remainder: finalReplace ? targetRect : remainder,
        replace: finalReplace,
      }
    }

    let split = zone === 'bottom' ? 2 * y - targetRect.bottom : 2 * y - targetRect.top
    if (Math.abs(split - centerY) <= snapY) {
      split = centerY
    }
    split = Math.min(Math.max(split, targetRect.bottom + MIN_RATIO), targetRect.top - MIN_RATIO)
    const overlay =
      zone === 'bottom'
        ? { left: targetRect.left, right: targetRect.right, top: split, bottom: targetRect.bottom }
        : { left: targetRect.left, right: targetRect.right, top: targetRect.top, bottom: split }
    const remainder =
      zone === 'bottom'
        ? { left: targetRect.left, right: targetRect.right, top: targetRect.top, bottom: split }
        : { left: targetRect.left, right: targetRect.right, top: split, bottom: targetRect.bottom }
    const tooSmall = targetHeight <= MIN_RATIO * 2 + EPS
    const finalReplace = replace || tooSmall
    return {
      overlay: finalReplace ? targetRect : overlay,
      remainder: finalReplace ? targetRect : remainder,
      replace: finalReplace,
    }
  }

  /**
   * Hides the drop overlay and clears target state.
   */
  private hideDropOverlay(): void {
    if (this.dropOverlay) {
      this.dropOverlay.style.display = 'none'
    }
    this.lastDropTarget = null
  }

  /**
   * Shows shaded regions that would be removed after a join.
   *
   * @param result Resulting rectangle after join.
   * @param sourceRect Source area rectangle.
   * @param targetRect Target area rectangle.
   */
  private showJoinShade(result: Rect, sourceRect: Rect, targetRect: Rect): void {
    if (!this.rootEl) return

    if (!this.dropShade) {
      this.dropShade = document.createElement('div')
      this.dropShade.classList.add('sliced-areas-drop-dim')
      this.dropShade.setAttribute(INTERNAL_ATTR, 'true')
    }
    if (!this.dropShade.isConnected) {
      this.rootEl.appendChild(this.dropShade)
    }

    const rect = this.rootEl.getBoundingClientRect()
    const width = Math.max(rect.width, 1)
    const height = Math.max(rect.height, 1)

    this.dropShade.innerHTML = ''
    const shadeRects = [
      ...this.subtractRect(sourceRect, result),
      ...this.subtractRect(targetRect, result),
    ]
    for (const shade of shadeRects) {
      const piece = document.createElement('div')
      piece.classList.add('sliced-areas-drop-dim-piece')
      piece.style.left = `${shade.left * width}px`
      piece.style.top = `${(1 - shade.top) * height}px`
      piece.style.width = `${(shade.right - shade.left) * width}px`
      piece.style.height = `${(shade.top - shade.bottom) * height}px`
      this.dropShade.appendChild(piece)
    }
    this.dropShade.style.display = shadeRects.length > 0 ? 'block' : 'none'
  }

  /**
   * Hides the join shading overlay.
   */
  private hideJoinShade(): void {
    if (this.dropShade) {
      this.dropShade.style.display = 'none'
    }
  }

  /**
   * Displays a drag label at the pointer.
   *
   * @param clientX Pointer X position.
   * @param clientY Pointer Y position.
   * @param label Label text.
   */
  private showDragLabel(clientX: number, clientY: number, label: string): void {
    if (!this.rootEl) return
    if (!this.dragLabel) {
      this.dragLabel = document.createElement('div')
      this.dragLabel.classList.add('sliced-areas-drag-label')
      this.dragLabel.setAttribute(INTERNAL_ATTR, 'true')
    }
    if (!this.dragLabel.isConnected) {
      this.rootEl.appendChild(this.dragLabel)
    }

    this.dragLabel.textContent = label
    this.dragLabel.style.left = `${clientX}px`
    this.dragLabel.style.top = `${clientY}px`
    this.dragLabel.style.display = 'block'
  }

  /**
   * Hides the drag label.
   */
  private hideDragLabel(): void {
    if (this.dragLabel) {
      this.dragLabel.style.display = 'none'
    }
  }

  /**
   * Returns the split label for a given zone.
   *
   * @param zone Split zone.
   * @returns Label text.
   */
  private getSplitLabel(zone: 'left' | 'right' | 'top' | 'bottom' | 'center'): string {
    if (zone === 'left') return 'Split Left'
    if (zone === 'right') return 'Split Right'
    if (zone === 'top') return 'Split Top'
    if (zone === 'bottom') return 'Split Bottom'
    return 'Split'
  }

  /**
   * Returns the join label for a given direction.
   *
   * @param direction Join direction.
   * @returns Label text.
   */
  private getJoinLabel(direction: 'left' | 'right' | 'up' | 'down'): string {
    if (direction === 'left') return 'Join Left'
    if (direction === 'right') return 'Join Right'
    if (direction === 'up') return 'Join Up'
    return 'Join Down'
  }

  /**
   * Finds a join target under the pointer, if any.
   *
   * @param sourceAreaId Source area id.
   * @param clientX Pointer X position.
   * @param clientY Pointer Y position.
   * @returns Join target details or null.
   */
  private findJoinTargetAtPoint(
    sourceAreaId: AreaId,
    clientX: number,
    clientY: number,
  ): {
    areaId: AreaId
    rect: Rect
    zone: 'left' | 'right' | 'top' | 'bottom'
    direction: 'left' | 'right' | 'up' | 'down'
    overlay: Rect
    result: Rect
    sourceRect: Rect
  } | null {
    if (!this.graph || !this.rootEl) return null
    const sourceArea = this.graph.areas[sourceAreaId]
    if (!sourceArea) return null

    const rect = this.rootEl.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = 1 - (clientY - rect.top) / rect.height

    const sourceRect = this.getAreaRect(this.graph, sourceArea)
    let best: { target: GraphArea; rect: Rect; distance: number; orientation: JoinDir } | null =
      null

    for (const area of Object.values(this.graph.areas)) {
      if (area.id === sourceAreaId) continue
      const targetRect = this.getAreaRect(this.graph, area)
      if (
        x < targetRect.left ||
        x > targetRect.right ||
        y < targetRect.bottom ||
        y > targetRect.top
      ) {
        continue
      }

      const orientation = this.getOrientation(this.graph, sourceArea, area)
      if (orientation === 'none') continue

      if (orientation === 'east' || orientation === 'west') {
        const overlapBottom = Math.max(sourceRect.bottom, targetRect.bottom)
        const overlapTop = Math.min(sourceRect.top, targetRect.top)
        if (y < overlapBottom || y > overlapTop) continue
        const depth = (targetRect.right - targetRect.left) * JOIN_ZONE_DEPTH
        const distance = orientation === 'east' ? x - targetRect.left : targetRect.right - x
        if (distance < 0 || distance > depth) continue
        if (!best || distance < best.distance) {
          best = { target: area, rect: targetRect, distance, orientation }
        }
      } else {
        const overlapLeft = Math.max(sourceRect.left, targetRect.left)
        const overlapRight = Math.min(sourceRect.right, targetRect.right)
        if (x < overlapLeft || x > overlapRight) continue
        const depth = (targetRect.top - targetRect.bottom) * JOIN_ZONE_DEPTH
        const distance = orientation === 'north' ? y - targetRect.bottom : targetRect.top - y
        if (distance < 0 || distance > depth) continue
        if (!best || distance < best.distance) {
          best = { target: area, rect: targetRect, distance, orientation }
        }
      }
    }

    if (!best) return null

    const orientation = best.orientation
    const zone =
      orientation === 'east'
        ? 'left'
        : orientation === 'west'
          ? 'right'
          : orientation === 'north'
            ? 'bottom'
            : 'top'
    const direction =
      orientation === 'east'
        ? 'right'
        : orientation === 'west'
          ? 'left'
          : orientation === 'north'
            ? 'up'
            : 'down'
    const overlay = this.getJoinOverlayRect(sourceRect, best.rect, orientation)
    const result = this.getJoinResultRect(sourceRect, best.rect, orientation)

    return { areaId: best.target.id, rect: best.rect, zone, direction, overlay, result, sourceRect }
  }

  /**
   * Computes the overlay rectangle for a join preview.
   *
   * @param source Source area rectangle.
   * @param target Target area rectangle.
   * @param orientation Orientation between the areas.
   * @returns Overlay rectangle.
   */
  private getJoinOverlayRect(source: Rect, target: Rect, orientation: JoinDir): Rect {
    const overlapBottom = Math.max(source.bottom, target.bottom)
    const overlapTop = Math.min(source.top, target.top)
    const overlapLeft = Math.max(source.left, target.left)
    const overlapRight = Math.min(source.right, target.right)

    if (orientation === 'east') {
      return { left: target.left, right: target.right, top: overlapTop, bottom: overlapBottom }
    }
    if (orientation === 'west') {
      return { left: target.left, right: target.right, top: overlapTop, bottom: overlapBottom }
    }
    if (orientation === 'north') {
      return { left: overlapLeft, right: overlapRight, top: target.top, bottom: target.bottom }
    }
    return { left: overlapLeft, right: overlapRight, top: target.top, bottom: target.bottom }
  }

  /**
   * Computes the resulting rectangle of a join.
   *
   * @param source Source area rectangle.
   * @param target Target area rectangle.
   * @param orientation Orientation between the areas.
   * @returns Result rectangle.
   */
  private getJoinResultRect(source: Rect, target: Rect, orientation: JoinDir): Rect {
    const overlapBottom = Math.max(source.bottom, target.bottom)
    const overlapTop = Math.min(source.top, target.top)
    const overlapLeft = Math.max(source.left, target.left)
    const overlapRight = Math.min(source.right, target.right)

    if (orientation === 'east' || orientation === 'west') {
      return {
        left: Math.min(source.left, target.left),
        right: Math.max(source.right, target.right),
        top: overlapTop,
        bottom: overlapBottom,
      }
    }

    return {
      left: overlapLeft,
      right: overlapRight,
      top: Math.max(source.top, target.top),
      bottom: Math.min(source.bottom, target.bottom),
    }
  }

  /**
   * Subtracts a rectangle from another and returns remaining pieces.
   *
   * @param outer Outer rectangle.
   * @param inner Inner rectangle to subtract.
   * @returns Remaining rectangles.
   */
  private subtractRect(outer: Rect, inner: Rect): Rect[] {
    const overlapLeft = Math.max(outer.left, inner.left)
    const overlapRight = Math.min(outer.right, inner.right)
    const overlapBottom = Math.max(outer.bottom, inner.bottom)
    const overlapTop = Math.min(outer.top, inner.top)

    if (overlapLeft >= overlapRight || overlapBottom >= overlapTop) {
      return [outer]
    }

    const rects: Rect[] = []
    if (outer.top > overlapTop) {
      rects.push({ left: outer.left, right: outer.right, top: outer.top, bottom: overlapTop })
    }
    if (outer.bottom < overlapBottom) {
      rects.push({ left: outer.left, right: outer.right, top: overlapBottom, bottom: outer.bottom })
    }
    if (outer.left < overlapLeft) {
      rects.push({ left: outer.left, right: overlapLeft, top: overlapTop, bottom: overlapBottom })
    }
    if (outer.right > overlapRight) {
      rects.push({ left: overlapRight, right: outer.right, top: overlapTop, bottom: overlapBottom })
    }

    return rects
  }

  /**
   * Finds the area under the given pointer coordinates.
   *
   * @param clientX Pointer X position.
   * @param clientY Pointer Y position.
   * @returns Area id and rect or null when not found.
   */
  private findAreaAtPoint(clientX: number, clientY: number): { areaId: AreaId; rect: Rect } | null {
    if (!this.rootEl || !this.graph) return null
    const rect = this.rootEl.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = 1 - (clientY - rect.top) / rect.height

    for (const area of Object.values(this.graph.areas)) {
      const areaRect = this.getAreaRect(this.graph, area)
      if (x >= areaRect.left && x <= areaRect.right && y >= areaRect.bottom && y <= areaRect.top) {
        return { areaId: area.id, rect: areaRect }
      }
    }

    return null
  }

  /**
   * Resolves the move zone inside a rectangle by pointer position.
   *
   * @param rect Target rectangle.
   * @param clientX Pointer X position.
   * @param clientY Pointer Y position.
   * @returns Move zone.
   */
  private getMoveZone(
    rect: Rect,
    clientX: number,
    clientY: number,
  ): 'left' | 'right' | 'top' | 'bottom' | 'center' {
    if (!this.rootEl) return 'center'
    const bounds = this.rootEl.getBoundingClientRect()
    const x = (clientX - bounds.left) / bounds.width
    const y = 1 - (clientY - bounds.top) / bounds.height
    const relX = (x - rect.left) / Math.max(rect.right - rect.left, EPS)
    const relY = (y - rect.bottom) / Math.max(rect.top - rect.bottom, EPS)

    if (relY >= relX && relY >= 1 - relX) return 'top'
    if (relY <= relX && relY <= 1 - relX) return 'bottom'
    if (relY >= relX && relY <= 1 - relX) return 'left'
    return 'right'
  }

  /**
   * Determines split axis from a drag gesture.
   *
   * @param state Area drag state.
   * @param clientX Pointer X position.
   * @param clientY Pointer Y position.
   * @returns Gesture axis or null when undecided.
   */
  private resolveSplitGesture(
    state: AreaDragState,
    clientX: number,
    clientY: number,
  ): { axis: SplitAxis } | null {
    const fromStartDx = clientX - state.startX
    const fromStartDy = clientY - state.startY
    const absStartDx = Math.abs(fromStartDx)
    const absStartDy = Math.abs(fromStartDy)

    if (!state.axis) {
      if (Math.max(absStartDx, absStartDy) < SPLIT_GESTURE_THRESHOLD_PX) return null
      if (absStartDx - absStartDy >= SPLIT_AXIS_TOLERANCE_PX) {
        state.axis = 'vertical'
      } else if (absStartDy - absStartDx >= SPLIT_AXIS_TOLERANCE_PX) {
        state.axis = 'horizontal'
      } else {
        return null
      }
    } else {
      const dx = clientX - state.lastX
      const dy = clientY - state.lastY
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      if (Math.max(absDx, absDy) >= SPLIT_GESTURE_THRESHOLD_PX) {
        if (state.axis === 'vertical' && absDy - absDx >= SPLIT_AXIS_TOLERANCE_PX) {
          state.axis = 'horizontal'
        } else if (state.axis === 'horizontal' && absDx - absDy >= SPLIT_AXIS_TOLERANCE_PX) {
          state.axis = 'vertical'
        }
      }
    }

    state.lastX = clientX
    state.lastY = clientY

    return { axis: state.axis }
  }

  /**
   * Determines the split zone from a resolved gesture.
   *
   * @param rect Target rectangle.
   * @param clientX Pointer X position.
   * @param clientY Pointer Y position.
   * @param gesture Resolved split gesture.
   * @returns Split zone.
   */
  private getSplitZone(
    rect: Rect,
    clientX: number,
    clientY: number,
    gesture: { axis: SplitAxis },
  ): 'left' | 'right' | 'top' | 'bottom' {
    if (!this.rootEl) return gesture.axis === 'vertical' ? 'right' : 'top'
    const bounds = this.rootEl.getBoundingClientRect()
    const x = (clientX - bounds.left) / bounds.width
    const y = 1 - (clientY - bounds.top) / bounds.height
    const relX = (x - rect.left) / Math.max(rect.right - rect.left, EPS)
    const relY = (y - rect.bottom) / Math.max(rect.top - rect.bottom, EPS)
    const factorV = relY
    const factorH = relX
    const isLeft = factorV < 0.5
    const isBottom = factorH < 0.5
    const isRight = !isLeft
    const isTop = !isBottom

    let factor = gesture.axis === 'horizontal' ? factorH : factorV
    if ((isTop && isLeft) || (isBottom && isRight)) {
      factor = 1 - factor
    }

    if (gesture.axis === 'vertical') {
      return factor > 0.5 ? 'right' : 'left'
    }
    return factor > 0.5 ? 'top' : 'bottom'
  }

  /**
   * Determines the split zone given a fixed axis.
   *
   * @param rect Target rectangle.
   * @param clientX Pointer X position.
   * @param clientY Pointer Y position.
   * @param axis Split axis.
   * @returns Split zone.
   */
  private getSplitZoneByAxis(
    rect: Rect,
    clientX: number,
    clientY: number,
    axis: SplitAxis,
  ): 'left' | 'right' | 'top' | 'bottom' {
    if (!this.rootEl) return axis === 'vertical' ? 'right' : 'top'
    const bounds = this.rootEl.getBoundingClientRect()
    const x = (clientX - bounds.left) / bounds.width
    const y = 1 - (clientY - bounds.top) / bounds.height
    const relX = (x - rect.left) / Math.max(rect.right - rect.left, EPS)
    const relY = (y - rect.bottom) / Math.max(rect.top - rect.bottom, EPS)

    if (axis === 'vertical') {
      return relX < 0.5 ? 'left' : 'right'
    }
    return relY < 0.5 ? 'bottom' : 'top'
  }

  /**
   * Checks if a rectangle can be split along an axis.
   *
   * @param rect Target rectangle.
   * @param axis Split axis.
   * @returns True when split is possible.
   */
  private canSplitRect(rect: Rect, axis: SplitAxis): boolean {
    const width = rect.right - rect.left
    const height = rect.top - rect.bottom

    if (axis === 'vertical') {
      return width > MIN_RATIO * 2
    }
    return height > MIN_RATIO * 2
  }

  /**
   * Returns the zone rectangle for previews.
   *
   * @param rect Target rectangle.
   * @param zone Zone to extract.
   * @param mode Drop mode.
   * @returns Zone rectangle.
   */
  private getZoneRect(
    rect: Rect,
    zone: 'left' | 'right' | 'top' | 'bottom' | 'center',
    mode: 'join' | 'split' | 'move' | 'replace' | 'swap',
  ): Rect {
    const threshold = mode === 'join' ? 0.25 : 0.5
    if (zone === 'left') {
      return {
        left: rect.left,
        right: rect.left + (rect.right - rect.left) * threshold,
        top: rect.top,
        bottom: rect.bottom,
      }
    }
    if (zone === 'right') {
      return {
        left: rect.right - (rect.right - rect.left) * threshold,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      }
    }
    if (zone === 'bottom') {
      return {
        left: rect.left,
        right: rect.right,
        top: rect.bottom + (rect.top - rect.bottom) * threshold,
        bottom: rect.bottom,
      }
    }
    if (zone === 'top') {
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.top - (rect.top - rect.bottom) * threshold,
      }
    }
    return rect
  }

  /**
   * Computes the overlay rectangle for a split preview.
   *
   * @param rect Target rectangle.
   * @param zone Split zone.
   * @param clientX Pointer X position.
   * @param clientY Pointer Y position.
   * @returns Overlay rectangle.
   */
  private getSplitOverlayRect(
    rect: Rect,
    zone: 'left' | 'right' | 'top' | 'bottom' | 'center',
    clientX: number,
    clientY: number,
  ): Rect {
    if (!this.rootEl) return rect
    const bounds = this.rootEl.getBoundingClientRect()
    const x = (clientX - bounds.left) / bounds.width
    const y = 1 - (clientY - bounds.top) / bounds.height
    const clampedX = Math.min(Math.max(x, rect.left + MIN_RATIO), rect.right - MIN_RATIO)
    const clampedY = Math.min(Math.max(y, rect.bottom + MIN_RATIO), rect.top - MIN_RATIO)

    if (zone === 'left') {
      return { left: rect.left, right: clampedX, top: rect.top, bottom: rect.bottom }
    }
    if (zone === 'right') {
      return { left: clampedX, right: rect.right, top: rect.top, bottom: rect.bottom }
    }
    if (zone === 'bottom') {
      return { left: rect.left, right: rect.right, top: clampedY, bottom: rect.bottom }
    }
    if (zone === 'top') {
      return { left: rect.left, right: rect.right, top: rect.top, bottom: clampedY }
    }
    return rect
  }

  /**
   * Moves all connected vertices on an edge to a new coordinate.
   *
   * @param graph Graph to update.
   * @param axis Axis of movement.
   * @param fromCoord Current coordinate.
   * @param toCoord Target coordinate.
   * @param rangeStart Range start.
   * @param rangeEnd Range end.
   * @returns Updated graph or null when no movement.
   */
  private moveEdge(
    graph: AreasGraph,
    axis: SplitAxis,
    fromCoord: number,
    toCoord: number,
    rangeStart: number,
    rangeEnd: number,
  ): AreasGraph | null {
    if (Math.abs(fromCoord - toCoord) <= EPS) return null

    const next: AreasGraph = {
      verts: { ...graph.verts },
      edges: { ...graph.edges },
      areas: { ...graph.areas },
    }

    const connected = this.collectConnectedVerts(next, axis, fromCoord, rangeStart, rangeEnd)
    for (const vertId of connected) {
      const vert = next.verts[vertId]
      if (!vert) continue
      if (axis === 'vertical') {
        vert.x = toCoord
      } else {
        vert.y = toCoord
      }
    }

    return next
  }

  /**
   * Computes min/max bounds for a draggable edge segment.
   *
   * @param graph Graph to inspect.
   * @param axis Axis of the edge.
   * @param coord Edge coordinate.
   * @param rangeStart Segment start.
   * @param rangeEnd Segment end.
   * @returns Bounds or null when invalid.
   */
  private getEdgeDragBounds(
    graph: AreasGraph,
    axis: SplitAxis,
    coord: number,
    rangeStart: number,
    rangeEnd: number,
  ): { min: number; max: number } | null {
    let min = 0
    let max = 1
    const start = Math.min(rangeStart, rangeEnd) - EPS
    const end = Math.max(rangeStart, rangeEnd) + EPS
    let hasMatch = false

    for (const area of Object.values(graph.areas)) {
      const rect = this.getAreaRect(graph, area)
      if (axis === 'vertical') {
        const overlaps = rect.bottom <= end && rect.top >= start
        if (!overlaps) continue
        if (Math.abs(rect.right - coord) <= EPS) {
          min = Math.max(min, rect.left + MIN_RATIO)
          hasMatch = true
        }
        if (Math.abs(rect.left - coord) <= EPS) {
          max = Math.min(max, rect.right - MIN_RATIO)
          hasMatch = true
        }
      } else {
        const overlaps = rect.left <= end && rect.right >= start
        if (!overlaps) continue
        if (Math.abs(rect.top - coord) <= EPS) {
          min = Math.max(min, rect.bottom + MIN_RATIO)
          hasMatch = true
        }
        if (Math.abs(rect.bottom - coord) <= EPS) {
          max = Math.min(max, rect.top - MIN_RATIO)
          hasMatch = true
        }
      }
    }

    if (!hasMatch || min >= max) return null
    return { min, max }
  }

  /**
   * Computes the rectangle for a graph area.
   *
   * @param graph Graph containing the area.
   * @param area Area to compute.
   * @returns Normalized rectangle.
   */
  private getAreaRect(graph: AreasGraph, area: GraphArea): Rect {
    const v1 = graph.verts[area.v1]
    const v2 = graph.verts[area.v2]
    const v3 = graph.verts[area.v3]
    const v4 = graph.verts[area.v4]
    if (!v1 || !v2 || !v3 || !v4) {
      throw new Error(`Invalid area vertices for ${area.id}`)
    }

    return {
      left: Math.min(v1.x, v2.x, v3.x, v4.x),
      right: Math.max(v1.x, v2.x, v3.x, v4.x),
      bottom: Math.min(v1.y, v2.y, v3.y, v4.y),
      top: Math.max(v1.y, v2.y, v3.y, v4.y),
    }
  }

  /**
   * Adds a vertex to the vertex map.
   *
   * @param verts Vertex map to update.
   * @param x X coordinate.
   * @param y Y coordinate.
   * @returns New vertex id.
   */
  private addVert(verts: Record<VertId, GraphVert>, x: number, y: number): VertId {
    const id = this.nextVertId(verts)
    verts[id] = { id, x, y }
    return id
  }

  /**
   * Adds an edge to the edge map.
   *
   * @param edges Edge map to update.
   * @param v1 First vertex id.
   * @param v2 Second vertex id.
   * @returns New edge id.
   */
  private addEdge(edges: Record<EdgeId, GraphEdge>, v1: VertId, v2: VertId): EdgeId {
    const id = this.nextEdgeId(edges)
    edges[id] = { id, v1, v2, border: false }
    return id
  }

  /**
   * Generates the next unique vertex id.
   *
   * @param verts Existing vertex map.
   * @returns Unique vertex id.
   */
  private nextVertId(verts: Record<VertId, GraphVert>): VertId {
    let id = ''
    do {
      this.vertCounter += 1
      id = `v${this.vertCounter}`
    } while (verts[id])
    return id
  }

  /**
   * Generates the next unique edge id.
   *
   * @param edges Existing edge map.
   * @returns Unique edge id.
   */
  private nextEdgeId(edges: Record<EdgeId, GraphEdge>): EdgeId {
    let id = ''
    do {
      this.edgeCounter += 1
      id = `e${this.edgeCounter}`
    } while (edges[id])
    return id
  }

  /**
   * Generates the next unique area id.
   *
   * @returns Unique area id.
   */
  private nextAreaId(): AreaId {
    let id = ''
    do {
      this.areaCounter += 1
      id = `area-${this.areaCounter}`
    } while (this.graph?.areas[id] || this.querySelector(`[data-area-id="${id}"]`))
    return id
  }

  /**
   * Normalizes the graph and fills any holes.
   *
   * @param graph Graph to normalize.
   * @returns Normalized graph.
   */
  private normalizeGraph(graph: AreasGraph): AreasGraph {
    const normalized = this.normalizeGraphInternal(graph)
    const filled = this.fillHoles(normalized)
    return this.normalizeGraphInternal(filled)
  }

  /**
   * Normalizes vertices and edges by merging duplicates.
   *
   * @param graph Graph to normalize.
   * @returns Normalized graph.
   */
  private normalizeGraphInternal(graph: AreasGraph): AreasGraph {
    const vertKey = (vert: GraphVert) => `${vert.x.toFixed(6)}|${vert.y.toFixed(6)}`
    const vertMap = new Map<string, VertId>()
    const remap: Record<VertId, VertId> = {}
    const verts: Record<VertId, GraphVert> = {}

    for (const vert of Object.values(graph.verts)) {
      const key = vertKey(vert)
      const existing = vertMap.get(key)
      if (existing) {
        remap[vert.id] = existing
      } else {
        vertMap.set(key, vert.id)
        verts[vert.id] = { ...vert }
      }
    }

    const edges: Record<EdgeId, GraphEdge> = {}
    const edgeMap = new Map<string, EdgeId>()

    for (const edge of Object.values(graph.edges)) {
      const v1 = remap[edge.v1] ?? edge.v1
      const v2 = remap[edge.v2] ?? edge.v2
      const ordered = v1 < v2 ? `${v1}|${v2}` : `${v2}|${v1}`
      if (edgeMap.has(ordered)) continue
      const id = this.nextEdgeId(edges)
      edges[id] = { id, v1, v2, border: edge.border }
      edgeMap.set(ordered, id)
    }

    const areas: Record<AreaId, GraphArea> = {}
    for (const area of Object.values(graph.areas)) {
      areas[area.id] = {
        id: area.id,
        v1: remap[area.v1] ?? area.v1,
        v2: remap[area.v2] ?? area.v2,
        v3: remap[area.v3] ?? area.v3,
        v4: remap[area.v4] ?? area.v4,
      }
    }

    const usedEdges = new Set<EdgeId>()
    const areaEdges = new Set<string>()
    for (const area of Object.values(areas)) {
      const pairs: [VertId, VertId][] = [
        [area.v1, area.v2],
        [area.v2, area.v3],
        [area.v3, area.v4],
        [area.v4, area.v1],
      ]
      for (const [a, b] of pairs) {
        areaEdges.add(a < b ? `${a}|${b}` : `${b}|${a}`)
      }
    }

    for (const edge of Object.values(edges)) {
      const key = edge.v1 < edge.v2 ? `${edge.v1}|${edge.v2}` : `${edge.v2}|${edge.v1}`
      if (areaEdges.has(key)) {
        usedEdges.add(edge.id)
      }
    }

    const filteredEdges: Record<EdgeId, GraphEdge> = {}
    for (const edge of Object.values(edges)) {
      if (usedEdges.has(edge.id)) {
        filteredEdges[edge.id] = edge
      }
    }

    const usedVerts = new Set<VertId>()
    for (const edge of Object.values(filteredEdges)) {
      usedVerts.add(edge.v1)
      usedVerts.add(edge.v2)
    }

    const filteredVerts: Record<VertId, GraphVert> = {}
    for (const vert of Object.values(verts)) {
      if (usedVerts.has(vert.id)) {
        filteredVerts[vert.id] = vert
      }
    }

    return { verts: filteredVerts, edges: filteredEdges, areas }
  }

  /**
   * Attempts to fill any uncovered holes in the layout.
   *
   * @param graph Graph to update.
   * @returns Graph with holes filled.
   */
  private fillHoles(graph: AreasGraph): AreasGraph {
    let next = graph
    let guard = 0
    while (guard < 50) {
      const holes = this.findHoleCells(next)
      if (holes.length === 0) {
        const overlaps = this.findOverlaps(next)
        if (overlaps.length > 0) {
          this.throwOverlapError(next, overlaps)
        }
        return next
      }

      let progress = false
      for (const hole of holes) {
        const plan = this.findHoleFillPlan(next, hole)
        if (!plan) {
          const aligned = this.tryAlignHoleNeighbors(next, hole)
          if (aligned.changed) {
            next = aligned.graph
            progress = true
            break
          }
          continue
        }
        for (const neighbor of plan.neighbors) {
          const merged = this.expandRectIntoHole(neighbor.rect, hole, plan.side)
          next = this.setAreaRect(next, neighbor.areaId, merged)
        }
        progress = true
      }

      if (!progress) {
        this.throwHoleError(next, holes)
      }

      guard += 1
    }

    this.throwHoleError(next, this.findHoleCells(next))
  }

  /**
   * Finds uncovered grid cells in the layout.
   *
   * @param graph Graph to inspect.
   * @returns Hole rectangles.
   */
  private findHoleCells(graph: AreasGraph): Rect[] {
    const rects = Object.values(graph.areas).map((area) => this.getAreaRect(graph, area))
    const xs = this.collectAxisCoords(rects, 'x')
    const ys = this.collectAxisCoords(rects, 'y')
    const holes: Rect[] = []

    for (let xi = 0; xi < xs.length - 1; xi += 1) {
      const left = xs[xi]
      const right = xs[xi + 1]
      if (left === undefined || right === undefined) continue
      for (let yi = 0; yi < ys.length - 1; yi += 1) {
        const bottom = ys[yi]
        const top = ys[yi + 1]
        if (bottom === undefined || top === undefined) continue
        const cell: Rect = { left, right, bottom, top }
        if (cell.right - cell.left <= EPS || cell.top - cell.bottom <= EPS) continue
        if (!this.isCellCovered(rects, cell)) {
          holes.push(cell)
        }
      }
    }

    return this.mergeHoleCells(holes)
  }

  /**
   * Collects and de-duplicates axis coordinates for grid scan.
   *
   * @param rects Rectangles to inspect.
   * @param axis Axis to collect.
   * @returns Sorted coordinates.
   */
  private collectAxisCoords(rects: Rect[], axis: 'x' | 'y'): number[] {
    const coords: number[] = [0, 1]
    for (const rect of rects) {
      if (axis === 'x') {
        coords.push(rect.left, rect.right)
      } else {
        coords.push(rect.bottom, rect.top)
      }
    }
    coords.sort((a, b) => a - b)
    const merged: number[] = []
    for (const value of coords) {
      const last = merged[merged.length - 1]
      if (last === undefined || Math.abs(value - last) > ALIGN_TOLERANCE) {
        merged.push(value)
      }
    }
    return merged
  }

  /**
   * Merges adjacent hole cells into larger rectangles.
   *
   * @param cells Hole cells to merge.
   * @returns Merged hole rectangles.
   */
  private mergeHoleCells(cells: Rect[]): Rect[] {
    const merged = [...cells]
    let changed = true
    while (changed) {
      changed = false
      outer: for (let i = 0; i < merged.length; i += 1) {
        for (let j = i + 1; j < merged.length; j += 1) {
          const a = merged[i]
          const b = merged[j]
          if (!a || !b) continue
          const canMergeVertical =
            Math.abs(a.left - b.left) <= ALIGN_TOLERANCE &&
            Math.abs(a.right - b.right) <= ALIGN_TOLERANCE &&
            (Math.abs(a.top - b.bottom) <= ALIGN_TOLERANCE ||
              Math.abs(b.top - a.bottom) <= ALIGN_TOLERANCE)
          const canMergeHorizontal =
            Math.abs(a.bottom - b.bottom) <= ALIGN_TOLERANCE &&
            Math.abs(a.top - b.top) <= ALIGN_TOLERANCE &&
            (Math.abs(a.right - b.left) <= ALIGN_TOLERANCE ||
              Math.abs(b.right - a.left) <= ALIGN_TOLERANCE)

          if (canMergeVertical || canMergeHorizontal) {
            const mergedRect: Rect = {
              left: Math.min(a.left, b.left),
              right: Math.max(a.right, b.right),
              bottom: Math.min(a.bottom, b.bottom),
              top: Math.max(a.top, b.top),
            }
            merged.splice(j, 1)
            merged.splice(i, 1, mergedRect)
            changed = true
            break outer
          }
        }
      }
    }

    return merged
  }

  /**
   * Attempts to align neighbors to cover a hole.
   *
   * @param graph Graph to update.
   * @param hole Hole rectangle.
   * @returns Updated graph and change flag.
   */
  private tryAlignHoleNeighbors(
    graph: AreasGraph,
    hole: Rect,
  ): { graph: AreasGraph; changed: boolean } {
    let next = graph
    let changed = false
    const sides: Array<'west' | 'east' | 'south' | 'north'> = ['west', 'east', 'south', 'north']

    for (const side of sides) {
      const neighbors = this.collectAdjacentNeighbors(next, hole, side)
      for (const neighbor of neighbors) {
        const result = this.alignNeighborToHole(next, neighbor.areaId, hole, side)
        if (result.changed) {
          next = result.graph
          changed = true
        }
      }
    }

    return { graph: next, changed }
  }

  /**
   * Collects adjacent neighbors along one side of a hole.
   *
   * @param graph Graph to inspect.
   * @param hole Hole rectangle.
   * @param side Side to check.
   * @returns Neighbor areas and rectangles.
   */
  private collectAdjacentNeighbors(
    graph: AreasGraph,
    hole: Rect,
    side: 'west' | 'east' | 'south' | 'north',
  ): Array<{ areaId: AreaId; rect: Rect }> {
    const neighbors: Array<{ areaId: AreaId; rect: Rect }> = []
    for (const area of Object.values(graph.areas)) {
      const rect = this.getAreaRect(graph, area)
      if (side === 'west') {
        if (Math.abs(rect.right - hole.left) > ALIGN_TOLERANCE) continue
        const overlap = Math.min(rect.top, hole.top) - Math.max(rect.bottom, hole.bottom)
        if (overlap <= EPS) continue
        neighbors.push({ areaId: area.id, rect })
      } else if (side === 'east') {
        if (Math.abs(rect.left - hole.right) > ALIGN_TOLERANCE) continue
        const overlap = Math.min(rect.top, hole.top) - Math.max(rect.bottom, hole.bottom)
        if (overlap <= EPS) continue
        neighbors.push({ areaId: area.id, rect })
      } else if (side === 'south') {
        if (Math.abs(rect.top - hole.bottom) > ALIGN_TOLERANCE) continue
        const overlap = Math.min(rect.right, hole.right) - Math.max(rect.left, hole.left)
        if (overlap <= EPS) continue
        neighbors.push({ areaId: area.id, rect })
      } else {
        if (Math.abs(rect.bottom - hole.top) > ALIGN_TOLERANCE) continue
        const overlap = Math.min(rect.right, hole.right) - Math.max(rect.left, hole.left)
        if (overlap <= EPS) continue
        neighbors.push({ areaId: area.id, rect })
      }
    }

    return neighbors
  }

  /**
   * Splits or trims a neighbor to align with a hole.
   *
   * @param graph Graph to update.
   * @param areaId Neighbor area id.
   * @param hole Hole rectangle.
   * @param side Side of the hole.
   * @returns Updated graph and change flag.
   */
  private alignNeighborToHole(
    graph: AreasGraph,
    areaId: AreaId,
    hole: Rect,
    side: 'west' | 'east' | 'south' | 'north',
  ): { graph: AreasGraph; changed: boolean } {
    let next = graph
    let changed = false
    let area = next.areas[areaId]
    if (!area) return { graph: next, changed }
    let rect = this.getAreaRect(next, area)

    if (side === 'west' || side === 'east') {
      if (rect.bottom < hole.bottom - ALIGN_TOLERANCE) {
        const newId = this.nextAreaId()
        const split = this.splitAreaAt(next, areaId, 'horizontal', hole.bottom, newId, 'max')
        if (split) {
          next = split
          this.ensureAreaNode(newId, areaId, true)
          changed = true
          area = next.areas[areaId]
          if (!area) return { graph: next, changed }
          rect = this.getAreaRect(next, area)
        }
      }
      if (rect.top > hole.top + ALIGN_TOLERANCE) {
        const newId = this.nextAreaId()
        const split = this.splitAreaAt(next, areaId, 'horizontal', hole.top, newId, 'min')
        if (split) {
          next = split
          this.ensureAreaNode(newId, areaId, true)
          changed = true
        }
      }
    } else {
      if (rect.left < hole.left - ALIGN_TOLERANCE) {
        const newId = this.nextAreaId()
        const split = this.splitAreaAt(next, areaId, 'vertical', hole.left, newId, 'max')
        if (split) {
          next = split
          this.ensureAreaNode(newId, areaId, true)
          changed = true
          area = next.areas[areaId]
          if (!area) return { graph: next, changed }
          rect = this.getAreaRect(next, area)
        }
      }
      if (rect.right > hole.right + ALIGN_TOLERANCE) {
        const newId = this.nextAreaId()
        const split = this.splitAreaAt(next, areaId, 'vertical', hole.right, newId, 'min')
        if (split) {
          next = split
          this.ensureAreaNode(newId, areaId, true)
          changed = true
        }
      }
    }

    return { graph: next, changed }
  }

  /**
   * Checks if a cell is covered by any rectangle.
   *
   * @param rects Rectangles to check.
   * @param cell Cell rectangle.
   * @returns True when covered.
   */
  private isCellCovered(rects: Rect[], cell: Rect): boolean {
    const cx = (cell.left + cell.right) / 2
    const cy = (cell.bottom + cell.top) / 2
    for (const rect of rects) {
      if (
        cx >= rect.left - ALIGN_TOLERANCE &&
        cx <= rect.right + ALIGN_TOLERANCE &&
        cy >= rect.bottom - ALIGN_TOLERANCE &&
        cy <= rect.top + ALIGN_TOLERANCE
      ) {
        return true
      }
    }
    return false
  }

  /**
   * Finds a plan to fill a hole by expanding neighbors.
   *
   * @param graph Graph to inspect.
   * @param hole Hole rectangle.
   * @returns Fill plan or null when impossible.
   */
  private findHoleFillPlan(
    graph: AreasGraph,
    hole: Rect,
  ): {
    side: 'west' | 'east' | 'north' | 'south'
    neighbors: Array<{ areaId: AreaId; rect: Rect }>
  } | null {
    const candidates = [
      this.collectHoleNeighbors(graph, hole, 'west'),
      this.collectHoleNeighbors(graph, hole, 'east'),
      this.collectHoleNeighbors(graph, hole, 'south'),
      this.collectHoleNeighbors(graph, hole, 'north'),
    ]

    for (const candidate of candidates) {
      if (!candidate) continue
      if (this.isHoleSideCovered(hole, candidate.side, candidate.segments)) {
        return { side: candidate.side, neighbors: candidate.neighbors }
      }
    }

    return null
  }

  /**
   * Collects neighbor areas that fully cover one side of a hole.
   *
   * @param graph Graph to inspect.
   * @param hole Hole rectangle.
   * @param side Side to check.
   * @returns Neighbor data or null when none found.
   */
  private collectHoleNeighbors(
    graph: AreasGraph,
    hole: Rect,
    side: 'west' | 'east' | 'north' | 'south',
  ): {
    side: 'west' | 'east' | 'north' | 'south'
    neighbors: Array<{ areaId: AreaId; rect: Rect }>
    segments: Array<{ start: number; end: number }>
  } | null {
    const neighbors: Array<{ areaId: AreaId; rect: Rect }> = []
    const segments: Array<{ start: number; end: number }> = []

    for (const area of Object.values(graph.areas)) {
      const rect = this.getAreaRect(graph, area)
      if (side === 'west') {
        if (Math.abs(rect.right - hole.left) > ALIGN_TOLERANCE) continue
        if (rect.bottom < hole.bottom - ALIGN_TOLERANCE || rect.top > hole.top + ALIGN_TOLERANCE)
          continue
        const start = Math.max(rect.bottom, hole.bottom)
        const end = Math.min(rect.top, hole.top)
        if (end - start <= EPS) continue
        neighbors.push({ areaId: area.id, rect })
        segments.push({ start, end })
      } else if (side === 'east') {
        if (Math.abs(rect.left - hole.right) > ALIGN_TOLERANCE) continue
        if (rect.bottom < hole.bottom - ALIGN_TOLERANCE || rect.top > hole.top + ALIGN_TOLERANCE)
          continue
        const start = Math.max(rect.bottom, hole.bottom)
        const end = Math.min(rect.top, hole.top)
        if (end - start <= EPS) continue
        neighbors.push({ areaId: area.id, rect })
        segments.push({ start, end })
      } else if (side === 'south') {
        if (Math.abs(rect.top - hole.bottom) > ALIGN_TOLERANCE) continue
        if (rect.left < hole.left - ALIGN_TOLERANCE || rect.right > hole.right + ALIGN_TOLERANCE)
          continue
        const start = Math.max(rect.left, hole.left)
        const end = Math.min(rect.right, hole.right)
        if (end - start <= EPS) continue
        neighbors.push({ areaId: area.id, rect })
        segments.push({ start, end })
      } else {
        if (Math.abs(rect.bottom - hole.top) > ALIGN_TOLERANCE) continue
        if (rect.left < hole.left - ALIGN_TOLERANCE || rect.right > hole.right + ALIGN_TOLERANCE)
          continue
        const start = Math.max(rect.left, hole.left)
        const end = Math.min(rect.right, hole.right)
        if (end - start <= EPS) continue
        neighbors.push({ areaId: area.id, rect })
        segments.push({ start, end })
      }
    }

    if (neighbors.length === 0) return null
    return { side, neighbors, segments }
  }

  /**
   * Checks whether a hole side is fully covered by segments.
   *
   * @param hole Hole rectangle.
   * @param side Side to check.
   * @param segments Coverage segments.
   * @returns True when side is covered.
   */
  private isHoleSideCovered(
    hole: Rect,
    side: 'west' | 'east' | 'north' | 'south',
    segments: Array<{ start: number; end: number }>,
  ): boolean {
    const spanStart = side === 'west' || side === 'east' ? hole.bottom : hole.left
    const spanEnd = side === 'west' || side === 'east' ? hole.top : hole.right
    const merged = this.mergeSegments(segments)
    if (merged.length === 0) return false
    const first = merged[0]
    if (!first) return false
    if (first.start > spanStart + ALIGN_TOLERANCE) return false
    let coverageEnd = first.end
    for (let i = 1; i < merged.length; i += 1) {
      const segment = merged[i]
      if (!segment) continue
      if (segment.start > coverageEnd + ALIGN_TOLERANCE) return false
      coverageEnd = Math.max(coverageEnd, segment.end)
    }
    return coverageEnd >= spanEnd - ALIGN_TOLERANCE
  }

  /**
   * Merges overlapping or touching segments.
   *
   * @param segments Segments to merge.
   * @returns Merged segments.
   */
  private mergeSegments(
    segments: Array<{ start: number; end: number }>,
  ): Array<{ start: number; end: number }> {
    const sorted = segments
      .map((seg) => ({ start: Math.min(seg.start, seg.end), end: Math.max(seg.start, seg.end) }))
      .sort((a, b) => a.start - b.start)
    const merged: Array<{ start: number; end: number }> = []
    for (const seg of sorted) {
      const last = merged[merged.length - 1]
      if (!last || seg.start > last.end + ALIGN_TOLERANCE) {
        merged.push({ ...seg })
      } else {
        last.end = Math.max(last.end, seg.end)
      }
    }
    return merged
  }

  /**
   * Expands a rectangle into a hole from a given side.
   *
   * @param rect Neighbor rectangle.
   * @param hole Hole rectangle.
   * @param side Side to expand from.
   * @returns Expanded rectangle.
   */
  private expandRectIntoHole(
    rect: Rect,
    hole: Rect,
    side: 'west' | 'east' | 'north' | 'south',
  ): Rect {
    if (side === 'west') {
      return { ...rect, right: hole.right }
    }
    if (side === 'east') {
      return { ...rect, left: hole.left }
    }
    if (side === 'south') {
      return { ...rect, top: hole.top }
    }
    return { ...rect, bottom: hole.bottom }
  }

  /**
   * Detects overlapping areas in the graph.
   *
   * @param graph Graph to inspect.
   * @returns List of overlaps.
   */
  private findOverlaps(graph: AreasGraph): Array<{ a: AreaId; b: AreaId; rect: Rect }> {
    const areas = Object.values(graph.areas)
    const overlaps: Array<{ a: AreaId; b: AreaId; rect: Rect }> = []
    for (let i = 0; i < areas.length; i += 1) {
      const areaA = areas[i]
      if (!areaA) continue
      const rectA = this.getAreaRect(graph, areaA)
      for (let j = i + 1; j < areas.length; j += 1) {
        const areaB = areas[j]
        if (!areaB) continue
        const rectB = this.getAreaRect(graph, areaB)
        const left = Math.max(rectA.left, rectB.left)
        const right = Math.min(rectA.right, rectB.right)
        const bottom = Math.max(rectA.bottom, rectB.bottom)
        const top = Math.min(rectA.top, rectB.top)
        if (right - left > ALIGN_TOLERANCE && top - bottom > ALIGN_TOLERANCE) {
          overlaps.push({ a: areaA.id, b: areaB.id, rect: { left, right, bottom, top } })
        }
      }
    }
    return overlaps
  }

  /**
   * Throws a detailed error for overlapping areas.
   *
   * @param graph Graph containing overlaps.
   * @param overlaps Overlap data.
   * @throws Error when overlaps are found.
   */
  private throwOverlapError(
    graph: AreasGraph,
    overlaps: Array<{ a: AreaId; b: AreaId; rect: Rect }>,
  ): never {
    const detail = {
      overlaps: overlaps.map((item) => ({
        a: item.a,
        b: item.b,
        rect: this.formatRect(item.rect),
      })),
      areas: Object.values(graph.areas).map((area) => ({
        id: area.id,
        rect: this.formatRect(this.getAreaRect(graph, area)),
      })),
    }
    throw new Error(`Overlapping areas detected in layout: ${JSON.stringify(detail)}`)
  }

  /**
   * Throws a detailed error for unfillable holes.
   *
   * @param graph Graph containing holes.
   * @param holes Hole rectangles.
   * @throws Error when holes are found.
   */
  private throwHoleError(graph: AreasGraph, holes: Rect[]): never {
    const detail = {
      holes: holes.map((hole) => this.formatRect(hole)),
      areas: Object.values(graph.areas).map((area) => ({
        id: area.id,
        rect: this.formatRect(this.getAreaRect(graph, area)),
      })),
    }
    throw new Error(`Unfillable hole(s) detected in layout: ${JSON.stringify(detail)}`)
  }

  /**
   * Formats a rectangle to fixed precision for diagnostics.
   *
   * @param rect Rectangle to format.
   * @returns Formatted rectangle.
   */
  private formatRect(rect: Rect): { left: number; right: number; top: number; bottom: number } {
    return {
      left: Number(rect.left.toFixed(6)),
      right: Number(rect.right.toFixed(6)),
      top: Number(rect.top.toFixed(6)),
      bottom: Number(rect.bottom.toFixed(6)),
    }
  }

  /**
   * Collects vertices connected along a straight edge segment.
   *
   * @param graph Graph to inspect.
   * @param axis Axis of the edge.
   * @param coord Edge coordinate.
   * @param rangeStart Segment start.
   * @param rangeEnd Segment end.
   * @returns Set of connected vertex ids.
   */
  private collectConnectedVerts(
    graph: AreasGraph,
    axis: SplitAxis,
    coord: number,
    rangeStart: number,
    rangeEnd: number,
  ): Set<VertId> {
    const min = Math.min(rangeStart, rangeEnd) - EPS
    const max = Math.max(rangeStart, rangeEnd) + EPS
    const isOnAxis = (vert: GraphVert) =>
      axis === 'vertical' ? Math.abs(vert.x - coord) <= EPS : Math.abs(vert.y - coord) <= EPS
    const isInRange = (vert: GraphVert) =>
      axis === 'vertical' ? vert.y >= min && vert.y <= max : vert.x >= min && vert.x <= max

    const queue: VertId[] = []
    const visited = new Set<VertId>()

    for (const vert of Object.values(graph.verts)) {
      if (isOnAxis(vert) && isInRange(vert)) {
        queue.push(vert.id)
        visited.add(vert.id)
      }
    }

    if (queue.length === 0) return visited

    const edges = Object.values(graph.edges)
    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) continue

      for (const edge of edges) {
        if (edge.v1 !== current && edge.v2 !== current) continue
        const v1 = graph.verts[edge.v1]
        const v2 = graph.verts[edge.v2]
        if (!v1 || !v2) continue

        if (!isOnAxis(v1) || !isOnAxis(v2)) continue

        const nextVert = edge.v1 === current ? edge.v2 : edge.v1
        if (visited.has(nextVert)) continue
        visited.add(nextVert)
        queue.push(nextVert)
      }
    }

    return visited
  }
}

/**
 * Registers the custom element when not already defined.
 */
export const registerSlicedAreasElement = () => {
  if (!customElements.get('sliced-areas')) {
    customElements.define('sliced-areas', SlicedAreasElement)
  }
}

registerSlicedAreasElement()

/**
 * Global tag name mapping for the custom element.
 */
declare global {
  interface HTMLElementTagNameMap {
    'sliced-areas': SlicedAreasElement
  }
}
