// polyfill.js
import { Buffer } from 'buffer'
import { install } from 'react-native-quick-crypto'

install()

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer
}

const toSharedBuffer = (value) => Buffer.from(value.buffer, value.byteOffset, value.byteLength)
const needsUint8ArrayBufferCompat =
  typeof Uint8Array.prototype.readUIntLE !== 'function' ||
  Uint8Array.of(65).toString('utf8') !== 'A'

if (needsUint8ArrayBufferCompat) {
  const compatMethods = Object.getOwnPropertyNames(Buffer.prototype).filter((name) => {
    const descriptor = Object.getOwnPropertyDescriptor(Buffer.prototype, name)
    return typeof descriptor?.value === 'function' && (/^(read|write)/.test(name) || name === 'toString')
  })

  for (const methodName of compatMethods) {
    Object.defineProperty(Uint8Array.prototype, methodName, {
      configurable: true,
      writable: true,
      value(...args) {
        return Buffer.prototype[methodName].apply(toSharedBuffer(this), args)
      },
    })
  }
}
