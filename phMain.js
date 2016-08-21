// phyzzy main webapp
'use strict'
const Phyzzy = require('./js/phyzzy/engine.js')
const Mass = require('./js/phyzzy/components/mass.js')
const Spring = require('./js/phyzzy/components/spring.js')
const Environment = require('./js/phyzzy/components/environment.js')
const User = require('./js/user.js')
const Builders = require('./js/builders.js')


const viewport = document.getElementById('viewport')
const ctx = viewport.getContext('2d')
let delta = 1 / 50 // step time

const ph = Phyzzy(100)

const env = Environment(
    {x: 0, y: 9.81},
    0,
    {x: 0, y: 0, w: viewport.width / ph.scale, h: viewport.height / ph.scale}
)

const mouse = User.Mouser(ph.scale)

mouse.init(viewport, ph)

const mProp = {mass: 0.1, rad: 0.05, refl: 0.75, mu_s: 0.5, mu_k: 0.4}
Builders.generateBox(1, 1, 2, 2, mProp, 100, 50, ph)
Builders.generateBox(2.5, 2.5, 3, 3, mProp, 100, 50, ph)
Builders.generateTriangle(2, 2, 1, 1, mProp, 100, 50, ph)
Builders.generateTriangle(2, 2, 1, -Math.sqrt(3) * 1 / 2, mProp, 100, 50, ph)

const frame = (frameTime) => {
    ctx.clearRect(0, 0, viewport.width, viewport.height)

    ph.drawSpring(ctx, '#000000')
    ph.drawMass(ctx, '#1DB322')
    mouse.hover(ph, ctx, '#1DB322')
    mouse.select(ctx)
    let meshForce = ph.m.map(mass => {
        let f = env.weight(mass)
        .sum(env.drag(mass, delta))
        .sum(mass.springing())
        .sum(mass.damping())
        f = f.sum(env.friction(mass, f))
        f = mass !== mouse.dragging() ? f : f.mul(0)
        // the following are drawing functions for visualizing F and V
        f.canvasDraw(mass.Pi, ph.scale, 0.1, ctx, '#FF5555')
        mass.vel(delta).canvasDraw(mass.Pi, ph.scale, 0.1, ctx, '#7777FF')
        return f
    })
    ph.verlet(meshForce, delta)
    ph.collision(ph.m.map(mass => env.boundaryHit(mass)))

    mouse.dragMass(ph)

    ctx.fillStyle = '#000000'
    ctx.fillText(mouse.coord().display(2), 20, 20)
    ctx.fillText('mousedown ' + mouse.isDown(), 20, 30)

    window.requestAnimationFrame(frame)
}

frame();