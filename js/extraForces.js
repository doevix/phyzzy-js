// extraForces.js
// Special forces that can be added to the mapped force calculation.
'use strict'
const Vect = require('./phyzzy/components/vector.js')

const Coulomb = (mass1, mesh, Kc) => {
    // calculates electrostatic force via Coulombs law. (worst case: O(n^2))
    if (mass1.q) {
        return mesh.reduce((cSum, mass2) => {
            if (mass1 !== mass2 && !mass1.Pi.compare(mass2.Pi, mass1.rad)) {
                let r = mass1.Pi.sub(mass2.Pi)
                return cSum.sum(r.unit().mul(Kc * mass1.q * mass2.q / r.magSq()))
            } else return cSum
        }, new Vect())
    } else return new Vect()
}

const Gravitation = (mass1, mesh, Kg) => {
    // calculates gravitational force via Newton's Law.
    // This is O(n^2) make sure mesh has less than 1000 masses for this.
    return mesh.reduce((gSum, mass2) => {
        if (mass1 !== mass2 && !mass1.Pi.compare(mass2.Pi, mass1.rad)) {
            let r = mass1.Pi.sub(mass2.Pi)
            return gSum.sum(r.unit().mul(-Kg * mass1.mass * mass2.mass / r.magSq()))
        } else return gSum
    }, new Vect())
}

const Brownian = (factor) => {
    const signedRand = () => 2 * (Math.random() - 0.5) // random value from -1 to 1
    return new Vect(factor * signedRand(), factor * signedRand())
}

const SquishyBounds = (boundary, mass, factorS, factorD) => {
    // experimental spring-like boundary
    let force = new Vect(0, 0)

    const fCalc = (xi, xo, bound) => factorS * (bound - xi) - (xi - xo) * (factorS - factorS * mass.refl) / factorS

    if (mass.Pi.y > boundary.h - mass.rad) {
        // h boundary hit
        force.y = fCalc(mass.Pi.y, mass.Po.y, boundary.h - mass.rad)
    } else if (mass.Pi.y < boundary.y + mass.rad) {
        // y boundary hit
        force.y = fCalc(mass.Pi.y, mass.Po.y, boundary.y + mass.rad)
    }
    if (mass.Pi.x > boundary.w - mass.rad) {
        // w boundary hit
        force.x = fCalc(mass.Pi.x, mass.Po.x, boundary.w - mass.rad)
    } else if (mass.Pi.x < boundary.x + mass.rad) {
        // x boundary hit
        force.x = fCalc(mass.Pi.x, mass.Po.x, boundary.x + mass.rad)
    }
    return force;
}

module.exports = {
    Coulomb,
    Gravitation, 
    Brownian,
    SquishyBounds
}

