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
Vect.prototype.clr = function (A) {
    'use strict';
    this.x = 0;
    this.y = 0;
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