// player.js
"use strict";

const scaleCanvas = (cvs) => {
    cvs.height = window.innerHeight - 50 - 20;
    cvs.width = cvs.height * (16 / 9); // Adjust width to aspect ratio.
    Model.setScale(cvs.width / 12);
}

// Updates and draws the model to the canvas.
const CanvasModelUpdate = (ctx, env, theme, width, height) => {
    // Catch the element nearest to the pointer.
    Model.setHighlight(
        Model.nearestMass(mouse.getPos(Model.getScale()), 0.15) 
        || Model.nearestSpring(mouse.getPos(Model.getScale()), 0.15));
    // Draw model.
    ctx.clearRect(0, 0, width, height);
    MouseConstructor.draw(ctx, mouse.getPos(), Model.getHighlight(), theme);
    Model.draw(ctx, theme);
    // Update model for next frame.
    for (let i = 0; i < Model.getStepsPerFrame(); i++) Model.update();
}

// Theme to use for colors.
const theme_dark = {
    background: "#2C2C2C",
    mass: "#1DB322",
    fixed_center: "#2C2C2C",    
    spring: "#FFFFFF",
    m_selected: "#D7BC27",
    s_selected: "#D7BC27",
    m_highlighted: "#47DE4C",
    s_highlighted: "#B3D6B1",
    s_construct: "#ACACAC",
    m_delete: "#FF0000",
    s_delete: "#FF0000",
    bound: "#FFFFFF"
};

// Model player initialization
const cContainer = document.getElementsByClassName('canvasContainer')[0];
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
scaleCanvas(canvas);
// Attach mouse event handlers to the canvas.
const mouse = MouseHandler(canvas, Model.getScale());
mouse.attachEvents(canvas);


// Resize canvas and scale when window changes size.
window.onresize = () => scaleCanvas(canvas);

// window.onmousemove = e => {
//     const pos = new v2d(e.clientX, e.clientY);
//     console.log(pos);
//     document.getElementsByClassName('footer')[0].innerHTML = pos.toStr(3);
// }

const frame = () => {
    CanvasModelUpdate(context, env, theme_dark, canvas.width, canvas.height);
    requestAnimationFrame(frame);
}