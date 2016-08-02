// phyzzy main webapp
'use strict'
const Phyzzy = require('./phyzzy/phyzzy.js')
const Mass = require('./phyzzy/components/mass.js')
const Vect = require('./phyzzy/components/vector.js')
const Environment = require('./phyzzy/components/environment.js')
const Vector = (x, y) => new Vect(x, y)


const viewport = document.getElementById('viewport')
const ctx = viewport.getContext('2d')

const ph = Phyzzy(100)
const env = Environment({x: 0, y: 9.81}, 0.2, {x: 0, y: 0, w: 5, h: 5})
const m1 = Mass(0.5, 0.05, 0.8, 0.8, 0.6, {x: 2.5, y: 0.05})

ph.addM(m1)
ph.draw(ctx)