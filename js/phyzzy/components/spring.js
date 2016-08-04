// spring.js
// links two masses together for springing
// Spring must be referenced upon creation
'use strict'
const ForceCalc = state => ({
    springing: (mass1, mass2) => {
        // calculate springing from mass1 to mass2
        const seg12 = state.mass1.Pi.sub(state.mass2.Pi)
        return seg12.unit().mul(
            state.stiffness * (seg12.mag() - state.restlength)
        )
    },
    damping: (mass1, mass2, dt) => {
        const vel1 = mass1.vel(dt)
        const vel2 = mass2.vel(dt)
    }
})

const Spring = (prop) => {
    let state = {}
    Object.assign(state, prop)
    return Object.assign(
        {},
        state,
        ForceCalc
    )
}

module.exports = Spring