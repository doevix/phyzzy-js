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

var mesh = new Mesh(), // create empty mesh
    ph = new Phyz(mesh, document.getElementById('viewPort'), 100),
    en = new Environment(9.81, 10),
    colBox = new WallBox(0, 0, ph.toM(ph.viewer.width), ph.toM(ph.viewer.height)),
    pos = new Vect(ph.toM(ph.viewer.width / 2), 0.05),
    vel = new Vect(),
    dt_i = 1 / 50,
    dt_o = 1 / 50,
    i;

ph.mesh.addM(0.5, 0.05, 0.75, 0, 0, new Vect(1, 1));
ph.mesh.addM(0.5, 0.05, 0.75, 0, 0, new Vect(1, 2));
ph.mesh.addM(0.5, 0.05, 0.75, 0, 0, new Vect(2, 1));
ph.mesh.addM(0.5, 0.05, 0.75, 0, 0, new Vect(2, 2));

ph.mesh.addS(0, 1, 1, 100, 0);
ph.mesh.addS(1, 2, 1, 100, 0);
ph.mesh.addS(2, 3, 1, 100, 0);
ph.mesh.addS(0, 3, 1, 100, 0);
ph.mesh.addS(2, 0, 1, 100, 0);
ph.mesh.addS(1, 3, 1, 100, 0);

ph.mesh.remM(3);

function frame() {
    'use strict';
    for (i = 0; i < ph.mesh.m.length; i += 1) {
        ph.mesh.applyForce(i, en);
    }
    for (i = 0; i < ph.mesh.m.length; i += 1) {
        ph.mesh.m[i].applyCol(colBox.checkBound(ph.mesh.m[i], dt_i));
    }
    ph.mesh.calc(en, dt_i, dt_o);
    ph.refreshFrame();
    window.requestAnimationFrame(frame);
}

frame();