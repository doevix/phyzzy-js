// PhyzzyConstructor.js

// Initialize canvas element.
const viewport = document.getElementById("viewport");
const ctx = viewport.getContext("2d");

// Initialize buttons.
const pauseButton = document.getElementById("userPause");
const constructButton = document.getElementById("userConstruct");
const deleteButton = document.getElementById("userDelete");
const clearButton = document.getElementById("userClear");

// User mode control.
const userMode = {
    pause: false,
    construct: false,
    udelete: false,
    setPause: function(p) {
        this.pause = p;
        if (this.pause)
        {
            pauseButton.value = "play";
        } else {
            pauseButton.value = "pause";
            this.setConstruct(false);
        }
    },
    setConstruct: function(c) {
        this.construct = c;
        if (this.construct)
        {
            constructButton.value = "move/select";
            this.setDelete(false);
            this.setPause(true);
        } else {
            constructButton.value = "construct";
        }
    },
    setDelete: function(d) {
        this.udelete = d;
        if (this.udelete)
        {
            deleteButton.value = "select";
            this.setConstruct(false);
        } else {
            deleteButton.value = "delete";
        }
    }
}

// Initilize modes.
userMode.setPause(false);
userMode.setConstruct(false);
userMode.setDelete(false);

pauseButton.addEventListener('click', e => {
    if (!userMode.pause) {
        userMode.setPause(true);
    } else {
        userMode.setPause(false);
    }
}, false);
constructButton.addEventListener('click', e => {
    if (!userMode.construct) {
        userMode.setConstruct(true);
    } else {
        userMode.setConstruct(false);
    }
}, false);
deleteButton.addEventListener('click', e => {
    if (!userMode.udelete) {
        userMode.setDelete(true);
    } else {
        userMode.setDelete(false);
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
    reset: function() {
        this.highlight = undefined;
        this.select = undefined;
        this.drag = undefined;
        this.makeSpring = false;
    },
    drawHighlight: function() {
        if (this.highlight) {
            const x = this.highlight.Pi.x * ph.scale;
            const y = this.highlight.Pi.y * ph.scale;
            const r = this.highlight.rad * ph.scale;
            
            if (!userMode.udelete) ctx.strokeStyle = "grey";
            else ctx.strokeStyle = "red";

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
            if (userMode.construct && this.makeSpring)
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
    if (userState.drag && !userMode.construct) {
        const mMovement = new Vect(e.movementX / ph.scale, e.movementY / ph.scale);
        userState.drag.ignore = true;
        userState.drag.Po.equ(userState.drag.Pi);
        userState.drag.Pi.sumTo(mMovement);
        // Prevents masses from moving after dragging in pause mode.
        if (userMode.pause) userState.drag.Po.equ(userState.drag.Pi);
    }
});
viewport.addEventListener("mousedown", e => {
    if (userMode.construct) {
        if (!userState.highlight && !userState.makeSpring)
        {
            ph.addM(new Mass({mass: 0.1, rad: 0.05, refl: 0.7, mu_s: 0.4, mu_k: 0.2},
                userState.mousePos.div(ph.scale)));
                userState.makeSpring = true;
        } else if(userState.select && !userState.highlight && userState.makeSpring) {
            let mB = new Mass({mass: 0.1, rad: 0.05, refl: 0.7, mu_s: 0.4, mu_k: 0.2},
                userState.mousePos.div(ph.scale))
            ph.addM(mB);
            let len = userState.select.Pi.segLen(mB.Pi);
            console.log(len);
            ph.addS(userState.select, mB, new Spring(len, 100, 50));

        } else if(userState.select && userState.highlight && userState.makeSpring) {
            let len = userState.select.Pi.segLen(userState.highlight.Pi);
            ph.addS(userState.select, userState.highlight, new Spring(len, 100, 50));
        } else if(userState.select && userState.highlight && !userState.makeSpring) {
            userState.makeSpring = true;
            let len = userState.select.Pi.segLen(userState.highlight.Pi);
            console.log(len);
            ph.addS(userState.select, userState.highlight, new Spring(len, 100, 50));
        }
    } else if (userMode.udelete)
    {
        if (userState.highlight)
        {
            ph.remM(userState.highlight);
            userState.highlight = undefined;
        }
    }
    userState.select = ph.locateMass(userState.mousePos.div(ph.scale), 0.15);
    userState.drag = userState.select;
});
viewport.addEventListener("dblclick", e => {
    if (userState.select.Pi.isNear(userState.mousePos.div(ph.scale), 0.15))
    {
        userState.select = undefined;
        userState.makeSpring = false;
    }
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
clearButton.addEventListener("click", () => {
    userState.reset();
    ph.clear();
});

const frame = (frameTime) => {
    ctx.clearRect(0, 0, viewport.width, viewport.height);
    userState.drawHighlight();
    userState.drawSelect();
    
    if(ph.mesh.length > 0) {
        const center = ph.getCenter();
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.arc(center.x * ph.scale, center.y * ph.scale, 5, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
    }
    
    ph.drawSpring(ctx, '#000000');
    ph.drawMass(ctx, '#1DB322');

    if (!userMode.pause){
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