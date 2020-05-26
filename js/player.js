// player.js
"use strict";

// Generate the canvas element.
const generateCanvas = theme => {
    const canvas = document.createElement('canvas');
    canvas.style = 'background-color: ' + theme.background;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    return canvas;
}
// Updates and draws the model to the canvas.
const CanvasModelUpdate = (ctx, env, theme, width, height) => {
    // Catch the element nearest to the pointer.
    Model.setHighlight(
        Model.nearestMass(mouse.getPos(Model.getScale()), 0.15) 
        || Model.nearestSpring(mouse.getPos(Model.getScale()), 0.15));
    // Draw model.
    ctx.clearRect(0, 0, width, height);
    MouseConstructor.draw(ctx, mouse.getPos(), Model.getHighlight());
    Model.draw(ctx, theme);
    env.draw(ctx, theme.bound, Model.getScale());
    // Update model for next frame.
    for (let i = 0; i < Model.getStepsPerFrame(); i++) Model.update(env);
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
    m_delete: "#FF0000",
    s_delete: "#FF0000",
    bound: "#FFFFFF"
};

// Model player initialization
const canvas = generateCanvas(theme_dark);
const context = canvas.getContext('2d');
// Attach mouse event handlers to the canvas.
const mouse = MouseHandler(canvas, Model.getScale());
mouse.attachEvents(canvas);


const frame = () => {
    CanvasModelUpdate(context, env, theme_dark, canvas.width, canvas.height);
    requestAnimationFrame(frame);
}