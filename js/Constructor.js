// Constructor.js
"use strict";

// Initialize canvas element.
const viewport = document.getElementById("viewport");
const ctx = viewport.getContext("2d");

// Initialize model.
let delta = 1 / 60; // step time
const phz = new PhyzzyModel(100);

// Initialize environment.
const env = new PhyzzyEnvironment(
    {x: 0, y: 9.81},
    1,
    {x: 0, y: 0, w: viewport.width / phz.scale, h: viewport.height / phz.scale}
);

// Initialize buttons.
const pauseButton = document.getElementById("userPause");
const constructButton = document.getElementById("userConstruct");
const deleteButton = document.getElementById("userDelete");
const clearButton = document.getElementById("userClear");
const gravSlider = document.getElementById("gravSlider");
const dragSlider = document.getElementById("dragSlider");

gravSlider.value = env.gravity.y;
dragSlider.value = env.kd;
wbox.ampSlider.value = phz.amp;
wbox.spdSlider.value = phz.wSpd;
wbox.dirCheck.checked = false;

// User mode control.
const mode = {
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
            this.setPause(true);
            this.setDelete(false);
        } else {
            constructButton.value = "construct";
        }
        this.springFrom = undefined;
    },
    setDelete: function(d) {
        this.udelete = d;
        if (this.udelete)
        {
            deleteButton.value = "select";
            setConstruct(false);
        } else {
            deleteButton.value = "delete";
        }
    }
};
// Button event listeners.
pauseButton.addEventListener('click', () => mode.setPause(!mode.pause), false);
constructButton.addEventListener('click', () => mode.setConstruct(!mode.construct), false);
deleteButton.addEventListener('click', () => mode.setDelete(!mode.udelete), false);

// Environment slider event listeners.
gravSlider.addEventListener('input', e => {
    env.gravity.y = gravSlider.value;
}, false);
dragSlider.addEventListener('input', e => {
    env.kd = dragSlider.value;
}, false);

// Wavebox event listeners.
wbox.ampSlider.addEventListener('input', e => {
    phz.amp = wbox.ampSlider.value;
}, false);

wbox.spdSlider.addEventListener('input', e => {
    phz.wSpd = wbox.spdSlider.value;
}, false);

wbox.dirCheck.addEventListener("input", e => {
    if (wbox.dirCheck.checked) phz.dir = -1;
    else phz.dir = 1;
}, false);

// Indicate state of user's interaction with model.
const user = {
    mpos: new Vect(),       // Cursor position.
    tpos: new Vect(),       // Touch position.
    highlight: undefined,   // Highlighted mass.
    select: undefined,      // Selected mass.
    drag: undefined,        // Mass being dragged.
    springFrom: undefined,  // Connect next mass with spring.
    draw: function(model) {
        if (this.highlight) {
            if (!mode.udelete) ctx.strokeStyle = "#62B564";
            else ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.arc(
                this.highlight.Pi.x * model.scale,
                this.highlight.Pi.y * model.scale,
                this.highlight.rad * model.scale + 5,
                0, 2 * Math.PI);
                ctx.closePath();
            ctx.stroke();
        }
        if (this.springFrom)
        {
            ctx.strokeStyle = "#62B564";
            ctx.beginPath();
            ctx.moveTo(this.springFrom.Pi.x * model.scale, this.springFrom.Pi.y * model.scale);
            if (!this.highlight) ctx.lineTo(this.mpos.x, this.mpos.y);
            else ctx.lineTo(this.highlight.Pi.x * model.scale, this.highlight.Pi.y * model.scale);
            ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(
                this.springFrom.Pi.x * model.scale,
                this.springFrom.Pi.y * model.scale,
                this.springFrom.rad * model.scale + 10,
                0, 2 * Math.PI);
            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = 'black';
            const lenTxt = this.springFrom.Pi.len(
                !this.highlight ? model.scaleV(this.mpos) : this.highlight.Pi);
            ctx.fillText(lenTxt.toFixed(3), this.mpos.x + 20, this.mpos.y + 20);
        }
        if (this.select) {
            ctx.strokeStyle = "black";
            ctx.beginPath();
            ctx.arc(
                this.select.Pi.x * model.scale,
                this.select.Pi.y * model.scale,
                this.select.rad * model.scale + 5,
                0, 2 * Math.PI);
            ctx.closePath();
            ctx.stroke();
        }
    },
    reset: function() {
        this.highlight = undefined;
        this.select = undefined;
        this.drag = undefined;
    }
};


