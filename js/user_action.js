// user_action.js
// Defines mouse and touch event handlers for the model.

const MouseHandler = (cv) => {
    const pos = new v2d();

    const listeners = () => {
        cv.addEventListener('mousemove', e => {
            pos.set(e.clientX - cv.offsetLeft, e.clientY - cv.offsetTop);
            console.log(pos);
            Model.dragAction(e.movementX, e.movementY);
        }, false);
        cv.addEventListener('mousedown', Model.setSelect, false);
        cv.addEventListener('mouseUp', Model.clearDrag, false);
    }

    return {
        attachEvents: listeners,
        getPos: (scale = 1) => pos.div(scale)
    };
}