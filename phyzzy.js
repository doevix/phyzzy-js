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
// check if vector is equal to another
Vect.prototype.equChk = function (V) {
    'use strict';
    if (V.x === this.x && V.y === this.y) {
        return true;
    } else {
        return false;
    }
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
    
    this.F = new Vect(); // total force applied to mass
    this.P = P;
    this.P_old = new Vect(P.x, P.y);
    
    this.branch = []; // stores the index of other masses the current is connected to (for quicker calculation)
}

/*
    Basic force calculations for Mass object.
*/
// returns the mass's weight vector [N]
Mass.prototype.W = function (grav, U) {
    'use strict';
    return U.mul(this.mass * grav);
};
// returns the vector of drag resistence applied to the mass. Note: Dissipating forces should be calculated last.
Mass.prototype.drag = function (drag, dt, dt_old) {
    'use strict';
    var V = this.calcVel(dt),
        qVel = this.verlet(dt, dt_old, V.mul(-drag)).sub(this.P).div(dt); // checks next step with drag involved.
    if (this.F.magSq() - V.mul(-drag).magSq() > 0) {
        return V.mul(-drag);
    } else {
        return this.F.mul(-1);
    }
    
};

/*
    Velocity and position calculations for mass (based on acceleration by forces)
*/
// Calculates the current velocity of the mass. In case it is necessary to obtain the velocity of the mass.
Mass.prototype.calcVel = function (dt) {
    'use strict';
    return this.P.sub(this.P_old).div(dt);
};
// Verlet integrator to calculate new position.
Mass.prototype.verlet = function (dt, dt_old, F_ex) {
    'use strict';
    dt_old = dt_old || 0;
    F_ex = F_ex || new Vect(); // can be omitted, but useful if necessary to "predict" a position
    return this.P.sum(this.P.sub(this.P_old)).mul(dt / dt_old).sum(this.F.sum(F_ex).div(this.mass).mul(dt * dt));
};

// Connect masses and have own properties
function Spring(r, k, B) {
    'use strict';
    this.r = r; // restlength [m]
    this.k = k; // restitution [N/m]
    this.B = B; // damping
}
// returns the spring's compression force [N]
Spring.prototype.Fk = function (len) {
    'use strict';
    return (len - this.r) * this.k;
};

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
Mesh.prototype.addS = function (idxA, idxB, r, k, B) {
    'use strict';
    this.s.push(new Spring(r, k, B));
    // links the two given masses together
    this.m[idxA].branch.push(new LinkData(idxB, this.s.length - 1));
    this.m[idxB].branch.push(new LinkData(idxA, this.s.length - 1));
};
// Removes a spring from the mesh (removes links in mass's branch array)
Mesh.prototype.remS = function (idx) {
    'use strict';
    var i, j;
    if (idx < 0 || this.s.length <= idx) { // ensures an inexistant spring won't be removed
        return false;
    }
    this.s.splice(idx, 1); // remove spring from mesh
    for (i = 0; i < this.m.length; i += 1) { // look through each mass in the mesh
        for (j = 0; j < this.m[i].branch.length; j += 1) { // look through mass branch array
            if (this.m[i].branch[j].sIdx === idx) { // remove link if it exists
                this.m[i].branch.splice(j, 1);
            } else if (this.m[i].branch[j].sIdx > idx) { // fix index of springs greater than idx
                this.m[i].branch[j].sIdx -= 1;
            }
        }
    }
    
    return true;
};
Mesh.prototype.Fs = function (mIdx) {
    'use strict';
    var i,
        mA = this.m[mIdx], // current mass position
        mB,
        seg,
        spr,
        F = new Vect();
    for (i = 0; i < mA.branch.length; i += 1) {
        mB = this.m[mA.branch[i].linkTo]; // connected mass position
        seg = mB.P.sub(mA.P);
        spr = this.s[mA.branch[i].sIdx];
        F.equ(F.sum(seg.unit().mul(spr.Fk(seg.mag()))));
    }
    return F;
};
// Removes a mass from the mesh. (removes mass and links to other masses)
Mesh.prototype.remM = function (idx) {
    'use strict';
    var i, j;
    if (idx < 0 || this.m.length <= idx) { // ensures an inexistant mass won't be removed
        return false;
    }
    for (i = 0; i < this.m[idx].branch.length; i += 1) { // remove any links that connect to the mass
        this.remS(this.m[idx].branch[i].sIdx);
    }
    this.m.splice(idx, 1); // remove the mass
    for (i = 0; i < this.m.length; i += 0) {// look through each mass in the mesh
        for (j = 0; j < this.m[i].branch.length; j += 1) { // look through mass branch array
            if (this.m[i].branch[j].sIdx > idx) {
                this.m[i].branch[j].sIdx -= 1; // fix index of masses greater than idx
            }
        }
    }
    
    return true;
};

// Phyzzy simulation. Can be used to display mesh, or calculate mesh only.
function Phyz(mesh, scale, viewPort, style) {
    'use strict';
    this.mesh = mesh; // the mesh is generated seperately for preloading or multiple simulations.
    this.viewer = viewPort || null; // where to display. Null if omitted
    this.ctx = viewPort !== null ? this.viewer.getContext('2d') : null; // canvas context
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
Phyz.prototype.calcMesh = function (env, dt, dt_old) {
    'use strict';
    dt_old = dt_old || dt; // if time correction is not required, dt_old can be omitted
    var i,
        n_P = new Vect();
    for (i = 0; i < this.mesh.m.length; i += 1) {
        n_P.equ(this.mesh.m[i].verlet(dt, dt_old)); // Calculate new position.
        this.mesh.m[i].P_old.equ(this.mesh.m[i].P); // moves current value to become old value for next frame
        this.mesh.m[i].P.equ(n_P); // Sets new position for current frame
    }
};
Phyz.prototype.refreshFrame = function () { // Clears and redraws the mesh
    'use strict';
    var i, j, idxB,
        drawnS = [];
    this.ctx.clearRect(0, 0, this.viewer.width, this.viewer.height);
    for (i = 0; i < this.mesh.m.length; i += 1) {
        for (j = 0; j < this.mesh.m[i].branch.length; j += 1) {
            if (drawnS.indexOf(this.mesh.m[i].branch[j].sIdx) < 0) {
                drawnS.push(this.mesh.m[i].branch[j].sIdx);
                idxB = this.mesh.m[i].branch[j].linkTo;
                this.ctx.beginPath();
                this.ctx.moveTo(this.toPx(this.mesh.m[i].P.x), this.toPx(this.mesh.m[i].P.y));
                this.ctx.lineTo(this.toPx(this.mesh.m[idxB].P.x), this.toPx(this.mesh.m[idxB].P.y));
                this.ctx.stroke();
                this.ctx.closePath();
            }
        }
        
    }
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