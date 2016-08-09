// spring.js
// Spring library
// Links two masses together for springing.
// Spring must be referenced upon creation.
'use strict'
const ForceCalc = state => ({
    springing: (seg12) => {
        // calculate springing force from segment of mass1 to mass2
        return seg12.unit().mul(state.stiffness * (state.restlength - seg12.mag()))
    },
    damping: (vel1, vel2, dt) => {
        return 0
    }
})

const Spring = (restlength, stiffness, damping) => {
    let state = {
        restlength,
        stiffness,
        damping
    }
    return Object.assign(
        {},
        state,
        ForceCalc(state)
    )
}

module.exports = Spring