const debugData = prvTime => {
    let curTime = performance.now();
    let t_diff = curTime - prvTime;
    ctx.fillStyle = "black";
    ctx.fillText((1000 / t_diff).toFixed(3) + " fps", 10, 10);
    ctx.fillText("Cursor: " + phz.scaleV(user.mpos).display(3), 10, 20);
    ctx.fillText("Touch:" + phz.scaleV(user.tpos).display(3), 10, 30);
    ctx.fillText("Highlight: " + user.highlight, 10, 40);
    ctx.fillText("Select: " + user.select, 10, 50);
    ctx.fillText("Drag: " + user.drag, 10, 60);
    ctx.fillText("SpringFrom: " + user.springFrom, 10, 70);
    ctx.fillText("Wave amplitude: " + phz.amp, 10, 80);
    ctx.fillText("Wave speed: " + phz.wSpd, 10, 90);
    ctx.fillText("Wave time: " + phz.t.toFixed(3), 10, 100);
    ctx.fillText("Wave val: " + phz.waveState().toFixed(3), 10, 110);
    return curTime;
}
// Main animation frame function.
let prv = performance.now();
const frame = () => {
    ctx.clearRect(0, 0, viewport.width, viewport.height);
    phz.drawSpring(ctx, '#000000');
    phz.drawMass(ctx, '#1DB322');
    user.highlight = phz.locateMass(phz.scaleV(user.mpos), 0.2);
    user.draw(phz);
    wbox.draw(phz.amp, 1, phz.t);

    if (!mode.pause){
        phz.updateActuators(delta);
        phz.update(phz.mesh.map(mass => {
            let f = env.weight(mass).sum(env.drag(mass))
            .sum(mass.springing()).sum(mass.damping())
            f = f.sum(env.friction(mass, f));
            return f;
        }), delta);
        phz.collision(phz.mesh.map(mass => env.boundaryHit(mass)));
    }

    prv = debugData(prv);
    window.requestAnimationFrame(frame);
}

// Constructor helper functions.
const defaultMassProp = {mass: 0.1, rad: 0.05, refl: 0.7, mu_s: 0.4, mu_k: 0.2};
const defaultSpringProp = {stiff: 100, damp: 50};
const constructorCase1 = () => {
    // User clicks empty space with no spring generating.
    const m = new Mass(defaultMassProp, phz.scaleV(user.mpos));
    phz.addM(m);
    user.select = m;
    user.springFrom = user.select;
}
const constructorCase2 = () => {
    // User clicks empty space with previously selected mass and spring generating
    const m = new Mass(defaultMassProp, phz.scaleV(user.mpos));
    const len = user.springFrom.Pi.len(m.Pi);
    const s = new Spring(len, defaultSpringProp.stiff, defaultSpringProp.damp);
    phz.addM(m);
    phz.addS(user.springFrom, m, s);
    user.select = m;
    user.springFrom = user.select;
}
const constructorCase3 = () => {
    // User clicks on existing mass with spring generating enabled.
    user.springFrom = undefined;
}
const constructorCase4 = () => {
    // User clicks on existing mass with spring generating disabled.
    user.springFrom = user.select;
}
const constructorCase5 = () => {
    // User clicks existing mass with spring generating enabled.
    const len = user.springFrom.Pi.len(user.highlight.Pi);
    const s = new Spring(len, defaultSpringProp.stiff, defaultSpringProp.damp);
    phz.addS(user.springFrom, user.highlight, s);
    user.select = user.highlight;
    user.springFrom = user.select;
}

