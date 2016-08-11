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
}

module.exports = Vect