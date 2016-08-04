// utilities for phyzzy

'use strict'

const tol = 1e-3

// calculate velocity from previous position
const calcVel = (Pi, Po, dt) => Pi.sub(Po).div(dt)
// calculate previous position from velocity
const calcPo = (Pi, vel, dt) => Pi.sub(vel.mul(dt))

module.exports = {
    tol,
    calcVel,
    calcPo
}