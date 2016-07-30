//vector.js
/*
    Vector library
*/

function Vect(x, y) {
    'use strict';
    this.x = x || 0;
    this.y = y || 0;
}
// replace values of vector with given vector
Vect.prototype.equ = function (A) {
    'use strict';
    this.x = A.x;
    this.y = A.y;
};
// resets vector to zero
Vect.prototype.clr = function () {
    'use strict';
    this.x = 0;
    this.y = 0;
};
// mutating sum
Vect.prototype.sumTo = function (A) {
    'use strict';
    this.x += A.x;
    this.y += A.y;
};
// mutating subtraction
Vect.prototype.subTo = function (A) {
    'use strict';
    this.x -= A.x;
    this.y -= A.y;
};
// mutating scale
Vect.prototype.mulTo = function (A) {
    'use strict';
    this.x *= A.x;
    this.y *= A.y;
};
// mutating division
Vect.prototype.divTo = function (A) {
    'use strict';
    this.x /= A.x;
    this.y /= A.y;
};
// multiplies vector by a scalar value
Vect.prototype.mul = function (s) {
    'use strict';
    return new Vect(this.x * s, this.y * s);
};
// divides vector by a scalar value
Vect.prototype.div = function (s) {
    'use strict';
    return s !== 0 ? new Vect(this.x / s, this.y / s) : new Vect();    
};
// sums vector with another vector
Vect.prototype.sum = function (A) {
    'use strict';
    return new Vect(this.x + A.x, this.y + A.y);
};
// subtracts given vector from this vector
Vect.prototype.sub = function (A) {
    'use strict';
    return new Vect(this.x - A.x, this.y - A.y);
};
// find square of magnitude
Vect.prototype.magSq = function () {
    'use strict';
    return this.x * this.x + this.y * this.y;
};
// find magnitude
Vect.prototype.mag = function () {
    'use strict';
    return Math.sqrt(this.x * this.x + this.y * this.y);
};
// dot product
Vect.prototype.dot = function (A) {
    'use strict';
    return this.x * A.x + this.y * A.y;
};
// find unit vector of current
Vect.prototype.unit = function () {
    'use strict';
    return this.mag() > 0 ? this.div(this.mag()) : new Vect();
};
// project current vector on other.
Vect.prototype.pjt  = function (A) {
    'use strict';
    return A.magSq > 0 ? A.mul(A.dot(this)).div(A.magSq()) : new Vect();
};
// check if vector is equal to another
Vect.prototype.equChk = function (V) {
    'use strict';
    return V.x === this.x && V.y === this.y;
};
// compares if a coordinate is within the bounds of another according to a boundary radius
Vect.prototype.compare = function (A, rad) {
    'use strict';
    return Math.abs(this.x - A.x) <= rad && Math.abs(this.y - A.y) <= rad;
};
// returns a string that displays the vector's components
Vect.prototype.display = function () {
    'use strict';
    // check if integer before printing. Otherwise, print decimal with 2 decimal places.
    return '(' + this.x.toFixed(2) + ', ' + this.y.toFixed(2) + ')';
};

module.exports = {
    Vect: Vect
};