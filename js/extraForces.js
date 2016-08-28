// extraForces.js
// Special forces that can be added to the mapped force calculation.
'use strict'
const Vect = require('./phyzzy/components/vector.js')

const Coulomb = (mass1, mesh, Kc) => {
    // calculates electrostatic force via Coulombs law. (worst case: O(n^2))
    let force = new Vect(0, 0)
    if (mass1.q) {
        mesh.forEach(mass2 => {
            if (mass2.q && mass1 !== mass2 && !mass1.Pi.compare(mass2.Pi, mass1.rad)) {
                let r = mass1.Pi.sub(mass2.Pi)
                let fq = Kc * mass1.q * mass2.q / r.magSq()
                force.sumTo(r.unit().mul(fq))
           }
        })
    }
    return force
}

const Gravitation = (mass1, mesh, Kg) => {
    // calculates gravitational force via Newton's Law. (worst case: O(n^2))
    let force = new Vect(0, 0)
    mesh.forEach(mass2 => {
        if (mass1 !== mass2 && !mass1.Pi.compare(mass2.Pi, mass1.rad)) {
            let r = mass1.Pi.sub(mass2.Pi)
               let fg = -Kg * mass1.mass * mass2.mass / r.magSq()
               force.sumTo(r.unit().mul(fg))
        }
    })
    return force
}

const Brownian = (mass, factor) => {
    const signedRand = () => 2 * (Math.random() - 0.5) // random value from -1 to 1
    return new Vect(factor * signedRand(), factor * signedRand())
}

module.exports = {
    Coulomb,
    Gravitation, 
    Brownian
}

