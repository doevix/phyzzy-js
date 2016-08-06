// Area for testing components
'use strict'
const Phyzzy = require('./phyzzy/engine.js')
const Mass = require('./phyzzy/components/mass.js')
const Spring = require('./phyzzy/components/spring.js')
const Vect = require('./phyzzy/components/vector.js')
const Environment = require('./phyzzy/components/environment.js')
const Vector = (x, y) => new Vect(x, y)

const ph = Phyzzy(100)
const bounds = {x: 0, y: 0, w: 5, h: 5}
const env = Environment({x: 0, y: -9.81}, 0.3, bounds)
const m1 = Mass(
        {mass: 0.5, rad: 0.05, refl: 0.75, mu_s: 0.8, mu_k: 0.4},
        {x: 1, y: 0.05},
        {x: 2.4, y: 0.05}
    )
const m2 = Mass(
        {mass: 0.5, rad: 0.05, refl: 0.75, mu_s: 0.8, mu_k: 0.4},
        {x: 2, y: 0.05},
        {x: 2.6, y: 0.05}
    )
const m3 = Mass(
        {mass: 0.5, rad: 0.05, refl: 0.75, mu_s: 0.8, mu_k: 0.4},
        {x: 5, y: 2},
        {x: 5, y: 2}
    )
const s1 = Spring(3, 100, 0)
const s2 = Spring(3, 100, 0)
const s3 = Spring(3, 100, 0)

const ctx = {
    moveTo: (x, y) => console.log("moveTo: x =", x, 'y =', y),
    lineTo: (x, y) => console.log("lineTo: x =", x, 'y =', y),
    stroke: () => console.log('line drawn'),
    beginPath: () => console.log('path open'),
    closePath: () => console.log('path closed\n'),
    strokeStyle: '#000000'
}

ph.addM(m1)
ph.addM(m2)
ph.addM(m3)
ph.addS(m1, m2, s1)
ph.addS(m2, m3, s2)
ph.addS(m3, m1, s3)

ph.drawSpring(ctx)