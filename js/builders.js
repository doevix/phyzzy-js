'use strict'

const Mass = require('./phyzzy/components/mass.js')
const Spring = require('./phyzzy/components/spring.js')

const generateBox = (x, y, w, h, prop, rest, damp, eng) => {
    const vertices = [
        {x: x, y: y},
        {x: w, y: y},
        {x: w, y: h},
        {x: x, y: h}
    ]
    const massProp = Object.assign({}, prop)
    const masses = vertices.map(vertex => Mass(massProp, vertex, vertex))
    masses.forEach(mass => eng.addM(mass))
    eng.m.forEach(mass => {
        ph.m.forEach(otherM => {
            if (otherM !== mass && masses.find(m => m === mass) && masses.find(m => m === otherM)) {
                ph.addS(mass, otherM, Spring(mass.Pi.sub(otherM.Pi).mag(), rest, damp))
            }
        })
    })
}

const generateTriangle = (x, y, b, h, prop, rest, damp, eng) => {
    const vertices = [
        {x: x, y: y},
        {x: x + b, y: y},
        {x: x + b / 2, y: y + h}
    ]
    const massProp = Object.assign({}, prop)
    let masses = vertices.map(vertex => Mass(massProp, vertex, vertex))

    masses.forEach(mass => eng.addM(mass))
    eng.m.forEach(mass => {
        ph.m.forEach(otherM => {
            if (otherM !== mass && masses.find(m => m === mass) && masses.find(m => m === otherM)) {
                ph.addS(mass, otherM, Spring(mass.Pi.sub(otherM.Pi).mag(), rest, damp))
            }
        })
    })
}

module.exports = {
    generateBox,
    generateTriangle
}