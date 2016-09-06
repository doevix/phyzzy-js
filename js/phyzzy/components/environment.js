// environment.js
// Environment library
// Defines space where mesh exists and applies forces upon them.
'use strict'
const Vect = require('./vector.js')

let tol = 1e-3

// Basic forces that environment acts on masses
const ForceCalc = state => ({
    weight: mass => state.gravity.mul(mass.mass),
    drag: mass => mass.Pi.sub(mass.Po).mul(-state.kd)
})

// Wall collisions
const BoundCalc = state => ({
    // calculates collisions against wall and friction on surface
    boundaryHit: mass => {
        const n_Pi = new Vect(mass.Pi.x, mass.Pi.y)
        const n_Po = new Vect(mass.Po.x, mass.Po.y)

        const reboundCalc = (xi, xo, r) => r * (xi - xo) + xi

        if (n_Pi.y > state.boundary.h - mass.rad) {
            // h boundary hit
            n_Pi.y = state.boundary.h - mass.rad
            n_Po.y = reboundCalc(n_Pi.y, n_Po.y, mass.refl)
        } else if (n_Pi.y < state.boundary.y + mass.rad) {
            // y boundary hit
            n_Pi.y = state.boundary.y + mass.rad
            n_Po.y = reboundCalc(n_Pi.y, n_Po.y, mass.refl)
        }
        if (n_Pi.x > state.boundary.w - mass.rad) {
            // w boundary hit
            n_Pi.x = state.boundary.w - mass.rad
            n_Po.x = reboundCalc(n_Pi.x, n_Po.x, mass.refl)
        } else if (n_Pi.x < state.boundary.x + mass.rad) {
            // x boundary hit
            n_Pi.x = state.boundary.x + mass.rad
            n_Po.x = reboundCalc(n_Pi.x, n_Po.x, mass.refl)
        }
        return {Pi: n_Pi, Po: n_Po}
    },

        squishyBounds: (mass, F, factorS, factorD) => {
        // experimental spring-like boundary
        let force = new Vect(0, 0)

        const fCalc = (xi, xo, bound, xf) => factorS * (bound - xi) - factorD * (xi - xo) - xf

        if (mass.Pi.y > state.boundary.h - mass.rad) {
            // h boundary hit
            force.y = fCalc(mass.Pi.y, mass.Po.y, state.boundary.h - mass.rad, F.y)
        } else if (mass.Pi.y < state.boundary.y + mass.rad) {
            // y boundary hit
            force.y = fCalc(mass.Pi.y, mass.Po.y, state.boundary.y + mass.rad, F.y)
        }
        if (mass.Pi.x > state.boundary.w - mass.rad) {
            // w boundary hit
            force.x = fCalc(mass.Pi.x, mass.Po.x, state.boundary.w - mass.rad, F.x)
        } else if (mass.Pi.x < state.boundary.x + mass.rad) {
            // x boundary hit
            force.x = fCalc(mass.Pi.x, mass.Po.x, state.boundary.x + mass.rad, F.x)
        }
        return force;
    },

    friction: (mass, force) => {
        let friction = new Vect(0, 0)
        const posDiff = mass.Pi.sub(mass.Po)
        if (mass.Pi.y > state.boundary.h - mass.rad - tol) {
            if (Math.abs(posDiff.x) > tol /*|| Math.abs(force.x) > Math.abs(force.y * mass.m_us)*/) {
                friction.sumTo({
                    x: -mass.mu_k * Math.abs(force.y) * Math.sign(posDiff.x),
                    y: -force.y
                })
            } else {
                // NOTE: static friction condition mutates mass directly to ensure stopping
                mass.Po.x = mass.Pi.x
                friction.x = -force.x
            }
        }
        return friction
    }
})

const Environment = (gravity, kd, boundary) => {
    let state = {
        gravity: new Vect(gravity.x, gravity.y),
        kd,
        boundary
    }
    return Object.assign(
        state,
        ForceCalc(state),
        BoundCalc(state)
    )
}

module.exports = Environment