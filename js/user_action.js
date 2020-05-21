// user_action.js
// Defines mouse and touch event handlers for the model.

const MouseHandler = (cv) => {
    const pos = new v2d();

    const listeners = () => {
        cv.addEventListener('mousemove', e => {
            pos.set(e.clientX - cv.offsetLeft, e.clientY - cv.offsetTop);
            console.log(pos);
        }, false);
        cv.addEventListener('mousedown', Model.setSelect, false)
    }

    return {
        attachEvents: listeners,
        getPos: (scale = 1) => pos.div(scale)
    };
}