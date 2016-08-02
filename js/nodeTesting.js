// Area for testing components
'use strict'
const Phyzzy = require('./phyzzy/phyzzy.js')
const Mass = require('./phyzzy/components/mass.js')
const Vect = require('./phyzzy/components/vector.js')
const Environment = require('./phyzzy/components/environment.js')
const Vector = (x, y) => new Vect(x, y)

const ph = Phyzzy(100)
const bounds = {x: 0, y: 0, w: 5, h: 5}
const env = Environment({x: 0, y: -9.81}, 0.3, bounds)
const m1 = Mass(0.5, 0.05, 0.8, 0.8, 0.6, {x: 5, y: 5})
const m2 = Mass(0.5, 0.05, 0.8, 0.8, 0.6, {x: 5, y: 5})

ph.addM(m1)
ph.addM(m2)

const F = env.weight(ph.m[0])

ph.m[0].update(F, 1 / 10)

console.log(ph.m[0].Pi, ph.m[1].Pi)
console.log(env)
