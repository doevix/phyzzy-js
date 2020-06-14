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
    // Window space colors.
    menuBar: "#1F1F1F",
    barTxt: "#FFFFFF",
    btnTxt: "#FFFFFF",
    btnDefault: "#1DB322",
    btnHighlight: "#47DE4C",
    btnSelected: "#D7BC27",
    btnSelected_h: "#F0DA60",
    btnClicked: "#168119",
    canvasNegative: "#000000",
    // Canvas space colors.
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
const theme_nostalgic = {
    // Window space colors.
    menuBar: "#D3D3D3",
    barTxt: "#000000",
    btnTxt: "#FFFFFF",
    btnDefault: "#1B8CD2",
    btnHighlight: "#65AEDC",
    btnSelected: "#FF584B",
    btnSelected_h: "#FE776D",
    btnClicked: "#1872A9",
    canvasNegative: "#F0F0F0",
    // Canvas space colors.
    background: "#FFFFFF",
    mass: "#000000",
    fixed_center: "#2C2C2C",    
    spring: "#000000",
    m_selected: "#1B8CD2",
    s_selected: "#1B8CD2",
    m_highlighted: "#000000",
    s_highlighted: "#000000",
    s_construct: "#ACACAC",
    m_delete: "#FF0000",
    s_delete: "#FF0000",
    bound: "#FFFFFF"
};

// Sets theme to CSS variables.
let currentTheme = theme_dark;
const setRootTheme = theme => {
    const root = document.documentElement;
    root.style.setProperty('--btnTxt', theme.btnTxt);
    root.style.setProperty('--barTxt', theme.barTxt);
    root.style.setProperty('--defaultColor', theme.btnDefault);
    root.style.setProperty('--highlightColor', theme.btnHighlight);
    root.style.setProperty('--selectedColor', theme.btnSelected);
    root.style.setProperty('--selectedColor-highlight', theme.btnSelected_h);
    root.style.setProperty('--clickedColor', theme.btnClicked);
    root.style.setProperty('--menuBarColor', theme.menuBar);
    root.style.setProperty('--canvasBackground', theme.background);
    root.style.setProperty('--emptySpaceColor', theme.canvasNegative);
    currentTheme = theme;
}

// Model player initialization
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
scaleCanvas(canvas);
// Attach mouse event handlers to the canvas.
const mouse = MouseHandler(canvas, Model.getScale());
mouse.attachEvents(canvas);


// Resize canvas and scale when window changes size.
window.onresize = () => scaleCanvas(canvas);

setRootTheme(theme_dark);
const frame = () => {
    CanvasModelUpdate(context, env, currentTheme, canvas.width, canvas.height);
    requestAnimationFrame(frame);
}