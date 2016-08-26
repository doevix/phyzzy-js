// phyzzy main webapp
'use strict'
const Phyzzy = require('./js/phyzzy/engine.js')
const Mass = require('./js/phyzzy/components/mass.js')
const Spring = require('./js/phyzzy/components/spring.js')
const Environment = require('./js/phyzzy/components/environment.js')
const User = require('./js/user.js')
const Builders = require('./js/builders.js')
const extraForces = require('./js/extraForces')

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
    0,
    {x: 0, y: 0, w: viewport.width / ph.scale, h: viewport.height / ph.scale}
)

const mouse = User.Mouser(ph.scale)

mouse.init(viewport, ph)

const mProp = {mass: 0.1, rad: 0.05, refl: 0.75, mu_s: 0.5, mu_k: 0.4, q: 1}
const mProp2 = {mass: 0.1, rad: 0.05, refl: 0.75, mu_s: 0.5, mu_k: 0.4, q: -1}
Builders.generateBox(1, 1, 2, 2, mProp, 100, 50, ph)
Builders.generateBox(2.5, 2.5, 3, 3, mProp, 100, 50, ph)
Builders.generateTriangle(2, 2, 1, 1, mProp, 100, 50, ph)
Builders.generateTriangle(2, 2, 1, -Math.sqrt(3) * 1 / 2, mProp, 100, 50, ph)

const genRand = (x, y, w, h) => ({x: Math.random() * w, y: Math.random() * h})

for (let i = 0; i < 10; i++) {
    ph.addM(
        Mass(mProp2, genRand(0, 0, 5, 5), genRand(0, 0, 5, 5)))
}

const frame = (frameTime) => {
    ctx.clearRect(0, 0, viewport.width, viewport.height)

    ph.drawSpring(ctx, '#000000')
    ph.drawMass(ctx, '#1DB322')
    mouse.hover(ph, ctx, '#1DB322')
    mouse.select(ctx)
    if (!pause){
        ph.verlet(ph.mesh.map(mass => {
            let f = env.weight(mass)
            .sum(env.drag(mass, delta))
            .sum(mass.springing())
            .sum(mass.damping())
            .sum(extraForces.Coulomb(mass, ph.mesh, 1))
            f = f.sum(env.friction(mass, f))
            f = mass !== mouse.dragging() ? f : f.mul(0)
            // the following are drawing functions for visualizing F and V
            f.canvasDraw(mass.Pi, ph.scale, 0.1, ctx, '#FF5555')
            mass.vel(delta).canvasDraw(mass.Pi, ph.scale, 0.1, ctx, '#7777FF')
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