// engine.js
// Phyzzy engine.
// Manages, simulates, and draws mesh to canvas.
'use strict'

const AddToMesh = state => ({
    addM: mass => {
        // adds a new mass
        if (!state.mesh.find(m => m === mass)) {
            // each new mass added must be unique
            state.mesh.push(mass)
        }
    },
    addS: (mass1, mass2, spring) => {
        // links two masses with a spring
        if (mass1 !== mass2 && !mass1.branch.find(b => b.m === mass2)) {
            // cannot link a mass to itself nor have two springs in link
            mass1.branch.push({m: mass2, s: spring})
            mass2.branch.push({m: mass1, s: spring})
        }
    }
})

const DelFromMesh = state => ({
    remM: mass => {

    },
    remS: spring => {

    }
})

const CanvasDraw = state => ({
    drawMass: (ctx, colorM) => {
        state.mesh.forEach(mass => {
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
        state.mesh.forEach(mass => {
            mass.branch.forEach(b => {
                const wasTraced = traces.find(t => b.m === t.m1 && mass === t.m2 || b.m === t.m2 && mass === t.m1)
                if (!wasTraced) {
                    // mesh is non-linear, traces must be tracked to avoid repetition
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
                }
            })   
        })
    }
})

const Integrator = state => ({
    verlet: (forces, dt) => { // verlet integrator
        // Array.map() recommended for obtaining force array
        const forcesIter = forces[Symbol.iterator]()//= forces.values()
        state.mesh.forEach(mass => {
            const accel = forcesIter.next().value.div(mass.mass)
            const delta_Pi = mass.Pi.sub(mass.Po).sum(accel.mul(dt * dt))
            mass.Po.equ(mass.Pi)
            mass.Pi.sumTo(delta_Pi)
        })
    }
})

const Collider = state => ({
    collision: collCoord => {
        const collCoordIter = collCoord[Symbol.iterator]()// collCoord.values()
        state.mesh.forEach(mass => {
            let cC_current = collCoordIter.next().value
            if (!mass.Po.equChk(cC_current.Po) || !mass.Pi.equChk(cC_current.Pi)) {
                // change coordinates only when collisions have indicated it.
                mass.Po.equ(cC_current.Po)
                mass.Pi.equ(cC_current.Pi)
            }
        })
    }
})

const Phyzzy = (scale) => {
    let state = {
        scale: scale, // size of 1 meter in pixels
        mesh: []
    }
    return Object.assign(
        state,
        AddToMesh(state),
        Integrator(state),
        Collider(state),
        CanvasDraw(state)
    )
}

module.exports = Phyzzy