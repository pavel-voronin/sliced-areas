import { SlicedAreasElement } from '../src/plugin/sliced-areas'
import '../src/plugin/sliced-areas'

export type Rect = { left: number; right: number; top: number; bottom: number }

const makeDomRect = (width: number, height: number) => ({
  x: 0,
  y: 0,
  left: 0,
  top: 0,
  right: width,
  bottom: height,
  width,
  height,
  toJSON: () => ({}),
})

const mockBounds = (el: Element, width = 100, height = 100) => {
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => makeDomRect(width, height),
    configurable: true,
  })
}

export const setupElement = (): SlicedAreasElement => {
  const el = document.createElement('sliced-areas') as SlicedAreasElement
  document.body.appendChild(el)
  let root = el.querySelector('.sliced-areas-root')
  if (!root) {
    ;(el as unknown as { connectedCallback: () => void }).connectedCallback()
    root = el.querySelector('.sliced-areas-root')
  }
  if (root) {
    mockBounds(root)
  }
  mockBounds(el)
  return el
}

export const setResolver = (el: SlicedAreasElement) => {
  el.setResolver((tag, areaId?: string) => {
    const node = document.createElement('div')
    node.textContent = tag
    if (areaId) {
      node.dataset.testAreaId = areaId
    }
    return node
  })
}

export const layoutSingle = () => ({
  areas: [{ tag: 'main', rect: { left: 0, right: 1, top: 1, bottom: 0 } }],
})

export const layoutTwoVertical = () => ({
  areas: [
    { tag: 'left', rect: { left: 0, right: 0.5, top: 1, bottom: 0 } },
    { tag: 'right', rect: { left: 0.5, right: 1, top: 1, bottom: 0 } },
  ],
})

export const layoutTwoHorizontal = () => ({
  areas: [
    { tag: 'top', rect: { left: 0, right: 1, top: 1, bottom: 0.5 } },
    { tag: 'bottom', rect: { left: 0, right: 1, top: 0.5, bottom: 0 } },
  ],
})

export const layoutFourQuadrants = () => ({
  areas: [
    { tag: 'tl', rect: { left: 0, right: 0.5, top: 1, bottom: 0.5 } },
    { tag: 'tr', rect: { left: 0.5, right: 1, top: 1, bottom: 0.5 } },
    { tag: 'bl', rect: { left: 0, right: 0.5, top: 0.5, bottom: 0 } },
    { tag: 'br', rect: { left: 0.5, right: 1, top: 0.5, bottom: 0 } },
  ],
})
