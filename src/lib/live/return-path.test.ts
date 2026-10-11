import { describe, expect, it } from 'vitest'
import { safeReturnPath } from './return-path'

describe('Rücksprungadresse', () => {
  it('nimmt Wege innerhalb der App an', () => {
    expect(safeReturnPath('/live')).toBe('/live')
    expect(safeReturnPath('/units/abc-123')).toBe('/units/abc-123')
  })

  it('weist alles ab, was aus der App herausführt', () => {
    expect(safeReturnPath('https://example.com')).toBeUndefined()
    expect(safeReturnPath('//example.com')).toBeUndefined()
    expect(safeReturnPath('/\\example.com')).toBeUndefined()
    expect(safeReturnPath('javascript:alert(1)')).toBeUndefined()
    expect(safeReturnPath('live')).toBeUndefined()
  })

  it('weist fehlende und mehrfache Angaben ab', () => {
    expect(safeReturnPath(undefined)).toBeUndefined()
    expect(safeReturnPath(['/live', '/units'])).toBeUndefined()
    expect(safeReturnPath('')).toBeUndefined()
  })
})
