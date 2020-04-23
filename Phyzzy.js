// Phyzzy.js

class Vect {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    // replace values of vector with given vector
    equ(A) {
        this.x = A.x;
        this.y = A.y;
    }
    // resets vector to zero
    clr() {
        this.x = 0;
        this.y = 0;
    }
    // mutating sum
    sumTo(A) {
        this.x += A.x;
        this.y += A.y;
    }
    // mutating subtraction
    subTo(A) {
        this.x -= A.x;
        this.y -= A.y;
    }
    // mutating scale
    mulTo(A) {
        this.x *= A.x;
        this.y *= A.y;
    }
    // mutating division
    divTo(A) {
        this.x /= A.x;
        this.y /= A.y;
    }
    // multiplies vector by a scalar value
    mul(s) {
        return new Vect(this.x * s, this.y * s);
    }
    // divides vector by a scalar value
    div(s) {
        return s !== 0 ? new Vect(this.x / s, this.y / s) : new Vect();
    }
    // sums vector with another vector
    sum(A) {
        return new Vect(this.x + A.x, this.y + A.y);
    }
    // subtracts given vector from this vector
    sub(A) {
        return new Vect(this.x - A.x, this.y - A.y);
    }
    // find square of magnitude
    magSq() {
        return this.x * this.x + this.y * this.y;
    }
    // find magnitude
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    // dot product
    dot(A) {
        return this.x * A.x + this.y * A.y;
    }
    // find unit vector of current
    unit() {
        return this.mag() > 0 ? this.div(this.mag()) : new Vect();
    }
    // project current vector on other.
    pjt(A) {
        return A.magSq() > 0 ? A.mul(A.dot(this)).div(A.magSq()) : new Vect();
    }
    // check if vector is equal to another
    equChk(V) {
        return V.x === this.x && V.y === this.y;
    }
    // compares if a coordinate is within the bounds of another according to a boundary radius
    compare(A, rad) {
        return Math.abs(this.x - A.x) <= rad && Math.abs(this.y - A.y) <= rad;
    }
};

class Spring {
    constructor(restlength, stiffness, damping) {
        this.restlength = restlength;
        this.stiffness = stiffness;
        this.damping = damping;
    }
    springing(Pi1, Pi2) {
        // calculate springing force from segment of mass1 to mass2
        const seg12 = Pi1.sub(Pi2);
        return seg12.unit().mul(this.stiffness * (this.restlength - seg12.mag()));
    }
    damping(massA, massB) {
        const seg12 = massA.Pi.sub(massB.Pi);
        const diff12 = seg12.sub(massA.Po.sub(massB.Po));
        return diff12.pjt(seg12).mul(-this.damping);
    }
};

class Mass {
    constructor(prop, Pi, Po) {
        this.Pi = new Vect(Pi.x, Pi.y);
        this.Po = Po ? new Vect(Po.x, Po.y) : new Vect(Pi.x, Pi.y);
        this.branch = [];
        this.prop = prop;
    }
};

class PhyzzyModel {

}
class PhyzzyEnvironment {
    constructor(gravity, kd, boundary) {
        this.gravity = new Vect(gravity.x, gravity.y);
        this.kd = kd;
        this.boundary = boundary;
    }

}