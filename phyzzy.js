// phyzzy.js
/*
    Library for 2D spring/mass simulation.
    Draws masses and springs on given canvas.
    Requires external loop for simulation
    External drawing can be used to render mesh.
*/

// Vector object with vector math
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
    return new Vect(this.x / s, this.y / s);
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
    return Math.sqrt(this.magSq);
};
// dot product
Vect.prototype.dot = function (A) {
    'use strict';
    return this.x * A.x + this.y * A.y;
};
// find unit vector of current
Vect.prototype.unit = function () {
    'use strict';
    return this.div(this.mag(false));
};

// Stores the masses' links for springing. Contains linked mass's index and spring's index
function LinkData(linkTo, sIdx) {
    'use strict';
    this.linkTo = linkTo;
    this.sIdx = sIdx;
}

// Have mass and obey laws given (inputs P & V MUST be Vect() objects)
function Mass(mass, rad, refl, mu_s, mu_k, P, V) {
    'use strict';
    this.mass = mass; // Mass [kg]
    this.rad = rad; // Radius [m]
    this.mu_s = mu_s; // Static surface friction coefficient [1]
    this.mu_k = mu_k; // Dynamic surface friction coefficient [1]
    this.refl = refl; // Surface reflection (bouncyness) [1]
    this.fixed = false;
    this.P = P;
    this.V = V;
    this.P_old = new Vect(P.x, P.y);
    this.branch = []; // stores the index of other masses the current is connected to (for quicker calculation)
}

// Connect masses and have own properties
function Spring(r, k, B) {
    'use strict';
    this.r = r; // restlength [m]
    this.k = k; // restitution [N/m]
    this.B = B; // damping
}

// Properties of containing area
function Environment(grav, drag) {
    'use strict';
    this.grav = grav; // Gravity [m / s^2]
    this.drag = drag; // Drag coefficient [N * s / m]
}

// Holds a collection of masses and springs
function Mesh() {
    'use strict';
    this.m = []; // mass array
    this.s = []; // spring array
}
// Adds a new mass to the mesh
Mesh.prototype.addM = function (mass, rad, refl, mu_s, mu_k, P, V) { // redundant, but useful for clarity
    'use strict';
    this.m.push(new Mass(mass, rad, refl, mu_s, mu_k, P, V));
};
// Adds a new spring to the mesh
Mesh.prototype.addS = function (massA, massB, r, k, B) {
    'use strict';
    this.s.push(new Spring(r, k, B));
    // links the two given masses together
    this.m[massA].branch.push(new LinkData(massB, this.s.length - 1));
    this.m[massB].branch.push(new LinkData(massA, this.s.length - 1));
};

// Phyzzy simulation. Can be used to only calculate mesh, or to calculate 
function Phyz(mesh, scale, viewPort, style) {
    'use strict';
    this.mesh = mesh; // the mesh is generated seperately for preloading or multiple simulations.
    this.viewer = viewPort || 'null'; // where to display. Null if omitted
    this.ctx = viewPort !== 'null' ? this.viewer.getContext('2d') : null; // canvas context
    this.scale = scale; // size of 1 meter in pixels
    this.play = false; // false = paused; true = playing
    this.cons = false; // false = select mode; true = construct mode
}
// converts meters to pixels according to scale
Phyz.prototype.toPx = function (mt) {
    'use strict';
    return mt * this.scale;
};
// converts pixels to meters according to scale
Phyz.prototype.toM = function (px) {
    'use strict';
    return px / this.scale;
};
// calculates positions of each mass for new frame
Phyz.prototype.calcMesh = function (env, dt, dt_old) { // Uses Time-Corrected Verlet integration to calculate
    'use strict';
    dt_old = dt_old || dt; // if time correction is not required, dt_old can be omitted
    var i,
        acc = new Vect(),
        n_P = new Vect();
    
    for (i = 0; i < this.mesh.m.length; i += 1) {
        acc.y = this.mesh.m[i].mass * env.grav;
        acc = acc.div(this.mesh.m[i].mass);
        // Calculate new position
        n_P = this.mesh.m[i].P.sum(this.mesh.m[i].P.sub(this.mesh.m[i].P_old)).mul(dt / dt_old).sum(acc.mul(dt * dt));
        
        this.mesh.m[i].P_old.equ(this.mesh.m[i].P); // moves current value to become old value for next frame
        this.mesh.m[i].P.equ(n_P); // Sets new position for current frame
    }
};
Phyz.prototype.refreshFrame = function () { // Clears and redraws the mesh
    'use strict';
    var i;
    this.ctx.clearRect(0, 0, this.viewer.width, this.viewer.height);
    for (i = 0; i < this.mesh.m.length; i += 1) {
        this.ctx.beginPath();
        this.ctx.arc(this.toPx(this.mesh.m[i].P.x),
                this.toPx(this.mesh.m[i].P.y),
                this.toPx(this.mesh.m[i].rad),
                0,
                2 * Math.PI,
                false
               );
        this.ctx.fill();
        this.ctx.closePath();
    }
};