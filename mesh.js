// mesh.js
/*
    Handles a collection of masses of springs to simulate.
*/

// Stores the masses' links for springing. Contains linked mass's index and spring's index
function LinkData(linkTo, sIdx) {
    'use strict';
    this.linkTo = linkTo;
    this.sIdx = sIdx;
}

// Holds a collection of masses and springs
function Mesh() {
    'use strict';
    this.m = []; // mass array
    this.s = []; // spring array
}

// Adds a new mass to the mesh
Mesh.prototype.addM = function (mass, rad, refl, mu_s, mu_k, P) { // redundant, but useful for clarity
    'use strict';
    this.m.push(new Mass(mass, rad, refl, mu_s, mu_k, P));
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
            }
            for (j = 0; j < this.m[i].branch.length; j += 1) {
                if (this.m[i].branch[j].sIdx > idx) { // fix index of springs greater than idx
                    this.m[i].branch[j].sIdx -= 1;
                }
            }
        }
    }
    return true;
};

// Calculates force applied by spring that links two masses.
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
        seg = mB.Pi.sub(mA.Pi);
        spr = this.s[mA.branch[i].sIdx]; // spring that connects masses
        F.sumTo(seg.unit().mul(spr.Fk(seg.mag())));
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
    for (i = 0; i < this.m.length; i += 1) {// look through each mass in the mesh
        for (j = 0; j < this.m[i].branch.length; j += 1) { // look through mass branch array
            if (this.m[i].branch[j].linkTo === idx) {
                this.m[i].branch.splice(j, 1); // fix index of masses greater than idx
            }
        }
        for (j = 0; j < this.m[i].branch.length; j += 1) { // look through mass branch array
            if (this.m[i].branch[j].linkTo > idx) {
                this.m[i].branch[j].linkTo -= 1; // fix index of masses greater than idx
            }
        }
    }
    return true;
};

// applies basic forces.
Mesh.prototype.applyForce = function (en) { // applies basic forces
        var i, W, S;
        for (i = 0; i < this.m.length; i += 1) {
            if (!this.m[i].fixed) { // only applies forces if masses are free to move
                W = this.m[i].W(en.grav, en.bounds.gdir); // get weight
                S = this.Fs(i); // get spring pull
                this.m[i].F.equ(W.sum(S));
            } else {
                this.m[i].F.equ = new Vect();
            }
        }
    };

// calculates positions of each mass
Mesh.prototype.calc = function (env, dt, dt_old) {
    'use strict';
    dt_old = dt_old || dt; // if time correction is not required, dt_old can be omitted
    var i,
        n_P = new Vect();
    for (i = 0; i < this.m.length; i += 1) {
        n_P.equ(this.m[i].verlet(dt, dt_old)); // Calculate new position.
        this.m[i].Po.equ(this.m[i].Pi); // moves current value to become old value
        this.m[i].Pi.equ(n_P); // Sets new position for current frame
    }
};

// applies collisions
Mesh.prototype.coll = function (env, dt) {
    'use strict';
    var n_m, i;
    for (i = 0; i < this.m.length; i += 1) {
        n_m = env.bounds.checkBound(this.m[i], dt);
        this.m[i].modMov(n_m);
    }
};

// draws the set of masses that are part of the mesh (canvas API)
Mesh.prototype.drawM = function (ctx, scale) {
    'use strict';
    var i;
    for (i = 0; i < this.m.length; i += 1) {
        this.m[i].draw(ctx, scale);
    }
};

// draws the set of springs that are part of the mesh (canvas API)
Mesh.prototype.drawS = function (ctx, scale) {
    'use strict';
    var i, j, idxB,
        drawnS = [];
    for (i = 0; i < this.m.length; i += 1) {
        for (j = 0; j < this.m[i].branch.length; j += 1) {
            if (drawnS.indexOf(this.m[i].branch[j].sIdx) < 0) {
                drawnS.push(this.m[i].branch[j].sIdx);
                idxB = this.m[i].branch[j].linkTo;
                ctx.beginPath();
                ctx.moveTo(this.m[i].Pi.x * scale, this.m[i].Pi.y * scale);
                ctx.lineTo(this.m[idxB].Pi.x * scale, this.m[idxB].Pi.y * scale);
                ctx.lineWidth = this.s[this.m[i].branch[j].sIdx].w * scale;
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
};