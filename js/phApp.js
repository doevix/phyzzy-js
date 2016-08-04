// phyzzy main webapp
'use strict'
const Phyzzy = require('./phyzzy/phyzzy.js')
const Mass = require('./phyzzy/components/mass.js')
const Environment = require('./phyzzy/components/environment.js')

const viewport = document.getElementById('viewport')
const ctx = viewport.getContext('2d')

const ph = Phyzzy(100)
const env = Environment({x: 0, y: 9.81}, 0.1, {x: 0, y: 0, w: 5, h: 5})
const m1 = Mass(
        {mass: 0.5, rad: 0.05, refl: 0.75, mu_s: 0.8, mu_k: 0.4},
        {x: 2.5, y: 0.05},
        {x: 2.4, y: 0.05}
    )
let delta = 1 / 50 // step frequency

ph.addM(m1)

const frame = () => {
    ctx.clearRect(0, 0, viewport.width, viewport.height)
    ph.draw(ctx, '#1DB322')
    
    ph.collision(ph.m.map(mass => env.boundaryHit(mass, delta) ))
    ph.verlet(ph.m.map(mass => {
        let f = env.weight(mass).sum(env.drag(mass, delta))
        return f.sum(env.friction(mass, f, delta))
    }), delta)
    ctx.fillStyle = '#000000'
    ctx.fillText(m1.Pi.sub(m1.Po).div(delta).display(5), 5, 495)

    window.requestAnimationFrame(frame)
}

frame();