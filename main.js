// main.js
/*
    Main program for Phyzzy webapp
*/
var mesh = new Mesh(), // create empty mesh
    ph = new Phyz(mesh, 100, document.getElementById('viewPort')),
    en = new Environment(9.81, 0.01),
    pos = new Vect(ph.toM(ph.viewer.width / 2), 0.05),
    vel = new Vect();

ph.mesh.addM(0.5, 0.05, 0.7, 0, 0, pos, vel);
ph.mesh.addM(0.5, 0.05, 0.7, 0, 0, pos.sum(new Vect(0.2, 0)), vel);
function main() {
    'use strict';
    ph.calcMesh(en, 1 / 60);
    ph.refreshFrame();
    window.requestAnimationFrame(main);
}

main();