// obj.js
/*
    Objects that are used in simulation.
    - Mass
    - Spring
    - Environment
    - Collision bounds
*/
// Have mass and obey laws given (inputs P & V MUST be Vect() objects)
function Mass(mass, rad, refl, mu_s, mu_k, P) {
    'use strict';
    this.mass = mass; // Mass [kg]
    this.rad = rad; // Radius [m]
    this.mu_s = mu_s; // Static surface friction coefficient [1]
    this.mu_k = mu_k; // Dynamic surface friction coefficient [1]
    this.refl = refl; // Surface reflection (bouncyness) [1]
    
    this.fixed = false;
    
    this.F = new Vect(); // total force applied to mass
    this.Pi = Object.create(P); // Create mass with Velocity of 0
    this.Po = Object.create(P);
    
    this.branch = []; // stores the index of other masses the current is connected to (for quicker calculation)
}
/*
    Basic force calculations for Mass object.
*/
// returns the mass's weight vector [N]
Mass.prototype.W = function (grav, U) { // U is the unit vector of the direction of gravity's pull
    'use strict';
    return U.mul(this.mass * grav);
};

// returns the vector of drag resistence applied to the mass. Note: Dissipating forces should be calculated last.
Mass.prototype.drg = function (drag, dt, dt_old) {
    'use strict';
    var V = this.calcVel(dt),
        qVel = this.verlet(dt, dt_old, V.mul(-drag)).sub(this.Pi).div(dt); // checks next step with drag involved.
    if (this.F.magSq() - V.mul(-drag).magSq() > 0) {
        return V.mul(-drag);
    } else {
        return this.F.mul(-1);
    }
};

// applies a sudden change in current and last positions
Mass.prototype.modMov = function (n_m) {
    'use strict';
    if (!this.Pi.equChk(n_m.Pi)) {
        this.Pi.equ(n_m.Pi);
    }
    if (!this.Po.equChk(n_m.Po)) {
        this.Po.equ(n_m.Po);
    }
};

/*
    Velocity and position calculations for mass (based on acceleration by forces)
*/
// Calculates the current velocity of the mass. In case it is necessary to obtain the velocity of the mass.
Mass.prototype.calcVel = function (dt) {
    'use strict';
    return this.Pi.sub(this.Po).div(dt);
};

// Calculates Po vector for an implicit velocity.
Mass.prototype.calcPo = function (V, dt) {
    'use strict';
    //  n_m.Po.x = n_m.Pi.x - (v2.x * dt);
    return this.Pi.sub(V.mul(dt));
};

// Verlet integrator to calculate new position.
Mass.prototype.verlet = function (dt, dt_old, F_ex) {
    'use strict';
    dt_old = dt_old || 0;
    F_ex = F_ex || new Vect(); // can be omitted, but useful if necessary to "predict" a position or apply a field
    if (!this.fixed) { // if free to move: Pi = Pi + (Pi - Po)*(dt_i/dt_o) + (F/m)*(dt^2)
        return this.Pi.sum(this.Pi.sub(this.Po)).mul(dt / dt_old).sum(this.F.sum(F_ex).div(this.mass).mul(dt * dt));
    } else { // if fixed: simply return the value.
        return Object.create(this.Pi);
    }
};

/*
    Other functions for mass
*/
// Draws the mass onto canvas.
Mass.prototype.draw = function (ctx, scale) {
    'use strict';
    ctx.beginPath();
    ctx.arc(this.Pi.x * scale,
            this.Pi.y * scale,
            this.rad * scale,
            0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
};

// Connect masses and have own properties
function Spring(r, k, B, w) {
    'use strict';
    this.r = r; // restlength [m]
    this.k = k; // restitution [N/m]
    this.B = B; // damping
    this.w = w || 0.015;
}

// returns the spring's compression force [N]
Spring.prototype.Fk = function (len) {
    'use strict';
    return (len - this.r) * this.k;
};

// returns the spring's damping force [N]
Spring.prototype.Fd = function (m1, m2, dt) {
    'use strict';
    return m1.calcVel(dt).sub(m2.calcVel).pjt(m2.Pi.sub(m1.Pi));
};

// Properties of containing area
function Environment(grav, drag, bounds) {
    'use strict';
    this.grav = grav; // Gravity [m / s^2]
    this.drag = drag; // Drag coefficient [N * s / m]
    this.bounds = bounds || new Space();
}

/*
    Bounds.
    Note: if a custom bounding is to be used, a gdir vector and a checkBound property MUST be declared.
    gdir must be a unit vector
    checkBound must have an input mass and dt. Must also return a copy of the input mass.
*/
// creates an empty boundless space. Used when no bounds are selected.
function Space () {
    'use strict';
    this.gdir = new Vect();
};
Space.prototype.checkBound = function (m) {
    return m;
};
// Creates a box that contains the mesh and limits the area.
function WallBox(x, y, w, h, gdir) {
    'use strict';
    this.x = x; // origin x
    this.y = y; // origin y
    this.w = w; // width
    this.h = h; // height
    this.gdir = gdir.unit() || new Vect(); // direction of gravity
}

// returns new positions for the bounds
WallBox.prototype.checkBound = function (m, dt) {
    'use strict';
    var v1 = new Vect((m.Pi.x - m.Po.x) / dt, (m.Pi.y - m.Po.y) / dt),
        v2 = m.calcVel(dt),
        v,
        n_m = Object.create(m); // makes a temporary instance of the input mass to modify.
    // hits bottom of box
    if (m.Pi.y > this.h - m.rad) {
        n_m.Pi.y = this.h - m.rad;
        v2.y = -m.refl * v1.y;
        n_m.Po.y = n_m.Pi.y - (v2.y * dt);
    // hits top of box
    } else if (m.Pi.y < this.y + m.rad) {
        n_m.Pi.y = this.y + m.rad;
        v2.y = -m.refl * v1.y;
        n_m.Po.y = n_m.Pi.y - (v2.y * dt);
    }
    // hits right side of box
    if (m.Pi.x > this.w - m.rad) {
        n_m.Pi.x = this.w - m.rad;
        v2.x = -m.refl * v1.x;
        n_m.Po.x = n_m.Pi.x - (v2.x * dt);
    // hits left side of box
    } else if (m.Pi.x < this.x + m.rad) {
        n_m.Pi.x = this.x + m.rad;
        v2.x = -m.refl * v1.x;
        n_m.Po.x = n_m.Pi.x - (v2.x * dt);
    }
    return n_m;
};
