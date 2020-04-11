// phyzzy main webapp
// mainly used for testing
'use strict'
const Phyzzy = require('./js/phyzzy/engine.js')
const Mass = require('./js/phyzzy/components/mass.js')
const Spring = require('./js/phyzzy/components/spring.js')
const Environment = require('./js/phyzzy/components/environment.js')
const User = require('./js/phyzzy/user.js')
const Builders = require('./js/phyzzy/builders.js')
const extraForces = require('./js/phyzzy/extraForces')

const viewport = document.getElementById('viewport')
const ctx = viewport.getContext('2d')
const pauseButton = document.getElementById('userPause')
let pause = pauseButton.value === 'pause' ? false : true
pauseButton.addEventListener('click', e => {
    if (!pause) {
        pause = true
        pauseButton.value = 'play'
    } else {
        pause = false
        pauseButton.value = 'pause'
    }
}, false)


let delta = 1 / 50 // step time
const ph = Phyzzy(100)

const env = Environment(
    {x: 0, y: 9.81},
    1,
    {x: 0, y: 0, w: viewport.width / ph.scale, h: viewport.height / ph.scale}
)

const mouse = User.Mouser(ph.scale)

mouse.init(viewport, ph)

const mPropA = {mass: 0.1, rad: 0.05, refl: 0.7, mu_s: 0.4, mu_k: 0.2}
const mPropB = {mass: 0.5, rad: 0.05, refl: 0.7, mu_s: 0.4, mu_k: 0.2}

Builders.generateBox(1, 1, 1, 1, mPropA, 100, 50, ph)
Builders.generateBox(2, 2, 1, 1, mPropA, 100, 50, ph)
Builders.generateBox(3.5, 4.5, 1, 1, mPropB, 500, 250, ph)
Builders.generateBox(0.05, 4.5, 1, 1, mPropB, 500, 250, ph)

Builders.generateLine({x: 1, y: 1}, {x: 1.5, y: 1.5}, mPropA, 100, 50, ph)



ph.mesh[16].fixed = true

for (let i = 0; i < 20; i++) {
    let m = Mass(mPropA,
        {x: Math.random() * env.boundary.w, y: Math.random() * env.boundary.h},
        {x: Math.random() * env.boundary.w, y: Math.random() * env.boundary.h}
    )
    ph.addM(m)
}

const frame = (frameTime) => {
    ctx.clearRect(0, 0, viewport.width, viewport.height)
    ph.drawSpring(ctx, '#000000')
    ph.drawMass(ctx, '#1DB322')
    mouse.hover(ph, ctx, '#1DB322')
    mouse.select(ctx)
    if (!pause){
        ph.verlet(ph.mesh.map(mass => {
            let f = env.weight(mass).sum(env.drag(mass))
            .sum(mass.springing()).sum(mass.damping())
            f = f.sum(env.friction(mass, f))
            f = mass !== mouse.dragging() ? f : f.mul(0)
            if (mass.fixed) f.clr();
            return f
        }), delta)
        ph.collision(ph.mesh.map(mass => env.boundaryHit(mass)))
    }

    mouse.dragMass(pause)

    ctx.fillStyle = '#000000'
    ctx.fillText(mouse.coord().display(2), 20, 20)
    ctx.fillText('mousedown ' + mouse.isDown(), 20, 30)

    window.requestAnimationFrame(frame)
}

frame();