// Environment library
// Defines space where mesh exists and applies forces upon them.
'use strict'
const Vect = require('./vector.js')

// calculate velocity from previous position
const calcVel = (Pi, Po, dt) => Pi.sub(Po).div(dt)
// calculate previous position from velocity
const calcPo = (Pi, vel, dt) => Pi.sub(V.mul(dt))

const ForceCalc = state => ({
    weight: mass => state.gravity.mul(mass.mass),
    drag: mass => calcVel(mass.Pi, mass.Po, dt).mul(-state.drag)
})

const Environment = (gravity, drag) => {
    let state = {
        gravity: new Vect(gravity.x, gravity.y),
        drag
    }
    return Object.assign(
        {},
        state,
        ForceCalc(state)
    )
}

module.exports = Environment