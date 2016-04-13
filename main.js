// main.js
/*
    Main program for Phyzzy webapp
*/

Mesh.prototype.applyForce = function (idx, en) {
    'use strict';
    this.m[idx].F.equ(this.m[idx].W(en.grav, new Vect(0, 1)).sum(this.Fs(idx)));
};
// directly changes implicit velocity of mass (P and P_old) input is structure with Pi and Po vectors.
Mass.prototype.applyCol = function (n_V) {
    'use strict';  
    if (!this.Pi.equChk(n_V.Pi)) {
        this.Pi.equ(n_V.Pi);
    }
    if (!this.Po.equChk(n_V.Po)) {
        this.Po.equ(n_V.Po);
    }
};
function WallBox(x, y, w, h) {
    'use strict';
    this.x = x; // origin x
    this.y = y; // origin y
    this.w = w; // width
    this.h = h; // height
}
WallBox.prototype.checkBound = function (m, dt) {
    'use strict';
    var v1 = new Vect((m.Pi.x - m.Po.x) / dt, (m.Pi.y - m.Po.y) / dt),
        v2 = new Vect(),
        n_Po = new Vect(m.Po.x, m.Po.y),
        n_Pi = new Vect(m.Pi.x, m.Pi.y),
        tol = (1 / 2) * m.rad; // minimum distance to consider to prevent zeno-behavior
    
    if (m.Pi.y > this.h - m.rad) { // hits bottom of box
        n_Po.y = this.h - m.rad;
        v2.y = -m.refl * v1.y;
        n_Pi.y = (v2.y * dt) + n_Po.y;
        if (n_Pi.y - n_Po < tol) {
            n_Pi = n_Po;
        }
    } else if (m.Pi.y < this.y + m.rad) { // hits top of box
        n_Po.y = this.y + m.rad;
        v2.y = -m.refl * v1.y;
        n_Pi.y = (v2.y * dt) + n_Po.y;
    }
    if (m.Pi.x > this.w - m.rad) { // hits right side of box
        n_Po.x = this.h - m.rad;
        v2.x = -m.refl * v1.x;
        n_Pi.x = v2.x * dt + n_Po.y;
    } else if (m.Pi.x < this.x + m.rad) { // hits left side of box
        n_Po.x = this.h - m.rad;
        v2.x = -m.refl * v1.x;
        n_Pi.x = v2.x * dt + n_Po.y;
    }
    return {Po: n_Po, Pi: n_Pi};
};

var mesh = new Mesh(), // create empty mesh
    ph = new Phyz(mesh, 100, document.getElementById('viewPort')),
    en = new Environment(9.81, 10),
    colBox = new WallBox(0, 0, ph.toM(ph.viewer.width), ph.toM(ph.viewer.height)),
    pos = new Vect(ph.toM(ph.viewer.width / 2), 0.05),
    vel = new Vect(),
    dt = 1 / 60,
    dt_old = 1 / 60,
    sForce,
    i,
    v1y,
    v2y;
    
ph.mesh.addM(0.5, 0.05, 0.7, 0, 0, pos, vel);

function frame(timeStamp) {
    'use strict';
    for (i = 0; i < ph.mesh.m.length; i += 1) {
        ph.mesh.applyForce(i, en);
    }
    ph.mesh.calc(en, dt, dt_old);
    for (i = 0; i < ph.mesh.m.length; i += 1) {
        ph.mesh.m[i].applyCol(colBox.checkBound(ph.mesh.m[i], dt));
        /*if (ph.mesh.m[i].Pi.y > ph.toM(ph.viewer.height) - ph.mesh.m[i].rad) {
            v1y = (ph.mesh.m[i].Pi.y - ph.mesh.m[i].Po.y) / dt;
            ph.mesh.m[i].Poy = ph.toM(ph.viewer.height) - ph.mesh.m[i].rad;
            v2y = v1y * -ph.mesh.m[i].refl;
            ph.mesh.m[i].Pi.y = v2y * (dt) + ph.mesh.m[i].Po.y;
        }*/
    }
    
    ph.refreshFrame();
    window.requestAnimationFrame(frame);
}

frame();