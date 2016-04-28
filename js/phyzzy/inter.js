// inter.js
/*
    Main control of simulation. Manages and simulates mass and spring movement.
*/

// User interaction. Holds pointer actions. Requires external event handler.
function User() {
    'use strict';
    this.pointer_Coord = new Vect(); // coordinate of pointer
    this.coord_Last = new Vect(); // last coordinate of pointer
    this.pointer_Down = false;
    this.sel = -1; // indicates index of what is selected by pointer
    this.hov = -1; // indicates index of what the pointer is hovering over
    this.mS_latch = false; // indicates whether a spring or a mass is affected (false: mass true: spring)
}
// Updates the pointer coordinates uses vector input.
User.prototype.moveEvent = function (e, v) {
    'use strict';
    // capture
    var n_coord = new Vect(e.clientX, e.clientY);
    // correct
    n_coord.subTo(new Vect(v.offsetLeft, v.offsetTop));
    // set
    this.pointer_Coord.equ(n_coord);
};
// Creates action on mouse down.
User.prototype.downEvent = function (e) {
    'use strict';
    this.pointer_Down = true;
};
// Creates action on mouse up.
User.prototype.upEvent = function (e) {
    'use strict';
    this.pointer_Down = false;
};

// Simulator interface. Can be used to display mesh, or calculate mesh only.
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
Phyz.prototype.updateMesh = function (mesh, en) {
    'use strict';
    var i;
    mesh.applyForce(en);
    mesh.calc(en.dt_i, en.dt_o);
    mesh.coll(en);
};
// Clears and redraws the mesh to the canvas 
Phyz.prototype.refreshFrame = function (mesh, clrF, debug) {
    'use strict';
    if (clrF) { // clearing optional by setting clrF as true
        this.ctx.clearRect(0, 0, this.viewer.width, this.viewer.height);
    }
    mesh.drawS(this.ctx, this.scale);
    mesh.drawM(this.ctx, this.scale);
};
// User interaction: attaches events to a user object.
Phyz.prototype.interactSet = function (user) {
    'use strict';
    var v = this.viewer;
    this.viewer.onmousemove = function (e) {
        user.moveEvent(e, v);
    };
    this.viewer.onmousedown = function (e) {
        user.downEvent(e);
    };
    this.viewer.onmouseup = function (e) {
        user.upEvent(e);
    };
};
Phyz.prototype.checkHov = function (user, mesh) {
    'use strict';
    var i;
    user.hov = -1;
    for (i = 0; i < mesh.m.length; i += 1) {
        if (mesh.m[i].Pi.compare(user.pointer_Coord.div(this.scale), mesh.m[i].rad + 0.05)) {
            user.hov = i;
            user.mS_latch = false;
        }
    }
};
