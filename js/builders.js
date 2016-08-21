// builders.js
// generates meshes to be simulated by phyzzy

'use strict'

const Mass = require('./phyzzy/components/mass.js')
const Spring = require('./phyzzy/components/spring.js')

const FullLinkCreate = (vertices, property, spr, damp, engine) => {
    const masses = vertices.map(vertex => Mass(property, vertex, vertex))
    masses.forEach(mass => engine.addM(mass))
    engine.mesh.forEach(mass => {
        engine.mesh.forEach(otherM => {
            if (otherM !== mass && masses.find(m => m === mass) && masses.find(m => m === otherM)) {
                engine.addS(mass, otherM, Spring(mass.Pi.sub(otherM.Pi).mag(), spr, damp))
            }
        })
    })
}

const generateBox = (x, y, w, h, prop, spr, damp, eng) => {
    const vertices = [
        {x: x, y: y},
        {x: w, y: y},
        {x: w, y: h},
        {x: x, y: h}
    ]
    FullLinkCreate(vertices, Object.assign({}, prop), spr, damp, eng)
}

const generateTriangle = (x, y, b, h, prop, spr, damp, eng) => {
    const vertices = [
        {x: x, y: y},
        {x: x + b, y: y},
        {x: x + b / 2, y: y + h}
    ]
    FullLinkCreate(vertices, Object.assign({}, prop), spr, damp, eng)
}

const generateBlob = (x, y, w, h, N, prop, spr, damp, eng) => {
    const randCoord = (p, l) => Math.random() * (l - p) + p
    const vertices = []
    for (let i = 0; i < N; i++) {
        vertices.push({x: randCoord(x, w), y: randCoord(y, h)})
    }
    FullLinkCreate(vertices, Object.assign({}, prop), spr, damp, eng)
}

module.exports = {
    generateBox,
    generateTriangle,
    generateBlob
}