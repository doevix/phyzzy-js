// PhyzzyBuilders.js

// Generates shapes and adds them to the mesh.
const Builders = {
    FullLinkCreate: function(vertices, property, spr, damp, engine) {
        const masses = vertices.map(vertex => new Mass(property, vertex, vertex))
        masses.forEach(mass => engine.addM(mass))
        engine.mesh.forEach(mass => {
            engine.mesh.forEach(otherM => {
                if (otherM !== mass && masses.find(m => m === mass) && masses.find(m => m === otherM)) {
                    engine.addS(mass, otherM, new Spring(mass.Pi.sub(otherM.Pi).mag(), spr, damp))
                }
            })
        })
    },
    generateLine: function(coordA, coordB, prop, spr, damp, eng) {
        let segAB = {x: coordA.x - coordB.x, y: coordA.y - coordB.y}
        let restlength = Math.sqrt(segAB.x * segAB.x + segAB.y * segAB.y)
        let m1 = new Mass(prop, coordA) 
        let m2 = new Mass(prop, coordB) 
        eng.addM(m1)
        eng.addM(m2)
        eng.addS(m1, m2, new Spring(restlength, spr, damp))
    },
    generateBox: function(x, y, w, h, prop, spr, damp, eng) {
        const vertices = [
            {x: x, y: y},
            {x: x + w, y: y},
            {x: x + w, y: y + h},
            {x: x, y: y + h}
        ]
        this.FullLinkCreate(vertices, Object.assign({}, prop), spr, damp, eng)
    },
    generateTriangle: function(x, y, b, h, prop, spr, damp, eng) {
        const vertices = [
            {x: x, y: y},
            {x: x + b, y: y},
            {x: x + b / 2, y: y + h}
        ]
        this.FullLinkCreate(vertices, Object.assign({}, prop), spr, damp, eng)
    },
    generateBlob: function(x, y, w, h, N, prop, spr, damp, eng) {
        const randCoord = (p, l) => Math.random() * (l - p) + p
        const vertices = []
        for (let i = 0; i < N; i++) {
            vertices.push({x: randCoord(x, w), y: randCoord(y, h)})
        }
        this.FullLinkCreate(vertices, Object.assign({}, prop), spr, damp, eng)
    }
};
