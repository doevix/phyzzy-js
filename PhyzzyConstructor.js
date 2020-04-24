// PhyzzyConstructor.js

// Initialize canvas element.
const viewport = document.getElementById("viewport");
const ctx = viewport.getContext("2d");

// Initialize buttons.
const pauseButton = document.getElementById("userPause");
const constructButton = document.getElementById("userConstruct");
const deleteButton = document.getElementById("userDelete");

// User mode states.
let pause;
let construct;
let udelete;

const setPause = p => {
    pause = p;
    if (pause)
    {
        pauseButton.value = "play";
    } else {
        pauseButton.value = "pause";
    }
}
const setConstruct = c => {
    construct = c;
    if (construct)
    {
        constructButton.value = "move/select";
    } else {
        constructButton.value = "construct";
    }
}
const setDelete = d => {
    udelete = d;
    if (udelete)
    {
        deleteButton.value = "select";
        setConstruct(false);
    } else {
        deleteButton.value = "delete";
    }
}

// Initilize modes.
setPause(false);
setConstruct(false);
setDelete(false);

pauseButton.addEventListener('click', e => {
    if (!pause) {
        setPause(true);
    } else {
        setPause(false);
    }
}, false);
constructButton.addEventListener('click', e => {
    if (!construct) {
        setConstruct(true);
    } else {
        setConstruct(false);
    }
}, false);
deleteButton.addEventListener('click', e => {
    if (!udelete) {
        setDelete(true);
    } else {
        setDelete(false);
    }
}, false);

// Initialize model.
let delta = 1 / 50; // step time
const ph = new PhyzzyModel(100);

// Initialize environment.
const env = new PhyzzyEnvironment(
    {x: 0, y: 9.81},
    1,
    {x: 0, y: 0, w: viewport.width / ph.scale, h: viewport.height / ph.scale}
);

// Initialize user events.
const userState = {
    mousePos: new Vect(),
    touchPos: new Vect(),
    touchPrv: new Vect(), // Track the last touch location
    highlight: undefined,
    select: undefined,
    drag: undefined,
    makeSpring: false,
    drawHighlight: function() {
        if (this.highlight) {
            const x = this.highlight.Pi.x * ph.scale;
            const y = this.highlight.Pi.y * ph.scale;
            const r = this.highlight.rad * ph.scale;
            ctx.strokeStyle = "grey";
            ctx.beginPath();
            ctx.arc(x, y, r + r, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();
        }
    },
    drawSelect: function() {
        if (this.select)
        {
            const x = this.select.Pi.x * ph.scale;
            const y = this.select.Pi.y * ph.scale;
            const r = this.select.rad * ph.scale;
            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.arc(x, y, r + r, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.stroke();
            if (construct && this.makeSpring)
            {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(this.mousePos.x, this.mousePos.y);
                ctx.closePath();
                ctx.stroke();
            }
        }
    }
};
viewport.addEventListener("mousemove", e => {
    const b = viewport.getBoundingClientRect();
    userState.mousePos.set(e.clientX - b.left , e.clientY - b.top);
    userState.highlight = ph.locateMass(userState.mousePos.div(ph.scale), 0.15);
    if (userState.drag) {
        const mMovement = new Vect(e.movementX / ph.scale, e.movementY / ph.scale);
        userState.drag.ignore = true;
        userState.drag.Po.equ(userState.drag.Pi);
        userState.drag.Pi.sumTo(mMovement);
        // Prevents masses from moving after dragging in pause mode.
        if (pause) userState.drag.Po.equ(userState.drag.Pi);
    }
});
viewport.addEventListener("mousedown", e => {
    if (construct) {
        
    }
    userState.select = ph.locateMass(userState.mousePos.div(ph.scale), 0.15);
    userState.drag = userState.select;
});
viewport.addEventListener("mouseup", e => {
    if (userState.drag) {
        userState.drag.ignore = false;
        userState.drag = undefined;
    }
});
viewport.addEventListener("mouseleave", e => {
    if (userState.drag) {
        userState.drag.ignore = false;
        userState.drag = undefined;
    }    
});
viewport.addEventListener("touchstart", e => {
    const b = viewport.getBoundingClientRect();
    userState.touchPos.set(e.touches[0].clientX - b.left , e.touches[0].clientY - b.top);
    userState.highlight = undefined;
    userState.select = ph.locateMass(userState.touchPos.div(ph.scale), 0.15);
    userState.drag = userState.select;
    
});
viewport.addEventListener("touchmove", e => {
    const b = viewport.getBoundingClientRect();
    userState.touchPrv.equ(userState.touchPos);
    userState.touchPos.set(e.touches[0].clientX - b.left , e.touches[0].clientY - b.top);

    if (userState.drag) {
        const mMovement = userState.touchPos.sub(userState.touchPrv).div(ph.scale);
        userState.drag.ignore = true;
        userState.drag.Po.equ(userState.drag.Pi);
        userState.drag.Pi.sumTo(mMovement);
        // Prevents masses from moving after dragging in pause mode.
        if (pause) userState.drag.Po.equ(userState.drag.Pi);
    }

});
viewport.addEventListener("touchend", e => {
    userState.touchPos.clr();
    if (userState.drag) {
        userState.drag.ignore = false;
        userState.drag = undefined;
    }
});

// Construct model.
const mPropA = {mass: 0.1, rad: 0.05, refl: 0.7, mu_s: 0.4, mu_k: 0.2};
const mPropB = {mass: 0.5, rad: 0.05, refl: 0.7, mu_s: 0.4, mu_k: 0.2};

Builders.generateBox(1, 1, 1, 1, mPropA, 100, 50, ph);
Builders.generateBox(2, 2, 1, 1, mPropA, 100, 50, ph);
Builders.generateBox(3.5, 4.5, 1, 1, mPropB, 500, 250, ph);
Builders.generateBox(0.05, 4.5, 1, 1, mPropB, 500, 250, ph);
Builders.generateLine({x: 1, y: 1}, {x: 1.5, y: 1.5}, mPropA, 100, 50, ph);
ph.mesh[16].fix = true;

for (let i = 0; i < 20; i++) {
    let m = new Mass(mPropA,
        {x: Math.random() * env.boundary.w, y: Math.random() * env.boundary.h},
        {x: Math.random() * env.boundary.w, y: Math.random() * env.boundary.h}
    );
    ph.addM(m);
}

const frame = (frameTime) => {
    ctx.clearRect(0, 0, viewport.width, viewport.height);
    userState.drawHighlight();
    userState.drawSelect();
    ph.drawSpring(ctx, '#000000');
    ph.drawMass(ctx, '#1DB322');
    if (!pause){
        ph.update(ph.mesh.map(mass => {
            let f = env.weight(mass).sum(env.drag(mass))
            .sum(mass.springing()).sum(mass.damping())
            f = f.sum(env.friction(mass, f));
            return f;
        }), delta);
        ph.collision(ph.mesh.map(mass => env.boundaryHit(mass)))
    }
    ctx.fillStyle = "black";
    ctx.fillText("Cursor: " + userState.mousePos.div(ph.scale).display(3), 20, 20);
    ctx.fillText("Touch: " + userState.touchPos.div(ph.scale).display(3), 20, 40);
    ctx.fillText("Highlight: " + userState.highlight, 20, 60);
    ctx.fillText("Select: " + userState.select, 20, 80);
    ctx.fillText("Drag: " + userState.drag, 20, 100);
    window.requestAnimationFrame(frame)
}

frame();