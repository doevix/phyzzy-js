// extraForces.js
// Special forces that can be added to the mapped force calculation.
'use strict'
const Vect = require('./phyzzy/components/vector.js')

const Coulomb = (mass1, mesh, C) => {
    // calculates electrostatic force via Coulombs law. (worst case: O(n^2))
    let force = new Vect(0, 0)
    if (mass1.q) {
        mesh.forEach(mass2 => {
           if (mass2.q && mass1 !== mass2) {
               let r = mass1.Pi.sub(mass2.Pi)
               let fq = C * mass1.q * mass2.q / r.mag()
               force.sumTo(r.unit().mul(fq))
           }
        })
    }
    return force
}

module.exports = {
    Coulomb
}

