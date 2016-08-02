(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// phyzzy main webapp
'use strict'
const Phyzzy = require('./phyzzy/phyzzy.js')
const Mass = require('./phyzzy/components/mass.js')
const Vect = require('./phyzzy/components/vector.js')
const Environment = require('./phyzzy/components/environment.js')
const Vector = (x, y) => new Vect(x, y)


const viewport = document.getElementById('viewport')
const ctx = viewport.getContext('2d')

const ph = Phyzzy(100)
const env = Environment({x: 0, y: 9.81}, 0.2, {x: 0, y: 0, w: 5, h: 5})
const m1 = Mass(0.5, 0.05, 0.8, 0.8, 0.6, {x: 2.5, y: 0.05})

ph.addM(m1)
ph.draw(ctx)
},{"./phyzzy/components/environment.js":2,"./phyzzy/components/mass.js":3,"./phyzzy/components/vector.js":4,"./phyzzy/phyzzy.js":5}],2:[function(require,module,exports){
// Environment library
// Defines space where mesh exists and applies forces upon them.
'use strict'
const Vect = require('./vector.js')

// calculate velocity from previous position
const calcVel = (Pi, Po, dt) => Pi.sub(Po).div(dt)
// calculate previous position from velocity
const calcPo = (Pi, vel, dt) => Pi.sub(V.mul(dt))

// Basic forces that environment acts on masses
const ForceCalc = state => ({
    weight: mass => state.gravity.mul(mass.mass),
    drag: mass => calcVel(mass.Pi, mass.Po, dt).mul(-state.drag)
})

// Wall collisions
const BoundCalc = state => ({
    // mutates mass position and returns friction force
    boundaryHit: mass => new Vect(0, 0)
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
const Mass = (mass, rad, refl, mu_s, mu_k, P) => {
    let state = {
        Pi: new Vect(P.x, P.y),
        Po: new Vect(P.x, P.y),
        mass,
        rad,
        refl,
        mu_s,
        mu_k
    }
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
    display () {
        // check if integer before printing. Otherwise, print decimal with 2 decimal places.
        return '(' + this.x.toFixed(2) + ', ' + this.y.toFixed(2) + ')'
    }
}

module.exports = Vect
},{}],5:[function(require,module,exports){
// Phyzzy
// Manages mesh and applies integrator for simulation
'use strict'

const Vect = require('./components/vector.js')
const Mass = require('./components/mass.js')

const Vector = (x, y) => new Vect(x, y) // wrapper to avoid 'new'

const AddToMesh = state => ({
    addM: mass => state.m.push(mass),
    addS: spring => state.s.push(spring)
})

const CanvasDraw = state => ({
    draw: ctx => {
        state.m.forEach(mass => {
            ctx.beginPath()
            ctx.arc(
                mass.Pi.x * state.scale,
                mass.Pi.y * state.scale,
                mass.rad * state.scale,
                0, Math.PI * 2, false
                )
            ctx.fill()
            ctx.closePath()
        })
        
    }
})

const Integrator = state => ({
    verlet: dt => {
        // Pi+1 = Pi + (Pi - Po) + (accel)*(dt^2)
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
        CanvasDraw(state)
    )
}

module.exports = Phyzzy
},{"./components/mass.js":3,"./components/vector.js":4}]},{},[1]);
