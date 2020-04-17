// mass.js
// Mass library
// Generates a Mass object.

'use strict'
const Vect = require('./vector.js')

const Velocity = state => ({
    vel: dt => state.Pi.sub(state.Po).div(dt)
})

const Springing = state => ({
    // quicker implementation of springing force calculation
    springing: () => {
        const force = new Vect()
        for (let leaf of state.branch) {
            force.sumTo(leaf.s.springing(state.Pi, leaf.m.Pi))
        }
        return force
    }
})

const Damping = state => ({
    // quicker implementation of damping force calculation
    damping: () => {
        const force = new Vect()
        for (let leaf of state.branch) {
            force.sumTo(leaf.s.damping(state, leaf.m))
        }
        return force
    }
})

const Mass = (prop, Pi, Po) => {
    let state = {
        Pi: new Vect(Pi.x, Pi.y),
        Po: Po ? new Vect(Po.x, Po.y) : new Vect(Pi.x, Pi.y),
        branch: []
    }
    return Object.assign(
        state,
        prop,
        Velocity(state),
        Springing(state),
        Damping(state)
    )
}

module.exports = Mass