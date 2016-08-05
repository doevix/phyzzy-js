// mass.js
// Mass library
// Generates a Mass object.

'use strict'
const Vect = require('./vector.js')

const Velocity = state => ({
    vel: dt => state.Pi.sub(state.Po).div(dt)
})
const Springing = state => ({
    springing: () => {
        // sum forces acted on mass by springs
        const force = new Vect(0, 0)
        state.branch.forEach(link => {
            let Fs = link.s.springing(state.Pi, link.m.Pi)
            force.sumTo(Fs)
        })
        return force
    }
    
})

const Mass = (prop, Pi, Po) => {
    let state = {
        Pi: new Vect(Pi.x, Pi.y),
        Po: new Vect(Po.x, Po.y),
        branch: []
    }
    Object.assign(state, prop)
    return Object.assign(
        {},
        state,
        Velocity(state),
        Springing(state)
    )
}

module.exports = Mass