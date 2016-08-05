// environment.js
// Environment library
// Defines space where mesh exists and applies forces upon them.
'use strict'
const Vect = require('./vector.js')

let tol = 1e-3

// Basic forces that environment acts on masses
const ForceCalc = state => ({
    weight: mass => state.gravity.mul(mass.mass),
    drag: (mass, dt) => mass.vel(dt).mul(-state.drag),
})

// Wall collisions
const BoundCalc = state => ({
    // calculates collisions against wall and friction on surface
    boundaryHit: (mass, dt) => {
        const vel = mass.vel(dt)
        const n_Pi = new Vect(mass.Pi.x, mass.Pi.y)
        const n_Po = new Vect(mass.Po.x, mass.Po.y)

        if (n_Pi.y > state.boundary.h - mass.rad) {
            // h boundary hit
            n_Pi.equ({x: n_Pi.x, y: state.boundary.h - mass.rad})
            vel.equ({x: vel.x, y: -mass.refl * vel.y})
            n_Po.equ({x: n_Po.x, y: n_Po.y - vel.y * dt})
        } else if (n_Pi.y < state.boundary.y + mass.rad) {
            // y boundary hit
            n_Pi.equ({x: n_Pi.x, y: state.boundary.y + mass.rad})
            vel.equ({x: vel.x, y: -mass.refl * vel.y})
            n_Po.equ({x: n_Po.x, y: n_Po.y - vel.y * dt})
        }
        if (n_Pi.x > state.boundary.w - mass.rad) {
            // w boundary hit
            n_Pi.equ({x: state.boundary.w - mass.rad, y: n_Pi.y})
            vel.equ({x: -mass.refl * vel.x, y: vel.y})
            n_Po.equ({x: n_Po.x - vel.x * dt, y: n_Po.y})
        } else if (n_Pi.x < state.boundary.x + mass.rad) {
            // x boundary hit
            n_Pi.equ({x: state.boundary.x + mass.rad, y: n_Pi.y})
            vel.equ({x: -mass.refl * vel.x, y: vel.y})
            n_Po.equ({x: n_Po.x - vel.x * dt, y: n_Po.y})
        }
        return {Pi: n_Pi, Po: n_Po}
    },
    friction: (mass, force, dt) => {
        let friction = new Vect(0, 0)
        let vel = mass.vel(dt)
        if (mass.Pi.y > state.boundary.h - mass.rad - tol) {
            if (Math.abs(vel.x) > tol) {
                friction.sumTo({
                    x: -mass.mu_k * Math.abs(force.y) * Math.sign(vel.x),
                    y: -force.y
                })
            }
        }
        if (Math.abs(mass.Po.x - mass.Pi.x) < tol) mass.Po.x = mass.Pi.x
        return friction
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