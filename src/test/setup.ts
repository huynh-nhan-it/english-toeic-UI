import * as matchers from '@testing-library/jest-dom/matchers'
import { expect } from 'vitest'

expect.extend(matchers)

const globalExpect = (globalThis as any).expect
if (globalExpect && globalExpect !== expect) {
  globalExpect.extend(matchers)
}
