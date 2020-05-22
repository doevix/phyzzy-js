// player.js
"use strict";

const theme_dark = {
    background: "#2C2C2C",
    mass: "#1DB322",
    fixed_center: "#2C2C2C",    
    spring: "#FFFFFF",
    m_selected: "#D7BC27",
    s_selected: "#D7BC27",
    m_highlighted: "#47DE4C",
    s_highlighted: "#B3D6B1",
    bound: "#FFFFFF"
};

// Return a random value within range.
const rand = (min = 0, max = 1) => min + (max - min) * Math.random();
// Return a 1 or -1 for multiplying.
const rSign = () => Math.random() > 0.5 ? 1 : -1;

// Main function starts here.
Model.setStepsPerFrame(5);
// Generate the canvas element.
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.style = 'background-color: ' + theme_dark.background;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);
// Attach mouse event handlers to the canvas.
const mouse = MouseHandler(canvas, Model.getScale());
mouse.attachEvents(canvas);

// Environment for the model.
const env = new Environment(new v2d(0, 9.81), 0,
    0, 0, canvas.width / Model.getScale(), canvas.height / Model.getScale());


const CanvasModelUpdate = (env, theme) => {
    // Catch the element nearest to the pointer.
    Model.setHighlight(
        Model.nearestMass(mouse.getPos(Model.getScale()), 0.1) 
        || Model.nearestSpring(mouse.getPos(Model.getScale()), 0.1));
    // Draw model.
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    Model.draw(ctx, theme);
    env.draw(ctx, theme.bound, Model.getScale());
    // Update model for next frame.
    for (let i = 0; i < Model.getStepsPerFrame(); i++) Model.update(env);
}

const frame = () => {
    CanvasModelUpdate(env, theme_dark);
    requestAnimationFrame(frame);
}