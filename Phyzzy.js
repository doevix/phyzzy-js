// Phyzzy.js

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
};

class PhyzzyModel {
    constructor(scale)
    {
        this.scale = scale;
        this.mesh = [];
        this.springs = [];
    }
    addM(mass) {
        if (!this.mesh.some(m => m === mass)) {
            // each new mass added must be unique
            this.mesh.push(mass)
        }
    }
    addS(mass1, mass2, spring) {
        // links two masses with a spring
        if (mass1 !== mass2 && !mass1.branch.some(b => b.m === mass2)) {
            // cannot link a mass to itself nor have two springs in link
            mass1.branch.push({m: mass2, s: spring});
            mass2.branch.push({m: mass1, s: spring});
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
    locateMass(pos, rad)
    {
        return this.mesh.find(mass => mass.Pi.isNear(pos, rad));
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
        this.mesh.forEach(mass => {
            ctx.beginPath();
            ctx.arc (
                mass.Pi.x * this.scale,
                mass.Pi.y * this.scale,
                mass.rad * this.scale,
                0, Math.PI * 2, false
            );
            ctx.fillStyle = colorM || '#000000';
            ctx.fill();
            ctx.closePath();
        })
    }
    drawSpring(ctx, colorS) {
        const traces = [];
        this.mesh.forEach(mass => {
            mass.branch.forEach(b => {
                const wasTraced = traces.some(t => b.m === t.m1 && mass === t.m2 || b.m === t.m2 && mass === t.m1);
                if (!wasTraced) {
                    // mesh is non-linear, traces must be tracked to avoid repetition
                    ctx.beginPath();
                    ctx.moveTo (
                        mass.Pi.x * this.scale,
                        mass.Pi.y * this.scale
                    );
                    ctx.lineTo (
                        b.m.Pi.x * this.scale,
                        b.m.Pi.y * this.scale
                    );
                    ctx.strokeStyle = colorS || '#000000';
                    ctx.stroke();
                    ctx.closePath();
                    traces.push({m1: mass, m2: b.m});
                }
            });   
        });
    }
};

class PhyzzyEnvironment {
    constructor(gravity, kd, boundary) {
        this.gravity = new Vect(gravity.x, gravity.y);
        this.kd = kd;
        this.boundary = boundary;
    }
    weight (mass) {
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

// Special forces that can be added to the mapped force calculation.
const SpecialForces = {
    Coulomb: (mass1, mesh, Kc) => {
        // calculates electrostatic force via Coulombs law. (NOTE: O(n^2))
        if (mass1.q) {
            return mesh.reduce((cSum, mass2) => {
                if (mass1 !== mass2 && !mass1.Pi.compare(mass2.Pi, mass1.rad)) {
                    let r = mass1.Pi.sub(mass2.Pi)
                    return cSum.sum(r.unit().mul(Kc * mass1.q * mass2.q / r.magSq()))
                } else return cSum
            }, new Vect())
        } else return new Vect()
    },
    Gravitation: (mass1, mesh, Kg) => {
        // calculates gravitational force via Newton's Law.
        // This is O(n^2) make sure mesh has less than 1000 masses for this.
        return mesh.reduce((gSum, mass2) => {
            if (mass1 !== mass2 && !mass1.Pi.compare(mass2.Pi, mass1.rad)) {
                let r = mass1.Pi.sub(mass2.Pi)
                return gSum.sum(r.unit().mul(-Kg * mass1.mass * mass2.mass / r.magSq()))
            } else return gSum
        }, new Vect())
    },
    Brownian: (factor) => {
        const signedRand = () => 2 * (Math.random() - 0.5) // random value from -1 to 1
        return new Vect(factor * signedRand(), factor * signedRand())
    },
    SquishyBounds: (boundary, mass, factorS) => {
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
}

// generates shapes and adds them to the mesh.
const Builders = {
    FullLinkCreate: function(vertices, property, spr, damp, engine) {
        const masses = vertices.map(vertex => new Mass(property, vertex, vertex))
        masses.forEach(mass => engine.addM(mass))
        engine.mesh.forEach(mass => {
            engine.mesh.forEach(otherM => {
                if (otherM !== mass && masses.find(m => m === mass) && masses.find(m => m === otherM)) {
                    engine.addS(mass, otherM, new Spring(mass.Pi.sub(otherM.Pi).mag(), spr, damp))
                }
            })
        })
    },
    generateLine: function(coordA, coordB, prop, spr, damp, eng) {
        let segAB = {x: coordA.x - coordB.x, y: coordA.y - coordB.y}
        let restlength = Math.sqrt(segAB.x * segAB.x + segAB.y * segAB.y)
        let m1 = new Mass(prop, coordA) 
        let m2 = new Mass(prop, coordB) 
        eng.addM(m1)
        eng.addM(m2)
        eng.addS(m1, m2, new Spring(restlength, spr, damp))
    },
    generateBox: function(x, y, w, h, prop, spr, damp, eng) {
        const vertices = [
            {x: x, y: y},
            {x: x + w, y: y},
            {x: x + w, y: y + h},
            {x: x, y: y + h}
        ]
        this.FullLinkCreate(vertices, Object.assign({}, prop), spr, damp, eng)
    },
    generateTriangle: function(x, y, b, h, prop, spr, damp, eng) {
        const vertices = [
            {x: x, y: y},
            {x: x + b, y: y},
            {x: x + b / 2, y: y + h}
        ]
        this.FullLinkCreate(vertices, Object.assign({}, prop), spr, damp, eng)
    },
    generateBlob: function(x, y, w, h, N, prop, spr, damp, eng) {
        const randCoord = (p, l) => Math.random() * (l - p) + p
        const vertices = []
        for (let i = 0; i < N; i++) {
            vertices.push({x: randCoord(x, w), y: randCoord(y, h)})
        }
        this.FullLinkCreate(vertices, Object.assign({}, prop), spr, damp, eng)
    }
};
