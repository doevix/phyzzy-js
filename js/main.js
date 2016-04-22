// main.js
/*
    Main program for Phyzzy webapp
*/


function main() {
    'use strict';
    
    var mesh = new Mesh(), // create empty mesh
        ph = new Phyz(document.getElementById('viewPort'), 100),
        colBox = new WallBox(0, 0, ph.toM(ph.viewer.width), ph.toM(ph.viewer.height), new Vect(0, 1)),
        en = new Environment(9.81, 10, colBox),
        dt_i = 1 / 50,
        dt_o = 1 / 50,
        i;

    mesh.addM(0.5, 0.05, 0.75, 0, 0, new Vect(1, 1));
    mesh.addM(0.5, 0.05, 0.75, 0, 0, new Vect(1, 2));
    mesh.addM(0.5, 0.05, 0.75, 0, 0, new Vect(2, 1));
    mesh.addM(0.5, 0.05, 0.75, 0, 0, new Vect(2, 2));

    mesh.addS(0, 1, 1, 100, 0.4);
    mesh.addS(1, 2, 1, 100, 0.4);
    mesh.addS(2, 3, 1, 100, 0.4);
    mesh.addS(0, 3, 1, 100, 0.4);
    mesh.addS(2, 0, 1, 100, 0.4);
    mesh.addS(1, 3, 1, 100, 0.4);

    // mesh.remM(3);


    function frame() {
        for (i = 0; i < mesh.m.length; i += 1) {
            mesh.applyForce(en);
        }
        ph.updateMesh(mesh, en, dt_i, dt_o);
        ph.refreshFrame(mesh, true);
        window.requestAnimationFrame(frame);
    }
    
    frame();
}

requirejs(['./phyzzy/inter',
           './phyzzy/vector',
           './phyzzy/obj',
           './phyzzy/mesh'], function (inter, vector, obj, mesh) {
    'use strict';
    main();
});