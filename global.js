// global.js

if (typeof global === 'undefined') {
    global = globalThis;
  }
  
  // Añade esta nueva condición para GLOBAL en mayúsculas
  if (typeof GLOBAL === 'undefined') {
    GLOBAL = globalThis;
  }