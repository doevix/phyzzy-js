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
    if (this.m[idxA].branch.indexOf(idxB) < 0 
        && this.m[idxB].branch.indexOf(idxA) < 0
        && idxA !== idxB) {
        // only adds a new spring when two masses haven't been linked yet and when they are two unique masses
        this.s.push(new Spring(r, k, B));
        // links the two given masses together
        this.m[idxA].branch.push({linkTo: idxB, sIdx: this.s.length - 1});
        this.m[idxB].branch.push({linkTo: idxA, sIdx: this.s.length - 1});
        return true;
    } else {
        // returns false if there is already a spring connecting the masses.
        return false;
    }
};

// Removes a spring from the mesh (removes links in mass's branch array)
Mesh.prototype.remS = function (idx) {
    'use strict';
    let i, j;
    if (idx < 0 || this.s.length <= idx) { // ensures an inexistant spring won't be removed
        return false;
    }
    this.s.splice(idx, 1); // remove spring from mesh

    // TODO: Change the following into a more functional solution.
    // Removes links from mass branches.
    for (let m of this.m) { // look through each mass in the mesh
        for (j = 0; j < m.branch.length; j += 1) { // look through mass branch array
            if (m.branch[j].sIdx === idx) { // remove link if it exists
                m.branch.splice(j, 1);
            }
            for (let b of m.branch) {
                if (b.sIdx > idx) { // fix index of springs greater than idx
                    b.sIdx -= 1;
                }
            }
        }
    }
    return true;
};

// Calculates force applied by spring that links two masses.
Mesh.prototype.Fs = function (mIdx, dt) {
    'use strict';
    let i,
        mA = this.m[mIdx], // current mass position
        mB,
        seg,
        spr,
        spd,
        F = new Vect(),
        pVel;
    for (i = 0; i < mA.branch.length; i += 1) {
        mB = this.m[mA.branch[i].linkTo]; // connected mass position

        pVel = mB.calcVel(dt).sub(mA.calcVel(dt)).pjt(seg);
        seg = mB.Pi.sub(mA.Pi);
        spr = this.s[mA.branch[i].sIdx]; // spring that connects masses
        F.sumTo(seg.unit().mul(spr.Fk(seg.mag()))); // force calculation
        F.sumTo(spr.Fd(pVel));
    }
    return F;
};

// Removes a mass from the mesh. (removes mass and links to other masses)
Mesh.prototype.remM = function (idx) {
    'use strict';
    let i, j;
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
    'use strict';
    let i, W, S, R;
    for (i = 0; i < this.m.length; i += 1) {
        if (!this.m[i].fixed) { // only applies forces if masses are free to move
            W = this.m[i].W(en.grav, en.bounds.gdir); // get weight
            S = this.Fs(i); // get spring pull
            R = this.m[i].drg(en.drag, en.dt_i); // get air resistence
            this.m[i].F.equ(W.sum(S).sum(R)); // sum forces to F
        } else {
            this.m[i].F.clr();
        }
    }
};

// calculates positions of each mass
Mesh.prototype.calc = function (dt_i, dt_o) {
    'use strict';
    let n_P = new Vect(), decel;
    for (let m of this.m) {
        n_P.equ(m.verlet(dt_i, dt_o)); // Calculate new position.
        m.Po.equ(m.Pi); // moves current value to become old value
        m.Pi.equ(n_P); // Sets new position for current frame
    }
};

// applies collisions
Mesh.prototype.coll = function (env) {
    'use strict';
    let n_m;
    for (let m of this.m) {
        n_m = env.bounds.checkBound(m, env.dt_i);
        m.modMov(n_m);
    }
};

// draws the set of masses that are part of the mesh (canvas API)
Mesh.prototype.drawM = function (ctx, scale, hov) {
    'use strict';
    for (let mass of this.m) {
        mass.draw(ctx, scale);
    }
    if (hov >= 0) {
        ctx.beginPath();
        ctx.arc(
            this.m[hov].Pi.x * scale,
            this.m[hov].Pi.y * scale,
            this.m[hov].rad * scale + 5,
            0, Math.PI * 2, false
        );
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#00FF44';
        ctx.stroke();
        ctx.closePath();
    }
};

// draws the set of springs that are part of the mesh (canvas API)
Mesh.prototype.drawS = function (ctx, scale) {
    'use strict';
    let idxB, x1, y1, x2, y2,
        drawnS = [];
    for (let m of this.m) {
        for (let b of m.branch) {
            if (drawnS.indexOf(b.sIdx) < 0) {
                drawnS.push(b.sIdx);
                idxB = b.linkTo;

                x1 = m.Pi.x * scale;
                y1 = m.Pi.y * scale;
                x2 = this.m[idxB].Pi.x * scale;
                y2 = this.m[idxB].Pi.y * scale;

                ctx.beginPath();
                ctx.moveTo(x1.toFixed(2), y1.toFixed(2));
                ctx.lineTo(x2.toFixed(2), y2.toFixed(2));
                ctx.lineWidth = Math.floor(this.s[b.sIdx].w * scale);
                ctx.strokeStyle = '#005555';
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
};

/*
    Shape generation for quick testing.
*/
// Creates a box with braces
Mesh.prototype.generateBox = function (mass, rad, refl, mus, muk, k, b, x, y, w, h) {
    'use strict';
    let i,
        wid = Math.abs(x - w),
        hig = Math.abs(y - h);
    this.addM(mass, rad, refl, mus, muk, new Vect(x, y));
    this.addM(mass, rad, refl, mus, muk, new Vect(x, h));
    this.addM(mass, rad, refl, mus, muk, new Vect(w, y));
    this.addM(mass, rad, refl, mus, muk, new Vect(w, h));

    this.addS(this.m.length - 4, this.m.length - 3, Math.abs(hig), k, b);
    this.addS(this.m.length - 4, this.m.length - 2, Math.abs(wid), k, b);
    this.addS(this.m.length - 1, this.m.length - 3, Math.abs(wid), k, b);
    this.addS(this.m.length - 1, this.m.length - 2, Math.abs(hig), k, b);

    this.addS(this.m.length - 4, this.m.length - 1, Math.sqrt(wid * wid + hig * hig), k, b);
    this.addS(this.m.length - 3, this.m.length - 2, Math.sqrt(wid * wid + hig * hig), k, b);
};

Mesh.prototype.generateBlob = function (n, x, y, w, h) {
    'use strict';
    let i, pos, f,
        randIdx1, randIdx2;
    for (i = 0; i < n; i += 1) {
        pos = new Vect(Math.random() * (w - x) + x, Math.random() * (h - x) + x);
        this.addM(Math.random() * 10 + 0.5,
                  Math.random() * 0.08 + 0.05,
                  0.75, 0, 0, pos);
    }

    f = n * 2;

    for (i = 0; i < f; i += 1) {
        randIdx1 = Math.floor(Math.random() * n) + this.m.length - n;
        randIdx2 = Math.floor(Math.random() * n) + this.m.length - n;
        this.addS(randIdx1, randIdx2, Math.random() * 4, Math.random() * 100, Math.random() * 0.5, Math.random() * 0.02);
    }
};

module.exports = {
    Mesh: Mesh
};