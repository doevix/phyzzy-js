(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// phyzzy main webapp
'use strict'
const Phyzzy = require('./phyzzy/phyzzy.js')
const Mass = require('./phyzzy/components/mass.js')
const Environment = require('./phyzzy/components/environment.js')

const viewport = document.getElementById('viewport')
const ctx = viewport.getContext('2d')

const ph = Phyzzy(100)
const env = Environment({x: 0, y: 9.81}, 0.1, {x: 0, y: 0, w: 5, h: 5})
const m1 = Mass(
        {mass: 0.5, rad: 0.05, refl: 0.75, mu_s: 0.8, mu_k: 0.4},
        {x: 2.5, y: 0.05},
        {x: 2.4, y: 0.05}
    )
let delta = 1 / 50 // step frequency

ph.addM(m1)

const frame = () => {
    ctx.clearRect(0, 0, viewport.width, viewport.height)
    ph.draw(ctx, '#1DB322')
    
    ph.collision(ph.m.map(mass => env.boundaryHit(mass, delta) ))
    ph.verlet(ph.m.map(mass => {
        let f = env.weight(mass).sum(env.drag(mass, delta))
        return f.sum(env.friction(mass, f, delta))
    }), delta)
    ctx.fillStyle = '#000000'
    ctx.fillText(m1.Pi.sub(m1.Po).div(delta).display(5), 5, 495)

    window.requestAnimationFrame(frame)
}

frame();
},{"./phyzzy/components/environment.js":2,"./phyzzy/components/mass.js":3,"./phyzzy/phyzzy.js":5}],2:[function(require,module,exports){
// Environment library
// Defines space where mesh exists and applies forces upon them.
'use strict'
const Vect = require('./vector.js')

let tol = 1e-3

// calculate velocity from previous position
const calcVel = (Pi, Po, dt) => Pi.sub(Po).div(dt)
// calculate previous position from velocity
const calcPo = (Pi, vel, dt) => Pi.sub(vel.mul(dt))

// Basic forces that environment acts on masses
const ForceCalc = state => ({
    weight: mass => state.gravity.mul(mass.mass),
    drag: (mass, dt) => calcVel(mass.Pi, mass.Po, dt).mul(-state.drag),
})

// Wall collisions
const BoundCalc = state => ({
    // calculates collisions against wall and friction on surface
    boundaryHit: (mass, dt) => {
        const vel = calcVel(mass.Pi, mass.Po, dt)
        const n_Pi = new Vect(mass.Pi.x, mass.Pi.y)
        const n_Po = new Vect(mass.Po.x, mass.Po.y)

        if (n_Pi.y > state.boundary.h - mass.rad) {
            // h boundary hit
            n_Pi.equ({x: n_Pi.x, y: state.boundary.h - mass.rad})
            vel.equ({x: vel.x, y: -mass.refl * vel.y})
            n_Po.equ({x: n_Po.x, y: n_Po.y - vel.y * dt})
        } else if (n_Pi.y < state.boundary.y + mass.rad) {
            // y boundary hit
            n_Pi.equ({x: n_Pi.x, y: state.boundary.y + mass.rad})
            vel.equ({x: vel.x, y: -mass.refl * vel.y})
            n_Po.equ({x: n_Po.x, y: n_Po.y - vel.y * dt})
        }
        if (n_Pi.x > state.boundary.w - mass.rad) {
            // w boundary hit
            n_Pi.equ({x: state.boundary.w - mass.rad, y: n_Pi.y})
            vel.equ({x: -mass.refl * vel.x, y: vel.y})
            n_Po.equ({x: n_Po.x - vel.x * dt, y: n_Po.y})
        } else if (n_Pi.x < state.boundary.x + mass.rad) {
            // x boundary hit
            n_Pi.equ({x: state.boundary.x + mass.rad, y: n_Pi.y})
            vel.equ({x: -mass.refl * vel.x, y: vel.y})
            n_Po.equ({x: n_Po.x - vel.x * dt, y: n_Po.y})
        }
        return {Pi: n_Pi, Po: n_Po}
    },
    friction: (mass, force, dt) => {
        let friction = new Vect(0, 0)
        let vel = calcVel(mass.Pi, mass.Po, dt)
        if (mass.Pi.y > state.boundary.h - mass.rad - tol) {
            if (Math.abs(vel.x) > tol) {
                friction.sumTo({
                    x: -mass.mu_k * Math.abs(force.y) * Math.sign(vel.x),
                    y: -force.y
                })
            }
        }
        if (Math.abs(mass.Po.x - mass.Pi.x) < tol) mass.Po.x = mass.Pi.x
        return friction
    }
})

const Environment = (gravity, drag, boundary) => {
    let state = {
        gravity: new Vect(gravity.x, gravity.y),
        drag,
        boundary
    }
    return Object.assign(
        {},
        state,
        ForceCalc(state),
        BoundCalc(state)
    )
}

module.exports = Environment
},{"./vector.js":4}],3:[function(require,module,exports){
/*
mass.js
Generates a Mass object.
*/
'use strict'
const Vect = require('./vector.js')
// calculate velocity from previous position
const calcVel = (Pi, Po, dt) => Pi.sub(Po).div(dt)
// calculate previous position from velocity
const calcPo = (Pi, vel, dt) => Pi.sub(V.mul(dt))

const ForceCalc = state => ({
    weight: grav => grav.mul(state.mass),
    drag: (coef, dt) => calcVel(state.Pi, state.Po, dt).mul(-coef)
})

const Integrator = state => ({
    // Pi+1 = Pi + (Pi - Po) + (accel)*(dt^2)
    update: (F, dt) => {
        let accel = F.div(state.mass)
        let Pi_1 = state.Pi.sum( // Pi +
            state.Pi.sub(state.Po) // Pi - Po
            .sum(accel.mul(dt * dt)) // + accel * dt * dt
        )
        state.Po.equ(state.Pi)
        state.Pi.equ(Pi_1)
    }
})
const Mass = (prop, Pi, Po) => {
    let state = {
        Pi: new Vect(Pi.x, Pi.y),
        Po: new Vect(Po.x, Po.y),
    }
    Object.assign(state, prop)
    return Object.assign(
        {},
        state,
        ForceCalc(state),
        Integrator(state)
    )
}

module.exports = Mass
},{"./vector.js":4}],4:[function(require,module,exports){
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
        return A.magSq > 0 ? A.mul(A.dot(this)).div(A.magSq()) : new Vect()
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
}

module.exports = Vect
},{}],5:[function(require,module,exports){
// phyzzy.js
// Engine. Manages, simulates, and draws mesh to canvas.
'use strict'

const Vect = require('./components/vector.js')
const Mass = require('./components/mass.js')
// wrapper to avoid 'new' keyword
const Vector = (x, y) => new Vect(x, y)

const Iter = array => {
    // creates an iterator from array.
    let nextIndex = 0
    return {
        next: () => {
            return nextIndex < array.length ?
            {value: array[nextIndex++], done: false} :
            {done: true}
        }
    }
}

const AddToMesh = state => ({
    addM: mass => state.m.push(mass),
    addS: spring => state.s.push(spring)
})

const CanvasDraw = state => ({
    draw: (ctx, colorM) => {
        state.m.forEach(mass => {
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
    }
})

const CanvasHighlight = state => ({
    highlightMass: (mIdx, padding, ctx, color) => {
        ctx.beginPath()
        ctx.arc(
            state.m[mIdx].Pi.x * state.scale,
            state.m[mIdx].Pi.y * state.scale,
            state.m[mIdx].rad * state.scale + padding,
            0, Math.PI * 2, false
        )
        ctx.strokeStyle = color || '#000000'
        ctx.stroke()
        ctx.closePath()
    }
})

const Integrator = state => ({
    verlet: (forces, dt) => {
        const forcesIter = Iter(forces)
        state.m.forEach(mass => {
            // Pi+1 = Pi + (Pi - Po) + (accel)*(dt^2)
            let accel = forcesIter.next().value.div(mass.mass)
            let delta_Pi = mass.Pi.sub(mass.Po).sum(accel.mul(dt * dt))
            mass.Po.equ(mass.Pi)
            mass.Pi.sumTo(delta_Pi)
        })
    }
})

const Collider = state => ({
    collision: collCoord => {
        const collCoordIter = Iter(collCoord)
        state.m.forEach(mass => {
            let cC_current = collCoordIter.next().value
            if (!mass.Po.equChk(cC_current.Po) || !mass.Pi.equChk(cC_current.Pi)) {
                mass.Po.equ(cC_current.Po)
                mass.Pi.equ(cC_current.Pi)
            }
        })
    }
})

const Phyzzy = (scale) => {
    let state = {
        scale: scale, // size of 1 meter in pixels
        play: false, // false = paused, true = playing
        m: [],
        s: []
    }
    return Object.assign(
        {},
        state,
        AddToMesh(state),
        Integrator(state),
        Collider(state),
        CanvasDraw(state),
        CanvasHighlight(state)
    )
}

module.exports = Phyzzy
},{"./components/mass.js":3,"./components/vector.js":4}]},{},[1]);