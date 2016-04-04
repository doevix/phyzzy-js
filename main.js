// main.js
/*
    Main program for Phyzzy webapp
*/
var mesh = new Mesh(), // create empty mesh
    ph = new Phyz(mesh, 100, document.getElementById('viewPort')),
    en = new Environment(9.81, 0.01),
    pos = new Vect(ph.toM(ph.viewer.width / 2), 0.05),
    vel = new Vect(),
    i,
    v1y,
    v2y;

ph.mesh.addM(0.5, 0.05, 0.7, 0, 0, pos, vel);
ph.mesh.addM(0.5, 0.05, 0.7, 0, 0, pos.sum(new Vect(0.2, 0)), vel);
ph.mesh.m[0].F.equ(new Vect(0, 9.81 * ph.mesh.m[0].mass));
ph.mesh.m[1].F.equ(new Vect(0, 4.38 * ph.mesh.m[1].mass));
function main() {
    'use strict';
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