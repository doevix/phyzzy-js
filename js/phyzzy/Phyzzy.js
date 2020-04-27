// Phyzzy.js
"use strict";

// 2D vector class to handle calculations.
class Vect {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    set(x, y)
    {
        this.x = x;
        this.y = y;
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
    // Get length between this vector and another.
    len(A)
    {
        return this.sub(A).mag();
    }
    // check if vector is equal to another
    equChk(V) {
        return V.x === this.x && V.y === this.y;
    }
    // compares if a coordinate is within the bounds of another according to a boundary radius
    isNear(A, rad) {
        return Math.abs(this.x - A.x) < rad && Math.abs(this.y - A.y) < rad;
    }
    // returns a string that displays the vector's components
    display (fix) {
        // check if integer before printing. Otherwise, print decimal with 2 decimal places.
        return '(' + this.x.toFixed(fix) + ', ' + this.y.toFixed(fix) + ')';
    }
    toFixed2d(fix) {
        return new Vect(this.x.toFixed(fix), this.y.toFixed(fix));
    }
    // draws vector onto canvas
    canvasDraw(pos, scale, lenScale, ctx, lineColor) {
        ctx.strokeStyle = lineColor || '#000000';
        ctx.beginPath();
        ctx.moveTo(pos.x * scale, pos.y * scale);
        ctx.lineTo((pos.x + this.x * lenScale) * scale, (pos.y + this.y * lenScale) * scale);
        ctx.stroke();
        ctx.closePath();
    }
};

class Spring {
    constructor(restlength, stiffness, resistance) {
        this.restlength = restlength;
        this.stiffness = stiffness;
        this.resistance = resistance;
        // These are only for search and repositioning. Force input is external only.
        this.mA;
        this.mB;
    }
    springing(Pi1, Pi2) {
        // calculate springing force from segment of mass1 to mass2
        const seg12 = Pi1.sub(Pi2);
        return seg12.unit().mul(this.stiffness * (this.restlength - seg12.mag()));
    }
    damping(massA, massB) {
        const seg12 = massA.Pi.sub(massB.Pi);
        const diff12 = seg12.sub(massA.Po.sub(massB.Po));
        return diff12.pjt(seg12).mul(-this.resistance);
    }
    len() {
        // Return current length of the spring.
        return this.mA.Pi.len(this.mB.Pi);
    }
    center() {
        // Return center position of spring.
        return this.mA.Pi.sum(this.mB.Pi).div(2);
    }
    setPos(pos) {
        // Modify spring's position.
        
    }
    sumPos(diff) {
        // Increment spring's position.
    }
    draw(ctx, scale, color) {
        ctx.strokeStyle = color || "black";
        ctx.beginPath();
        ctx.moveTo(this.mA.Pi.x * scale, this.mA.Pi.y * scale);
        ctx.lineTo(this.mB.Pi.x * scale, this.mB.Pi.y * scale);
        ctx.closePath();
        ctx.stroke();
    }
};

class Mass {
    constructor(prop, Pi, Po) {
        this.Pi = new Vect(Pi.x, Pi.y);
        this.Po = Po ? new Vect(Po.x, Po.y) : new Vect(Pi.x, Pi.y);
        this.branch = [];
        this.mass = prop.mass;
        this.rad = prop.rad;
        this.refl = prop.refl;
        this.mu_s = prop.mu_s;
        this.mu_k = prop.mu_k;
        this.fix = false;
        this.ignore = false;
    }
    vel(delta) {
        return this.Pi.sub(this.Po).div(delta);
    }
    springing() {
        const force = new Vect();
        for (let leaf of this.branch) {
            force.sumTo(leaf.s.springing(this.Pi, leaf.m.Pi));
        }
        return force;
    }
    damping() {
        const force = new Vect()
        for (let leaf of this.branch) {
            force.sumTo(leaf.s.damping(this, leaf.m))
        }
        return force;
    }
    moveVerlet(forces, delta) {
        if (!this.fix && !this.ignore) {
            let accel = forces.div(this.mass);
            let delta_Pi = this.Pi.sub(this.Po).sum(accel.mul(delta * delta));
            this.Po.equ(this.Pi);
            this.Pi.sumTo(delta_Pi);
        } else if (this.fix)
        {
            this.Po.equ(this.Pi);
        }
    }
    draw(ctx, scale, color)
    {
        ctx.fillStyle = color || "black";
        if (!this.fix)
        {
            ctx.beginPath();
            ctx.arc(
                this.Pi.x * scale,
                this.Pi.y * scale,
                this.rad * scale,
                0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(
                (this.Pi.x - this.rad) * scale,
                (this.Pi.y - this.rad) * scale,
                this.rad * 2 * scale,
                this.rad * 2 * scale);
        }
    }
};

class SpringActuator
{
    constructor(spring, mode, phase = 0, sense = 0.5)
    {
        this.spring = spring;
        this.mode = mode; // 0 = modify restlength, 1 = modify stiffness
        this.defaultRest = spring.restlength;
        this.defaultStiff = spring.stiffness;

        this.phase = phase; // 0 to 2pi
        this.sense = sense; // 0 to 1
    }
    act(amp, wSpd, t) {
        // Waveform oscillates between zero and 1
        const factor = amp * this.sense * (1 + Math.sin(wSpd * t + this.phase / wSpd));
        if (this.mode === 0) {
            // Spring length modifies from zero to twice its original length.
            this.spring.restlength = this.defaultRest * factor;
        } else {
            // Spring stiffness modifies from zero to its original length.
            this.spring.stiffness = this.defaultStiff * (factor / 2);
        }
    }
};

class MassActuator
{
    constructor(mass, mode, maxMult = 1)
    {
        this.mass = mass;
        this.mode = mode; // 0 = modify radius, 1 = modify mass
        this.defaultRad = mass.rad;
        this.defaultMass = mass.mass;
        this.maxMult = maxMult; // increment multiplier.
        this.phase = phase;
        this.sense = sense;
    }
    act(amp, wSpd, t) {
        // Waveform oscillates between zero and 1
        const factor = 0.5 * this.sense * amp * (1 + Math.sin(wSpd * t * this.mult + this.phase / wSpd));
        if (mode === 0)
        {
            this.mass.rad = this.defaultRad * (1 + factor * this.maxMult);
        } else {
            this.mass.mass = this.defaultMass * (1 + factor * this.maxMult);
        }
    }
};

class PhyzzyModel {
    constructor(scale)
    {
        this.scale = scale;
        this.mesh = [];
        this.springs = [];
        this.actuators = [];
    }
    // Adjust a given vector to Phyzzy's scale.
    scaleV(A)
    {
        return A.div(this.scale);
    }
    // Adjust a value to Phyzzy's scale.
    scaleS(S)
    {
        return S / this.scale;
    }
    addM(mass) {
        if (!this.mesh.some(m => m === mass)) {
            // each new mass added must be unique
            this.mesh.push(mass);
        }
    }
    addS(mass1, mass2, spring) {
        // links two masses with a spring
        if (mass1 !== mass2 && !mass1.branch.some(b => b.m === mass2)) {
            // cannot link a mass to itself nor have two springs in link
            mass1.branch.push({m: mass2, s: spring});
            mass2.branch.push({m: mass1, s: spring});
            spring.mA = mass1;
            spring.mB = mass2;
            this.springs.push(spring);
        }
    }
    remM(mass) {
        this.mesh.forEach(m => m.branch = m.branch.filter(leaf => leaf.m !== mass));
        this.mesh = this.mesh.filter(checkedMass => checkedMass !== mass);
    }
    remS(spring) {
        this.mesh.forEach(mass => mass.branch = mass.branch.filter(leaf => leaf.s !== spring));
    }
    attachSpringActuator(s, mode, phase, sense)
    {
        const a = new SpringActuator(s, mode, phase, sense);
        this.actuators.push(a);
    }
    clear()
    {
        this.mesh = [];
        this.springs = [];
    }
    locateMass(pos, rad)
    {
        return this.mesh.find(mass => mass.Pi.isNear(pos, rad));
    }
    // Calculate approximate centroid of model.
    getCenter()
    {
        const center = new Vect();
        for(let m of this.mesh)
            center.sumTo(m.Pi);
        return center.div(this.mesh.length);
    }
    updateActuators(amp, wSpd, t) {
        this.actuators.forEach(a => a.act(amp, wSpd, t));
    }
    update(forces, dt) {
        for (let i = 0; i < this.mesh.length; i++) {
            let mass = this.mesh[i];
            mass.moveVerlet(forces[i], dt);
        }        
    }
    collision(collCoord) {
        const collCoordIter = collCoord[Symbol.iterator]()// collCoord.values()
        this.mesh.forEach(mass => {
            let cC_current = collCoordIter.next().value;
            if (!mass.Po.equChk(cC_current.Po) || !mass.Pi.equChk(cC_current.Pi)) {
                // change coordinates only when collisions have indicated it.
                mass.Po.equ(cC_current.Po);
                mass.Pi.equ(cC_current.Pi);
            }
        })
    }
    drawMass(ctx, colorM) {
        this.mesh.forEach(mass => mass.draw(ctx, this.scale, colorM));
    }
    drawSpring(ctx, colorS) {
        this.springs.forEach(spring => spring.draw(ctx, this.scale, colorS));
    }
};

class PhyzzyEnvironment {
    constructor(gravity, kd, boundary) {
        this.gravity = new Vect(gravity.x, gravity.y);
        this.kd = kd;
        this.boundary = boundary;
    }
    weight(mass) {
        return this.gravity.mul(mass.mass);
    }
    drag(mass) {
        return mass.Pi.sub(mass.Po).mul(-this.kd);
    }
    // calculates collisions against wall and friction on surface
    boundaryHit(mass) {
        const n_Pi = new Vect(mass.Pi.x, mass.Pi.y);
        const n_Po = new Vect(mass.Po.x, mass.Po.y);

        const reboundCalc = (xi, xo, r) => r * (xi - xo) + xi;

        if (n_Pi.y > this.boundary.h - mass.rad) {
            // h boundary hit
            n_Pi.y = this.boundary.h - mass.rad;
            n_Po.y = reboundCalc(n_Pi.y, n_Po.y, mass.refl);
        } else if (n_Pi.y < this.boundary.y + mass.rad) {
            // y boundary hit
            n_Pi.y = this.boundary.y + mass.rad;
            n_Po.y = reboundCalc(n_Pi.y, n_Po.y, mass.refl);
        }
        if (n_Pi.x > this.boundary.w - mass.rad) {
            // w boundary hit
            n_Pi.x = this.boundary.w - mass.rad;
            n_Po.x = reboundCalc(n_Pi.x, n_Po.x, mass.refl);
        } else if (n_Pi.x < this.boundary.x + mass.rad) {
            // x boundary hit
            n_Pi.x = this.boundary.x + mass.rad;
            n_Po.x = reboundCalc(n_Pi.x, n_Po.x, mass.refl);
        }
        return {Pi: n_Pi, Po: n_Po};
    }
    friction(mass, force) {
        let tol = 1e-3;
        let friction = new Vect(0, 0);
        const posDiff = mass.Pi.sub(mass.Po);
        if (mass.Pi.y > this.boundary.h - mass.rad - tol) {
            if (Math.abs(posDiff.x) > tol || Math.abs(force.x) > Math.abs(force.y * mass.m_us)) {
                friction.sumTo({
                    x: -mass.mu_k * Math.abs(force.y) * Math.sign(posDiff.x),
                    y: force.y > 0 ? -force.y : 0
                });
            } else {
                // NOTE: static friction condition mutates mass directly to ensure stopping
                mass.Po.x = mass.Pi.x;
                friction.x = -force.x;
            }
        }
        return friction;
    }
}