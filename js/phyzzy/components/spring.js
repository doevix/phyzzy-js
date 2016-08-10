// spring.js
// Spring library
// Links two masses together for springing.
// Spring must be referenced upon creation.
'use strict'
const ForceCalc = state => ({
    springing: (Pi1, Pi2) => {
        // calculate springing force from segment of mass1 to mass2
        const seg12 = Pi1.sub(Pi2)
        return seg12.unit().mul(state.stiffness * (state.restlength - seg12.mag()))
    },
    damping: (Pi1, Po1, Pi2, Po2) => {
         const seg12 = Pi1.sub(Pi2)
         const diff12 = seg12.sub(Po1.sub(Po2))
         return diff12.pjt(seg12).mul(-state.damping)
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