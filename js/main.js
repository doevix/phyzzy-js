// main.js
/*
    Main program for Phyzzy webapp
*/


function main() {
    'use strict';
    
    var mesh = new Mesh(), // create empty mesh
        ph = new Phyz(document.getElementById('viewPort'), 100),
        user = new User(), // add user functions
        colBox = new WallBox(0, 0, ph.toM(ph.viewer.width), ph.toM(ph.viewer.height), new Vect(0, 1)),
        en = new Environment(0, 5, colBox),
        dt_i = 1 / 50,
        dt_o = 1 / 50,
        i;

    ph.interactSet(user); // enable user functions

    mesh.generateBlob(8, 0.05, 0.05, 5, 5);

    function frame() {
        mesh.applyForce(en, dt_i);
        ph.updateMesh(mesh, en, dt_i, dt_o);
        ph.refreshFrame(mesh, true);
        ph.checkHov(user, mesh);
        ph.ctx.fillText(user.pointer_Coord.display(), 5, 10);
        ph.ctx.fillText(user.pointer_Down, 5, 20);
        ph.ctx.fillText(user.hov, 5, 30);
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
