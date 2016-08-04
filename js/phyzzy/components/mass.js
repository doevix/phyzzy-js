/*
mass.js
Generates a Mass object.
*/
'use strict'
const Vect = require('./vector.js')

const Velocity = state => ({
    vel: dt => state.Pi.sub(state.Po).div(dt)
})

const Mass = (prop, Pi, Po) => {
    let state = {
        Pi: new Vect(Pi.x, Pi.y),
        Po: new Vect(Po.x, Po.y),
    }
    Object.assign(state, prop)
    return Object.assign(
        {},
        state,
        Velocity(state)
    )
}

module.exports = Mass