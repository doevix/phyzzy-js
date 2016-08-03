// phyzzy main webapp
'use strict'
const Phyzzy = require('./js/phyzzy/phyzzy.js')
const Mass = require('./js/phyzzy/components/mass.js')
const Environment = require('./js/phyzzy/components/environment.js')

const viewport = document.getElementById('viewport')
const ctx = viewport.getContext('2d')

const ph = Phyzzy(100)
const env = Environment({x: 0, y: 9.81}, 0.3, {x: 0, y: 0, w: 5, h: 5})
const m1 = Mass(0.5, 0.05, 0.4, 0.8, 0.6, {x: 2.5, y: 0.05})
let delta = 1 / 50 // step increment

ph.addM(m1)

const frame = () => {
    ctx.clearRect(0, 0, viewport.width, viewport.height)
    ph.draw(ctx)

    ph.verlet(ph.m.map(mass => {
        return env.weight(mass).sum(env.drag(mass, delta))
    }), delta)
    ph.wallHit(ph.m.map(mass => env.boundaryHit(mass, delta) ))
    window.requestAnimationFrame(frame)
}

frame();