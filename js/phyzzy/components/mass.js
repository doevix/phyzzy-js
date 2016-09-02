// mass.js
// Mass library
// Generates a Mass object.

'use strict'
const Vect = require('./vector.js')

const Velocity = state => ({
    vel: dt => state.Pi.sub(state.Po).div(dt)
})
const Springing = state => ({
    // sum forces acted on mass by springs
    springing: () => state.branch.reduce((lf, cf) => lf.sum(cf.s.springing(state.Pi, cf.m.Pi)), new Vect())
})

const Damping = state => ({
    // sum forces acted on mass by dampers
    damping: () => state.branch.reduce((lf, cf) => lf.sum(cf.s.damping(state.Pi, state.Po, cf.m.Pi, cf.m.Po)), new Vect())
})

const Mass = (prop, Pi, Po) => {
    let state = {
        Pi: new Vect(Pi.x, Pi.y),
        Po: new Vect(Po.x, Po.y),
        branch: []
    }
    Object.assign(state, prop)
    return Object.assign(
        state,
        Velocity(state),
        Springing(state),
        Damping(state)
    )
}

module.exports = Mass