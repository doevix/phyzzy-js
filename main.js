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
    if (n_V.F.y === 0) {
        this.F.y = 0;
    }
};

var mesh = new Mesh(), // create empty mesh
    ph = new Phyz(mesh, 100, document.getElementById('viewPort')),
    en = new Environment(9.81, 10),
    colBox = new WallBox(0, 0, ph.toM(ph.viewer.width), ph.toM(ph.viewer.height)),
    pos = new Vect(ph.toM(ph.viewer.width / 2), 0.05),
    vel = new Vect(),
    d = new Date(),
    dt_i = 1 / 50,
    dt_o = 1 / 50,
    i;
    
ph.mesh.addM(0.1, 0.05, 0.8, 0, 0, pos, vel);
ph.mesh.addM(0.5, 0.05, 0.7, 0, 0, pos, vel);
ph.mesh.m[1].fixed = true;
ph.mesh.m[0].Po = ph.mesh.m[0].Po.sub(new Vect(0.03, 0));
function frame(timeStamp) {
    'use strict';
    for (i = 0; i < ph.mesh.m.length; i += 1) {
        ph.mesh.applyForce(i, en);
    }
    ph.mesh.calc(en, dt_i, dt_o);
    for (i = 0; i < ph.mesh.m.length; i += 1) {
        ph.mesh.m[i].applyCol(colBox.checkBound(ph.mesh.m[i], dt_i, en.grav));
    }
    ph.refreshFrame();
    window.requestAnimationFrame(frame);
}

frame();