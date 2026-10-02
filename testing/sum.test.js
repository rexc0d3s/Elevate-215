import {test, expect} from 'vitest'
import {sum} from './sum.js'

test('adds 2 + 3 to get 5', () => {
expect(sum(2, 3)).toBe(5)
})
