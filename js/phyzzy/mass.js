/*
mass.js
Generates a Mass object.
*/
'use strict'
Vect = require('./js/vector.js')
// calculate velocity from previous position
const calcVel = (Pi, Po, dt) => Pi.sub(Po).div(dt)
// calculate previous position from velocity
const calcPo = (Pi, vel, dt) => Pi.sub(V.mul(dt))

const ForceCalc = state => ({
    weight: grav => grav.mul(state.mass),
    drag: (coef, dt) => calcVel(state.Pi, state.Po, dt).mul(-coef)
})

const Integrator = state => ({
    // Pi+1 = Pi + (Pi - Po) + (accel)*(dt^2)
    update: (F, dt) => {
        let accel = F.div(state.mass)
        let Pi_1 = state.Pi.sum( // Pi +
            state.Pi.sub(state.Po) // Pi - Po
            .sum(accel.mul(dt * dt)) // + accel * dt * dt
        )
        state.Po.equ(Pi)
        state.Pi.equ(Pi_1)
    }
})
const Mass = (mass, rad, refl, mu_s, mu_k, P) => {
    let state = {
        Pi: Object.create(P),
        Po: Object.create(P),
        mass,
        rad,
        refl,
        mu_s,
        mu_k
    }
    return Object.assign(
        {},
        state,
        ForceCalc(state),
        Integrator(state)
    )
}

module.exports = Mass