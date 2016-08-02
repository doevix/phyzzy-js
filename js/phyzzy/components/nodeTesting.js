// Area for testing components
'use strict'
const Vect = require('./vector.js')
const Mass = require('./mass.js')

const Vector = (x, y) => new Vect(x, y) // just a wrapper to avoid 'new' keyword.

const m = Mass(0.5, 0.05, 0.8, 0.8, 0.6, Vector(5, 5))
const F = m.weight(Vector(0, -9.81))
console.log(m)
console.log(F)
m.update(F, 1 / 10)
m.update(F, 1 / 10)
console.log(m)
