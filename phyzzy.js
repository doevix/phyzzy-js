// phyzzy.js
/*
    Main control of simulation. Manages and simulates mass and spring movement.
*/

// User interaction. Holds pointer actions. Compatible with touch screens (hopefully)
function User() {
    'use strict';
    this.pointer_Coord = new Vect(); // coordinate of pointer
    this.pointer_Veloc = new Vect(); // velocity vector
    this.pointer_Down = false;
    this.sel = -1; // indicates index of what is selected by pointer
    this.hov = -1; // indicates index of what the pointer is hovering over
    this.mS_latch = false; // indicates whether a spring or a mass is affected (false: mass true: spring)
}
User.prototype.actionCheck = function (element) {
    'use strict';
};

// Simulation control. Can be used to display mesh, or calculate mesh only.
function Phyz(viewPort, scale) {
    'use strict';
    this.viewer = viewPort || null; // where to display. Null if omitted
    this.ctx = this.viewer.getContext('2d') || null; // canvas context
    this.scale = scale; // size of 1 meter in pixels
    this.play = false; // false = paused; true = playing
}
// converts meters to pixels according to scale
Phyz.prototype.toPx = function (mt) {
    'use strict';
    return mt * this.scale;
};
// converts pixels to meters according to scale
Phyz.prototype.toM = function (px) {
    'use strict';
    return px / this.scale;
};
// updates the mesh for the next frame (mutates mesh)
Phyz.prototype.updateMesh = function (mesh, en, dt_i, dt_o) {
    'use strict';
    var i;
    mesh.calc(en, dt_i, dt_o);
    mesh.coll(en, dt_i);
};
// Clears and redraws the mesh to the canvas 
Phyz.prototype.refreshFrame = function (mesh, clrF) {
    'use strict';
    if (clrF) { // clearing optional by setting clrF as true
        this.ctx.clearRect(0, 0, this.viewer.width, this.viewer.height);
    }
    mesh.drawS(this.ctx, this.scale);
    mesh.drawM(this.ctx, this.scale);
};