// collisions.js
"use strict";
// Return a random value within range.
const rand = (min = 0, max = 1) => min + (max - min) * Math.random();
// Return a 1 or -1 for multiplying.
const rSign = () => Math.random() > 0.5 ? 1 : -1;

// Main function starts here.
// const canvas = document.getElementById('canvas');
// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;
// const ctx = canvas.getContext('2d');

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);



const scale = 100; // Model canvas scale in pixels per meter.
const frameTime = 1 / 60;
const stepsPerFrame = 5;

const lapse = frameTime / stepsPerFrame;
const scaledRect = { w: canvas.width / scale, h: canvas.height / scale };

const env = new Environment(new v2d(0, 9.81), 0, 0, 0, scaledRect.w, scaledRect.h);
env.addBound(
    {x: scaledRect.w / 2 - 1, y: scaledRect.h / 2 - 1},
    {x: scaledRect.w / 2 + 1, y: scaledRect.h / 2 + 1});

const theme_dark = {
    mass: "#1DB322",
    spring: "white",
    m_selected: "grey",
    s_selected: "grey",
    m_highlighted: "grey",
    s_highlighted: "grey",
    screen_bound: "black",
    bound: "white"
};

const frame = () => {
    // Draw model.
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    Model.draw(ctx, theme_dark, scale);
    env.draw(ctx, 'white', scale);
    // Update model for next frame.
    for (let i = 0; i < stepsPerFrame; i++) Model.update(env, lapse);
    requestAnimationFrame(frame);
}