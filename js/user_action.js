// user_action.js
// Defines mouse and touch event handlers for the model.

const makeMenuContainer = () => {
    const div = document.createElement('div');
    div.className = 'menuContainer';
    return div;
}

const createSelectedMassMenu = m => {
    const menu_div = document.createElement('div');
    const p = document.createElement('p');
    p.innerHTML = "Mass selected";
    menu_div.appendChild(p);
    const container = makeMenuContainer();
    container.appendChild((menu_div));
    return container;
}
const createSelectedSpringMenu = s => {
    const menu_div = document.createElement('div');
    const p = document.createElement('p');
    p.innerHTML = "Spring selected";
    menu_div.appendChild(p);
    const container = makeMenuContainer();
    container.appendChild((menu_div));
    return container;
}

document.addEventListener('keypress', e =>  {
    if (e.key === ' ')
        Model.togglePause();
}, false);

const MouseHandler = (cv) => {
    const pos = new v2d();
    let selectMenu = undefined;
    let selected = undefined;
    const listeners = () => {
        cv.addEventListener('mousemove', e => {
            pos.set(e.clientX - cv.offsetLeft + window.scrollX, e.clientY - cv.offsetTop + window.scrollY);
            Model.dragAction(e.movementX, e.movementY);
        }, false);
        cv.addEventListener('mousedown', e => {
            selected = Model.setSelect(true);
            
        }, false);
        cv.addEventListener('mouseup', () => Model.clearDrag(), false);
        cv.addEventListener('mouseleave', () => Model.clearDrag(), false);
        cv.addEventListener('dblclick', e => {
            if (selected) {
                if (selectMenu !== undefined) {
                    document.body.removeChild(selectMenu);
                }
                selectMenu = Mass.prototype.isPrototypeOf(selected) ?
                    createSelectedMassMenu(selected) : createSelectedSpringMenu(selected);
                document.body.appendChild(selectMenu);
            } else if (selectMenu !== undefined) {
                document.body.removeChild(selectMenu);
                selectMenu = undefined;
            }
        }, false);
        cv.addEventListener('contextmenu', e => e.preventDefault(), false);
    }

    return {
        attachEvents: listeners,
        getPos: (scale = 1) => pos.div(scale)
    };
}