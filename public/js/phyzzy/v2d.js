// 2D vector class.
'use strict';

class v2d {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    set(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        return this;
    }
    copy() {
        return new v2d(this.x, this.y);
    }
    add(A) {
        return new v2d(this.x + A.x, this.y + A.y);
    }
    sub(A) {
        return new v2d(this.x - A.x, this.y - A.y);
    }
    mul(s) {
        return new v2d(this.x * s, this.y * s);
    }
    div(s) {
        return new v2d(this.x / s, this.y / s);
    }
    inv() {
        return new v2d(-this.x, -this.y);
    }
    mEqu(A) {
        this.x = A.x;
        this.y = A.y;
        return this;
    }
    mAdd(A) {
        this.x += A.x;
        this.y += A.y;
        return this;
    }
    mSub(A) {
        this.x -= A.x;
        this.y -= A.y;
        return this;
    }
    mMul(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }
    mDiv(s) {
        this.x /= s;
        this.y /= s;
        return this;
    }
    mInv(s) {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }
    // Returns linear transformation.
    tf(a, b, c, d) {
        return new v2d(a * this.x + b * this.y, c * this.x + d * this.y);
    }
    // Dot product.
    dot(A) {
        return this.x * A.x + this.y * A.y;
    }
    // Cross product, result is single Z axis.
    crs(A) {
        return this.x * A.y - this.y * A.x;
    }
    // Magnitude squared of vector.
    mag2() {
        return this.dot(this);
    }
    // Magnitude of the vector.
    mag() {
        return Math.sqrt(this.mag2());
    }
    // Angle of the vector.
    ang() {
        return Math.atan2(this.y, this.x);
    }
    // Normalized vector.
    nrm() {
        return this.div(this.mag());
    }
    // Perpendicular vector.
    prp() {
        return new v2d(-this.y, this.x);
    }
    // Vector projection of this onto a given vector.
    pjt(A) {
        return A.mag2() > 0 ? A.mul((this.dot(A) / A.mag2())) : new v2d();
    }
    // Distance between the segment of this and a given vector.
    len(A) {
        return this.sub(A).mag();
    }
    // Returns true when a given point is within a radius of this vector.
    isInRad(point, radius) {
        return this.sub(point).mag2() <= (radius * radius);
    }
    // Less-than magnitude evaluation
    isLess(A) {
        return this.mag2() < A.mag2();
    }
    // Greater-than magnitude evaluation
    isGreater(A) {
        return this.mag2() > A.mag2();
    }
};
