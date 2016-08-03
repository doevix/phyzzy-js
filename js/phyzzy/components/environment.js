// Environment library
// Defines space where mesh exists and applies forces upon them.
'use strict'
const Vect = require('./vector.js')

// calculate velocity from previous position
const calcVel = (Pi, Po, dt) => Pi.sub(Po).div(dt)
// calculate previous position from velocity
const calcPo = (Pi, vel, dt) => Pi.sub(vel.mul(dt))

// Basic forces that environment acts on masses
const ForceCalc = state => ({
    weight: mass => state.gravity.mul(mass.mass),
    drag: (mass, dt) => calcVel(mass.Pi, mass.Po, dt).mul(-state.drag)
})

// Wall collisions
const BoundCalc = state => ({
    // calculates collisions against wall and friction on surface
    boundaryHit: (mass, dt) => {
        const vel = calcVel(mass.Pi, mass.Po, dt)
        const n_Pi = new Vect(mass.Pi.x, mass.Pi.y)
        const n_Po = new Vect(mass.Po.x, mass.Po.y)

        if (n_Pi.y > state.boundary.h - mass.rad) {
            n_Pi.equ({x: n_Pi.x, y: state.boundary.h - mass.rad})
            vel.equ({x: vel.x, y: -mass.refl * vel.y})
            n_Po.equ(calcPo(mass.Pi, vel, dt))
        }
        
        return {Pi: n_Pi, Po: n_Po}
    }
})

const Environment = (gravity, drag, boundary) => {
    let state = {
        gravity: new Vect(gravity.x, gravity.y),
        drag,
        boundary
    }
    return Object.assign(
        {},
        state,
        ForceCalc(state),
        BoundCalc(state)
    )
}

module.exports = Environment