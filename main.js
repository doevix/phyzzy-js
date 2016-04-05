// main.js
/*
    Main program for Phyzzy webapp
*/
var mesh = new Mesh(), // create empty mesh
    ph = new Phyz(mesh, 100, document.getElementById('viewPort')),
    en = new Environment(9.81, 10),
    pos = new Vect(ph.toM(ph.viewer.width / 2), 0.05),
    vel = new Vect(),
    sForce,
    i,
    v1y,
    v2y;
    
ph.mesh.addM(0.5, 0.05, 0.7, 0, 0, pos, vel);
ph.mesh.addM(0.5, 0.05, 0.7, 0, 0, pos.sum(new Vect(1, 0)), vel);
ph.mesh.addS(0, 1, 1, 100, 0.1);

function main() {
    'use strict';
    ph.mesh.m[0].F.equ(ph.mesh.m[0].W(en.grav, new Vect(0, 1)));
    ph.mesh.m[0].F.equ(ph.mesh.m[0].F.sum(ph.mesh.Fs(0)));
    ph.calcMesh(en, 1 / 60);
    for (i = 0; i < ph.mesh.m.length; i += 1) {
        if (ph.mesh.m[i].P.y > ph.toM(ph.viewer.height) - ph.mesh.m[i].rad) {
            v1y = (ph.mesh.m[i].P.y - ph.mesh.m[i].P_old.y) / (1 / 60);
            ph.mesh.m[i].P_old.y = ph.toM(ph.viewer.height) - ph.mesh.m[i].rad;
            v2y = v1y * -ph.mesh.m[i].refl;
            ph.mesh.m[i].P.y = v2y * (1 / 60) + ph.mesh.m[i].P_old.y;
        }
    }
    ph.refreshFrame();
    window.requestAnimationFrame(main);
}

main();