import { describe, expect, it } from 'vitest'
import { registerSlicedAreasElement, SlicedAreasElement } from '../src/plugin/index'

describe('plugin index exports', () => {
  it('exposes the custom element registration helper', () => {
    expect(typeof registerSlicedAreasElement).toBe('function')
  })

  it('exports the element class', () => {
    const el = new SlicedAreasElement()
    expect(el).toBeInstanceOf(HTMLElement)
  })
})
