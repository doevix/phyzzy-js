// phyzzy.js
// Engine.
// Manages, simulates, and draws mesh to canvas.
'use strict'

const Vect = require('./components/vector.js')
const Mass = require('./components/mass.js')
// wrapper to avoid 'new' keyword
const Vector = (x, y) => new Vect(x, y)

const AddToMesh = state => ({
    addM: mass => state.m.push(mass),
    addS: (mass1, mass2, spring) => {
        // links two masses with a spring
        if (mass1 !== mass2 && !mass1.branch.find(b => b.m === mass2)) {
            // cannot link a mass to itself nor have two springs in link
            mass1.branch.push({m: mass2, s: spring})
            mass2.branch.push({m: mass1, s: spring})
        }
    }
})

const CanvasDraw = state => ({
    drawMass: (ctx, colorM) => {
        state.m.forEach(mass => {
            ctx.beginPath()
            ctx.arc (
                mass.Pi.x * state.scale,
                mass.Pi.y * state.scale,
                mass.rad * state.scale,
                0, Math.PI * 2, false
            )
            ctx.fillStyle = colorM || '#000000'
            ctx.fill()
            ctx.closePath()
        })
    },
    drawSpring: (ctx, colorS) => {
        const traces = []
        state.m.forEach(mass => {
            mass.branch.forEach(b => {
                ctx.beginPath()
                ctx.moveTo (
                    mass.Pi.x * state.scale,
                    mass.Pi.y * state.scale
                )
                ctx.lineTo (
                    b.m.Pi.x * state.scale,
                    b.m.Pi.y * state.scale
                )
                ctx.strokeStyle = colorS || '#000000'
                ctx.stroke()
                ctx.closePath()
                traces.push({m1: mass, m2: b.m})
            })   
        })
        console.log(traces)
    }
})

const CanvasHighlight = state => ({
    highlightMass: (mIdx, padding, ctx, color) => {
        ctx.beginPath()
        ctx.arc(
            state.m[mIdx].Pi.x * state.scale,
            state.m[mIdx].Pi.y * state.scale,
            state.m[mIdx].rad * state.scale + padding,
            0, Math.PI * 2, false
        )
        ctx.strokeStyle = color || '#000000'
        ctx.stroke()
        ctx.closePath()
    }
})

const Integrator = state => ({
    verlet: (forces, dt) => {
        // verlet integrator
        const forcesIter = forces[Symbol.iterator]()
        state.m.forEach(mass => {
            // Pi+1 = Pi + (Pi - Po) + (accel)*(dt^2)
            let accel = forcesIter.next().value.div(mass.mass)
            let delta_Pi = mass.Pi.sub(mass.Po).sum(accel.mul(dt * dt))
            mass.Po.equ(mass.Pi)
            mass.Pi.sumTo(delta_Pi)
        })
    }
})

const Collider = state => ({
    collision: collCoord => {
        const collCoordIter = collCoord[Symbol.iterator]()
        state.m.forEach(mass => {
            let cC_current = collCoordIter.next().value
            if (!mass.Po.equChk(cC_current.Po) || !mass.Pi.equChk(cC_current.Pi)) {
                mass.Po.equ(cC_current.Po)
                mass.Pi.equ(cC_current.Pi)
            }
        })
    }
})

const Phyzzy = (scale) => {
    let state = {
        scale: scale, // size of 1 meter in pixels
        play: false, // false = paused, true = playing
        m: [],
        s: []
    }
    return Object.assign(
        {},
        state,
        AddToMesh(state),
        Integrator(state),
        Collider(state),
        CanvasDraw(state),
        CanvasHighlight(state)
    )
}

module.exports = Phyzzy