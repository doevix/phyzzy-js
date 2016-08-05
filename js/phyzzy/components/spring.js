// spring.js
// links two masses together for springing
// Spring must be referenced upon creation
'use strict'
const ForceCalc = state => ({
    springing: (pos1, pos2) => {
        // calculate springing force from mass1 to mass2
        const seg12 = pos1.sub(pos2)
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