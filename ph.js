(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// builders.js
// generates shapes and adds them to the mesh.

'use strict'

const Mass = require('./components/mass.js')
const Spring = require('./components/spring.js')

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

const generateLine = (coordA, coordB, prop, spr, damp, eng) => {
    let segAB = {x: coordA.x - coordB.x, y: coordA.y - coordB.y}
    let restlength = Math.sqrt(segAB.x * segAB.x + segAB.y * segAB.y)
    let m1 = Mass(prop, coordA) 
    let m2 = Mass(prop, coordB) 
    eng.addM(m1)
    eng.addM(m2)
    eng.addS(m1, m2, Spring(restlength, spr, damp))
}

const generateBox = (x, y, w, h, prop, spr, damp, eng) => {
    const vertices = [
        {x: x, y: y},
        {x: x + w, y: y},
        {x: x + w, y: y + h},
        {x: x, y: y + h}
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
    generateLine,
    generateBox,
    generateTriangle,
    generateBlob
}
},{"./components/mass.js":3,"./components/spring.js":4}],2:[function(require,module,exports){
// environment.js
// Environment library
// Defines space where mesh exists and applies forces upon them.
'use strict'
const Vect = require('./vector.js')

let tol = 1e-3

// Basic forces that environment acts on masses
const ForceCalc = state => ({
    weight: mass => state.gravity.mul(mass.mass),
    drag: mass => mass.Pi.sub(mass.Po).mul(-state.kd)
})

// Wall collisions
const BoundCalc = state => ({
    // calculates collisions against wall and friction on surface
    boundaryHit: mass => {
        const n_Pi = new Vect(mass.Pi.x, mass.Pi.y)
        const n_Po = new Vect(mass.Po.x, mass.Po.y)

        const reboundCalc = (xi, xo, r) => r * (xi - xo) + xi

        if (n_Pi.y > state.boundary.h - mass.rad) {
            // h boundary hit
            n_Pi.y = state.boundary.h - mass.rad
            n_Po.y = reboundCalc(n_Pi.y, n_Po.y, mass.refl)
        } else if (n_Pi.y < state.boundary.y + mass.rad) {
            // y boundary hit
            n_Pi.y = state.boundary.y + mass.rad
            n_Po.y = reboundCalc(n_Pi.y, n_Po.y, mass.refl)
        }
        if (n_Pi.x > state.boundary.w - mass.rad) {
            // w boundary hit
            n_Pi.x = state.boundary.w - mass.rad
            n_Po.x = reboundCalc(n_Pi.x, n_Po.x, mass.refl)
        } else if (n_Pi.x < state.boundary.x + mass.rad) {
            // x boundary hit
            n_Pi.x = state.boundary.x + mass.rad
            n_Po.x = reboundCalc(n_Pi.x, n_Po.x, mass.refl)
        }
        return {Pi: n_Pi, Po: n_Po}
    },

    friction: (mass, force) => {
        let friction = new Vect(0, 0)
        const posDiff = mass.Pi.sub(mass.Po)
        if (mass.Pi.y > state.boundary.h - mass.rad - tol) {
            if (Math.abs(posDiff.x) > tol || Math.abs(force.x) > Math.abs(force.y * mass.m_us)) {
                friction.sumTo({
                    x: -mass.mu_k * Math.abs(force.y) * Math.sign(posDiff.x),
                    y: force.y > 0 ? -force.y : 0
                })
            } else {
                // NOTE: static friction condition mutates mass directly to ensure stopping
                mass.Po.x = mass.Pi.x
                friction.x = -force.x
            }
        }
        return friction
    }
})

const Environment = (gravity, kd, boundary) => {
    let state = {
        gravity: new Vect(gravity.x, gravity.y),
        kd,
        boundary
    }
    return Object.assign(
        state,
        ForceCalc(state),
        BoundCalc(state)
    )
}

module.exports = Environment
},{"./vector.js":5}],3:[function(require,module,exports){
// mass.js
// Mass library
// Generates a Mass object.

'use strict'
const Vect = require('./vector.js')

const Velocity = state => ({
    vel: dt => state.Pi.sub(state.Po).div(dt)
})

const Springing = state => ({
    // quicker implementation of springing force calculation
    springing: () => {
        const force = new Vect()
        for (let leaf of state.branch) {
            force.sumTo(leaf.s.springing(state.Pi, leaf.m.Pi))
        }
        return force
    }
})

const Damping = state => ({
    // quicker implementation of damping force calculation
    damping: () => {
        const force = new Vect()
        for (let leaf of state.branch) {
            force.sumTo(leaf.s.damping(state, leaf.m))
        }
        return force
    }
})

const Mass = (prop, Pi, Po) => {
    let state = {
        Pi: new Vect(Pi.x, Pi.y),
        Po: Po ? new Vect(Po.x, Po.y) : new Vect(Pi.x, Pi.y),
        branch: []
    }
    return Object.assign(
        state,
        prop,
        Velocity(state),
        Springing(state),
        Damping(state)
    )
}

module.exports = Mass
},{"./vector.js":5}],4:[function(require,module,exports){
// spring.js
// Spring library
// Links two masses together for springing.
// Spring must be referenced upon creation.
'use strict'
const Springer = state => ({
    springing: (Pi1, Pi2) => {
        // calculate springing force from segment of mass1 to mass2
        const seg12 = Pi1.sub(Pi2)
        return seg12.unit().mul(state.stiffness * (state.restlength - seg12.mag()))
    }
})
const Damper = state => ({
    damping: (massA, massB) => {
        const seg12 = massA.Pi.sub(massB.Pi)
        const diff12 = seg12.sub(massA.Po.sub(massB.Po))
        return diff12.pjt(seg12).mul(-state.resistence)
    }
})

const Spring = (restlength, stiffness, resistence) => {
    let state = {
        restlength,
        stiffness,
        resistence
    }
    return Object.assign(
        state,
        Springer(state),
        Damper(state)
    )
}

module.exports = Spring
},{}],5:[function(require,module,exports){
//vector.js
/*
    Vector library
*/
'use strict'
class Vect {
    constructor (x, y) {
        this.x = x || 0
        this.y = y || 0
    }
    // replace values of vector with given vector
    equ (A) {
        this.x = A.x
        this.y = A.y
    }
    // resets vector to zero
    clr () {
        this.x = 0
        this.y = 0
    }
    // mutating sum
    sumTo (A) {
        this.x += A.x
        this.y += A.y
    }
    // mutating subtraction
    subTo (A) {
        this.x -= A.x
        this.y -= A.y
    }
    // mutating scale
    mulTo (A) {
        this.x *= A.x
        this.y *= A.y
    }
    // mutating division
    divTo (A) {
        this.x /= A.x
        this.y /= A.y
    }
    // multiplies vector by a scalar value
    mul (s) {
        return new Vect(this.x * s, this.y * s)
    }
    // divides vector by a scalar value
    div (s) {
        return s !== 0 ? new Vect(this.x / s, this.y / s) : new Vect()
    }
    // sums vector with another vector
    sum (A) {
        return new Vect(this.x + A.x, this.y + A.y)
    }
    // subtracts given vector from this vector
    sub (A) {
        return new Vect(this.x - A.x, this.y - A.y)
    }
    // find square of magnitude
    magSq () {
        return this.x * this.x + this.y * this.y
    }
    // find magnitude
    mag () {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }
    // dot product
    dot (A) {
        return this.x * A.x + this.y * A.y
    }
    // find unit vector of current
    unit () {
        return this.mag() > 0 ? this.div(this.mag()) : new Vect()
    }
    // project current vector on other.
    pjt  (A) {
        return A.magSq() > 0 ? A.mul(A.dot(this)).div(A.magSq()) : new Vect()
    }
    // check if vector is equal to another
    equChk (V) {
        return V.x === this.x && V.y === this.y
    }
    // compares if a coordinate is within the bounds of another according to a boundary radius
    compare (A, rad) {
        return Math.abs(this.x - A.x) <= rad && Math.abs(this.y - A.y) <= rad
    }
    // returns a string that displays the vector's components
    display (fix) {
        // check if integer before printing. Otherwise, print decimal with 2 decimal places.
        return '(' + this.x.toFixed(fix) + ', ' + this.y.toFixed(fix) + ')'
    }
    toFixed2d(fix) {
        return new Vect(this.x.toFixed(fix), this.y.toFixed(fix))
    }
    // draws vector onto canvas
    canvasDraw(pos, scale, lenScale, ctx, lineColor) {
        ctx.strokeStyle = lineColor || '#000000'
        ctx.beginPath()
        ctx.moveTo(pos.x * scale, pos.y * scale)
        ctx.lineTo((pos.x + this.x * lenScale) * scale, (pos.y + this.y * lenScale) * scale)
        ctx.stroke()
        ctx.closePath()
    }
}

module.exports = Vect
},{}],6:[function(require,module,exports){
// engine.js
// Phyzzy engine.
// Manages, simulates, and draws mesh to canvas.
'use strict'

const AddToMesh = state => ({
    addM: mass => {
        // adds a new mass
        if (!state.mesh.some(m => m === mass)) {
            // each new mass added must be unique
            state.mesh.push(mass)
        }
    },
    addS: (mass1, mass2, spring) => {
        // links two masses with a spring
        if (mass1 !== mass2 && !mass1.branch.some(b => b.m === mass2)) {
            // cannot link a mass to itself nor have two springs in link
            mass1.branch.push({m: mass2, s: spring})
            mass2.branch.push({m: mass1, s: spring})
        }
    }
})

const DelFromMesh = state => ({
    remM: mass => {
        state.mesh.forEach(m => m.branch = m.branch.filter(leaf => leaf.m !== mass))
        state.mesh = state.mesh.filter(checkedMass => checkedMass !== mass)
    },
    remS: spring => state.mesh.forEach(mass => mass.branch = mass.branch.filter(leaf => leaf.s !== spring))
})

const CanvasDraw = state => ({
    drawMass: (ctx, colorM) => {
        state.mesh.forEach(mass => {
            ctx.beginPath()
            ctx.arc (
                mass.Pi.x * state.scale,
                mass.Pi.y * state.scale,
                mass.rad * state.scale,
                0, Math.PI * 2, false
            )
            ctx.fillStyle = colorM || '#000000'
            ctx.fill()
            ctx.closePath()
        })
    },
    drawSpring: (ctx, colorS) => {
        const traces = []
        state.mesh.forEach(mass => {
            mass.branch.forEach(b => {
                const wasTraced = traces.some(t => b.m === t.m1 && mass === t.m2 || b.m === t.m2 && mass === t.m1)
                if (!wasTraced) {
                    // mesh is non-linear, traces must be tracked to avoid repetition
                    ctx.beginPath()
                    ctx.moveTo (
                        mass.Pi.x * state.scale,
                        mass.Pi.y * state.scale
                    )
                    ctx.lineTo (
                        b.m.Pi.x * state.scale,
                        b.m.Pi.y * state.scale
                    )
                    ctx.strokeStyle = colorS || '#000000'
                    ctx.stroke()
                    ctx.closePath()
                    traces.push({m1: mass, m2: b.m})
                }
            })   
        })
    }
})

const Integrator = state => ({
    verlet: (forces, dt) => {
        for (let i = 0; i < state.mesh.length; i++) {
            let mass = state.mesh[i]
            let accel = forces[i].div(mass.mass);
            let delta_Pi = mass.Pi.sub(mass.Po).sum(accel.mul(dt * dt))
            mass.Po.equ(mass.Pi)
            mass.Pi.sumTo(delta_Pi)
        }
    }
})

const Collider = state => ({
    collision: collCoord => {
        const collCoordIter = collCoord[Symbol.iterator]()// collCoord.values()
        state.mesh.forEach(mass => {
            let cC_current = collCoordIter.next().value
            if (!mass.Po.equChk(cC_current.Po) || !mass.Pi.equChk(cC_current.Pi)) {
                // change coordinates only when collisions have indicated it.
                mass.Po.equ(cC_current.Po)
                mass.Pi.equ(cC_current.Pi)
            }
        })
    }
})

const Engine = (scale) => {
    let state = {
        scale: scale, // size of 1 meter in pixels
        mesh: []
    }
    return Object.assign(
        state,
        AddToMesh(state),
        DelFromMesh(state),
        Integrator(state),
        Collider(state),
        CanvasDraw(state)
    )
}

module.exports = Engine
},{}],7:[function(require,module,exports){
// extraForces.js
// Special forces that can be added to the mapped force calculation.
'use strict'
const Vect = require('./components/vector.js')

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

const SquishyBounds = (boundary, mass, factorS) => {
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


},{"./components/vector.js":5}],8:[function(require,module,exports){
// user.js
// mousing functions for user interaction

const Vect = require('./components/vector.js');
const highlightRadius = 5;
const padding = 10;

const Highlighter = state => ({
    hover: (phyzzy, ctx, hColor) => {
        ctx.strokeStyle = hColor || '#000000';
        
        if (state.hov && state.sel !== state.hov) {
            ctx.beginPath();
            ctx.arc(
                state.hov.Pi.x * state.scale,
                state.hov.Pi.y * state.scale,
                state.hov.rad * state.scale + highlightRadius,
                0, 2 * Math.PI
            );
            ctx.stroke();
            ctx.closePath();
        }
        return state.hov;
    },
    select: (ctx, sColor) => {
        ctx.strokeStyle = sColor || '#000000';

        if (state.sel) {
            ctx.beginPath();
            ctx.arc(
                state.sel.Pi.x * state.scale,
                state.sel.Pi.y * state.scale,
                state.sel.rad * state.scale + highlightRadius,
                0, 2 * Math.PI, false
            );
            ctx.stroke();
            ctx.closePath();
        }
        return state.sel;
    } 
})

const Mover = state => ({
    dragMass: isPaused => {
        if (state.sel && state.mousedown && state.hov === state.sel || state.drg) {
            if (!state.drg) state.drg = state.sel; 
            state.sel.Pi.equ(state.Pi.div(state.scale));
            // prevents unwanted speed changes after getting out of pause mode.
            if (isPaused || state.drg.fixed) state.sel.Po.equ(state.Pi.div(state.scale));
            
        }
    }
});

const Initializer = state => ({
    init: (canvas, phyzzy) => {

        canvas.onmousedown = e => {
            // actions when mouse has been clicked
            if (!state.mousedown) state.mousedown = true;

            const isOnHov = state.hov ? state.hov.Pi.compare(
                state.Pi.div(state.scale), state.hov.rad + padding / state.scale
            ) : false;

            if (isOnHov && state.sel !== state.hov) {
                state.sel = state.hov;
            } else {
                state.sel = undefined;
                state.hov = undefined;
            }
        }
        canvas.onmouseup = e => {
            // actions when mouse stops clicking
            if (state.mousedown) state.mousedown = false;
            if (state.drg) state.drg = undefined;
        }

        canvas.onmouseenter = e => {
            state.drg = undefined;
            state.mousedown = false;
        }

        canvas.onmousemove = e => {
            // actions when mouse moves in the canvas
            const b = canvas.getBoundingClientRect();
            state.Po.equ(state.Pi);
            state.Pi.equ({
                x: e.clientX - b.left,
                y: e.clientY - b.top
            });

            state.hov = phyzzy.mesh.find(
                m => m.Pi.compare(
                    state.Pi.div(state.scale),
                    m.rad + padding / state.scale
                )
            );
        }

    }
});

const Output = state => ({
    coord: scale => state.Pi.div(scale || state.scale),
    isDown: () => state.mousedown,
    dragging: () => state.drg
});

const Mouser = scale => {
    const state = {
        Pi: new Vect(0, 0),
        Po: new Vect(0, 0),
        scale,
        mousedown: false,
        hov: undefined,
        sel: undefined,
        drg: undefined
    };
    return Object.assign(
        {},
        Initializer(state),
        Highlighter(state),
        Mover(state),
        Output(state)
    );
}

module.exports = {
    Mouser
}
},{"./components/vector.js":5}],9:[function(require,module,exports){
// phyzzy main webapp
// mainly used for testing
'use strict'
const Phyzzy = require('./js/phyzzy/engine.js')
const Mass = require('./js/phyzzy/components/mass.js')
const Spring = require('./js/phyzzy/components/spring.js')
const Environment = require('./js/phyzzy/components/environment.js')
const User = require('./js/phyzzy/user.js')
const Builders = require('./js/phyzzy/builders.js')
const extraForces = require('./js/phyzzy/extraForces')

const viewport = document.getElementById('viewport')
const ctx = viewport.getContext('2d')
const pauseButton = document.getElementById('userPause')
let pause = pauseButton.value === 'pause' ? false : true
pauseButton.addEventListener('click', e => {
    if (!pause) {
        pause = true
        pauseButton.value = 'play'
    } else {
        pause = false
        pauseButton.value = 'pause'
    }
}, false)


let delta = 1 / 50 // step time
const ph = Phyzzy(100)

const env = Environment(
    {x: 0, y: 9.81},
    1,
    {x: 0, y: 0, w: viewport.width / ph.scale, h: viewport.height / ph.scale}
)

const mouse = User.Mouser(ph.scale)

mouse.init(viewport, ph)

const mPropA = {mass: 0.1, rad: 0.05, refl: 0.7, mu_s: 0.4, mu_k: 0.2}
const mPropB = {mass: 0.5, rad: 0.05, refl: 0.7, mu_s: 0.4, mu_k: 0.2}

Builders.generateBox(1, 1, 1, 1, mPropA, 100, 50, ph)
Builders.generateBox(2, 2, 1, 1, mPropA, 100, 50, ph)
Builders.generateBox(3.5, 4.5, 1, 1, mPropB, 500, 250, ph)
Builders.generateBox(0.05, 4.5, 1, 1, mPropB, 500, 250, ph)

Builders.generateLine({x: 1, y: 1}, {x: 1.5, y: 1.5}, mPropA, 100, 50, ph)



ph.mesh[16].fixed = true

for (let i = 0; i < 20; i++) {
    let m = Mass(mPropA,
        {x: Math.random() * env.boundary.w, y: Math.random() * env.boundary.h},
        {x: Math.random() * env.boundary.w, y: Math.random() * env.boundary.h}
    )
    ph.addM(m)
}

const frame = (frameTime) => {
    ctx.clearRect(0, 0, viewport.width, viewport.height)
    ph.drawSpring(ctx, '#000000')
    ph.drawMass(ctx, '#1DB322')
    mouse.hover(ph, ctx, '#1DB322')
    mouse.select(ctx)
    if (!pause){
        ph.verlet(ph.mesh.map(mass => {
            let f = env.weight(mass).sum(env.drag(mass))
            .sum(mass.springing()).sum(mass.damping())
            f = f.sum(env.friction(mass, f))
            f = mass !== mouse.dragging() ? f : f.mul(0)
            if (mass.fixed) f.clr();
            return f
        }), delta)
        ph.collision(ph.mesh.map(mass => env.boundaryHit(mass)))
    }

    mouse.dragMass(pause)

    ctx.fillStyle = '#000000'
    ctx.fillText(mouse.coord().display(2), 20, 20)
    ctx.fillText('mousedown ' + mouse.isDown(), 20, 30)

    window.requestAnimationFrame(frame)
}

frame();
},{"./js/phyzzy/builders.js":1,"./js/phyzzy/components/environment.js":2,"./js/phyzzy/components/mass.js":3,"./js/phyzzy/components/spring.js":4,"./js/phyzzy/engine.js":6,"./js/phyzzy/extraForces":7,"./js/phyzzy/user.js":8}]},{},[9]);
