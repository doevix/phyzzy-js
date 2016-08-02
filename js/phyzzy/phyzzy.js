// Phyzzy
// Manages mesh and applies integrator for simulation
'use strict'

const Vect = require('./components/vector.js')
const Mass = require('./components/mass.js')

const Vector = (x, y) => new Vect(x, y) // wrapper to avoid 'new'

const AddToMesh = state => ({
    addM: mass => state.m.push(mass),
    addS: spring => state.s.push(spring)
})

const Integrator = state => ({
    verlet: dt => {
        // Pi+1 = Pi + (Pi - Po) + (accel)*(dt^2)
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
        AddToMesh(state)
    )
}

module.exports = Phyzzy