// Mouse event handlers.
const mouseMoveHandler = e => {
    user.mpos.set(e.clientX - viewport.offsetLeft, e.clientY - viewport.offsetTop);
    if (user.drag)
    {
        const mMov = new Vect(e.movementX, e.movementY);
        user.drag.Po.equ(user.drag.Pi); // Set velocity to cursor's for throwing.
        user.drag.Pi.sumTo(phz.scaleV(mMov));
        if (mode.pause) user.drag.Po.equ(user.drag.Pi); // Cancel velocity if paused
    }
}
const mouseDownHandler = e => {
    user.select = user.highlight;
    user.drag = user.select;
    if (user.drag) user.drag.ignore = true;
    if (mode.construct && e.which === 1)
    {
        if (!user.highlight && !user.springFrom) constructorCase1();
        else if (!user.highlight && user.springFrom) constructorCase2();
        else if (user.highlight && !user.springFrom) constructorCase4();
        else if (user.highlight && user.springFrom) constructorCase5();
    } else user.springFrom = undefined;
    if (mode.udelete)
    {
        phz.remM(user.select);
        user.reset();
    }
}
const mouseUpHandler = e => {
    if (user.drag) 
    {
        user.drag.ignore = false;
        user.drag = undefined;
    }
}
const doubleClickHandler = e => {
    if (mode.construct)
    {
        constructorCase3();
    }
}
const mouseLeaveHandler = e => {
    if (user.drag) user.drag.ignore = false;
    user.drag = undefined;
    user.highlight = undefined;
    user.springFrom = undefined;
}
const contextMenuHandler = e => {
    // Disable context menu.
    e.preventDefault();
}

// Touch event handlers.
const tPos_capture = e => {
    const pos = new Vect(
        e.touches[0].clientX - viewport.offsetLeft,
        e.touches[0].clientY - viewport.offsetTop);
    return pos;
}
const tPos_prv = new Vect();
const touchStartHandler = e => {
    user.tpos.equ(tPos_capture(e));
    user.select = phz.locateMass(phz.scaleV(user.tpos), 0.3);
    user.drag = user.select;
    if (user.drag) user.drag.ignore = true;
}
const touchMoveHandler = e => {
    tPos_prv.equ(user.tpos);
    user.tpos.equ(tPos_capture(e))
    const tmov = new Vect();
    tmov.equ(user.tpos.sub(tPos_prv));
    if (user.drag) {
        user.drag.Po.equ(user.drag.Pi); // Set velocity to cursor's for throwing.
        user.drag.Pi.sumTo(phz.scaleV(tmov));
        if (mode.pause) user.drag.Po.equ(user.drag.Pi); // Cancel velocity if paused.
    }
}
const touchEndHandler = e => {
    user.tpos.clr();
    if (user.drag) user.drag.ignore = false;
    user.drag = undefined;
}

// Mousing events.
viewport.addEventListener("mousemove", mouseMoveHandler, false);
viewport.addEventListener("mousedown", mouseDownHandler, false);
viewport.addEventListener("mouseup", mouseUpHandler, false);
viewport.addEventListener("dblclick", doubleClickHandler, false);
viewport.addEventListener("mouseleave", mouseLeaveHandler, false);
viewport.addEventListener("contextmenu", contextMenuHandler, false);
// Touch events.
viewport.addEventListener("touchstart", touchStartHandler, false);
viewport.addEventListener("touchmove", touchMoveHandler, false);
viewport.addEventListener("touchend", touchEndHandler, false);

// Clear model on clicking the clear button.
clearButton.addEventListener('click', () => {
    if (confirm("You are about to clear the model. Continue?")){
        phz.clear();
        user.reset();
    }
}, false);

// Initilize modes.
mode.setPause(false);
mode.setConstruct(false);
mode.setDelete(false);

// Run constructor animation.
frame();