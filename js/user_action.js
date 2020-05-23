// user_action.js
// Defines mouse and touch event handlers for the model.

const makeMenuContainer = () => {
    const div = document.createElement('div');
    div.className = 'menuContainer';
    document.body.appendChild(div);
    return div;
}

document.addEventListener('keypress', e =>  {
    if (e.key === ' ')
        Model.togglePause();
}, false);

const MouseHandler = (cv) => {
    const pos = new v2d();
    let selectMenu = undefined;
    const listeners = () => {
        cv.addEventListener('mousemove', e => {
            pos.set(e.clientX - cv.offsetLeft + window.scrollX, e.clientY - cv.offsetTop + window.scrollY);
            Model.dragAction(e.movementX, e.movementY);
        }, false);
        cv.addEventListener('mousedown', e => {
            const s = Model.setSelect(true);
            if (s && e.which === 3) {
                if (selectMenu !== undefined) {
                    document.body.removeChild(selectMenu);
                }
                selectMenu = makeMenuContainer();
                selectMenu.innerHTML = JSON.stringify(s, null, '\t');
            } else if (selectMenu !== undefined && e.which === 3) {
                document.body.removeChild(selectMenu);
                selectMenu = undefined;
            }
        }, false);
        cv.addEventListener('mouseup', () => Model.clearDrag(), false);
        cv.addEventListener('mouseleave', () => Model.clearDrag(), false);
        cv.addEventListener('contextmenu', e => e.preventDefault(), false);
    }

    return {
        attachEvents: listeners,
        getPos: (scale = 1) => pos.div(scale)
    };
}