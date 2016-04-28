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
// mutating multiplication
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
    if (s !== 0) {
        return new Vect(this.x / s, this.y / s);
    } else {
        return new Vect();
    }
    
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
    var m = this.mag();
    if (m > 0) {
        return this.div(m);
    } else {
        return new Vect();
    }
};
// project current vector on other.
Vect.prototype.pjt  = function (A) {
    'use strict';
    if (A.magSq > 0) { // A(A*B)/(|A|^2)
        return A.mul(A.dot(this)).div(A.magSq());
    } else {
        return new Vect();
    }
};
// check if vector is equal to another
Vect.prototype.equChk = function (V) {
    'use strict';
    if (V.x === this.x && V.y === this.y) {
        return true;
    } else {
        return false;
    }
};
// compares if a coordinate is within the bounds of another according to a boundary radius
Vect.prototype.compare = function (A, rad) {
    'use strict';
    if (Math.abs(this.x - A.x) <= rad && Math.abs(this.y - A.y) <= rad) {
        return true;
    } else {
        return false;
    }
};
// returns a string that displays the vector's components
Vect.prototype.display = function () {
    'use strict';
    var X = this.x % 1 === 0 ? this.x : this.x.toFixed(2),
        Y = this.y % 1 === 0 ? this.y : this.y.toFixed(2);
    return '(' + X + ',' + Y + ')';
};
