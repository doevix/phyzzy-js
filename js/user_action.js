// user_action.js
// Defines mouse and touch event handlers for the model.

const makeMenuContainer = () => {
    const div = document.createElement('div');
    div.className = 'menuContainer';
    return div;
}

const makeParagraph = inner => {
    const p = document.createElement('p');
    p.innerHTML = inner;
    return p;
}

// Creates an input label element.
const makeInputLabel = (l_for, inner) => {
    const l = l_for = document.createElement('label');
    l.htmlFor = l_for;
    l.innerHTML = inner;
    return l;
}

// Creates an input range element.
const makeRangeInput = (id, min, max, step, val) => {
    const range = document.createElement('input');
    range.type = 'range';
    range.id = id;
    range.min = min;
    range.max = max;
    range.step = step;
    range.value = val;
    return range;    
}

// Makes a checkbox.
const makeCheckboxInput = (id, val) => {
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.id = id;
    check.checked = val;
    return check;
}

// Creates an option input.
const makeOptionInput = (id, values, val) => {
    const sel = document.createElement('select');
    sel.id = id;
    values.forEach(v => {
        const opt = document.createElement('option');
        opt.innerHTML = v.name;
        opt.value = v.val;
        sel.appendChild(opt);
    });
    sel.value = val;
    return sel;
}

const makeMassMenu = m => {
    const menu = makeMenuContainer();
    const innerDiv = document.createElement('div');
    const m_range = makeRangeInput('massRange', 0.08, 1, 0.01, m.mass);
    const r_range = makeRangeInput('radRange', 0.05, 0.5, 0.01, m.radius);
    const m_chFix = makeCheckboxInput('massFixCheck', m.isFixed);
    const c_sel = makeOptionInput('colGroupSel', [
        { name: 'Default', val: 0 },
        { name: 'Universal', val: -1 },
        { name: '1', val: 1 },
        { name: '2', val: 2 },
        { name: '3', val: 3 },
        { name: '4', val: 4 },
        { name: '5', val: 5 }
    ], m.c_group);
    
    m_range.oninput = () => m.mass = Number(m_range.value);
    r_range.oninput = () => m.radius = Number(r_range.value);
    m_chFix.oninput = () => m.isFixed = m_chFix.checked;
    c_sel.oninput = () => m.c_group = Number(c_sel.value);

    innerDiv.className = 'massMenuContainer';
    innerDiv.appendChild(makeParagraph('Mass'));
    innerDiv.appendChild(makeInputLabel('massRange', 'Mass'));
    innerDiv.appendChild(m_range);
    innerDiv.appendChild(makeInputLabel('radRange', 'Radius'));
    innerDiv.appendChild(r_range);
    innerDiv.appendChild(makeInputLabel('massFixCheck', 'Fixed'));
    innerDiv.appendChild(m_chFix);
    innerDiv.appendChild(makeInputLabel('colGroupSel', 'Collision Group:'));
    innerDiv.appendChild(c_sel);
    menu.appendChild(innerDiv);
    
    return { menu, m_range, r_range, c_sel };
}

const makeSpringMenu = s => {
    menu = makeMenuContainer();
    const innerDiv = document.createElement('div');
    const s_range = makeRangeInput('stfRange', 0.0, 100, 0.01, s.stf);
    const d_range = makeRangeInput('dmpRange', 0.0, 20, 0.01, s.dmp);
    const c_sel = makeOptionInput('colGroupSel', [
        { name: 'Default', val: 0 },
        { name: 'Universal', val: -1 },
        { name: '1', val: 1 },
        { name: '2', val: 2 },
        { name: '3', val: 3 },
        { name: '4', val: 4 },
        { name: '5', val: 5 }
    ], s.c_group);

    s_range.oninput = () => s.stf = Number(s_range.value);
    d_range.oninput = () => s.dmp = Number(d_range.value);
    c_sel.oninput = () => s.c_group = Number(c_sel.value);


    innerDiv.className = 'springMenuContainer';
    innerDiv.appendChild(makeParagraph('Spring'));
    innerDiv.appendChild(makeInputLabel('stfRange', 'Stiff'));
    innerDiv.appendChild(s_range);
    innerDiv.appendChild(makeInputLabel('dmpRange', 'Damp'));
    innerDiv.appendChild(d_range);
    innerDiv.appendChild(makeInputLabel('colGroupSel', 'Collision Group:'));
    innerDiv.appendChild(c_sel);
    menu.appendChild(innerDiv);
    return { menu, s_range, d_range, c_sel };
}

const MouseHandler = (cv) => {
    let selected = undefined;
    let selectMenu = undefined;
    let menuEnable = true;
    const pos = new v2d();
    const listeners = () => {
        cv.addEventListener('mousemove', e => {
            pos.set(e.clientX - cv.offsetLeft + window.scrollX, e.clientY - cv.offsetTop + window.scrollY);
            Model.dragAction(e.movementX, e.movementY);
        }, false);
        cv.addEventListener('mousedown', e => {
            selected = Model.setSelect();
            if (selected && menuEnable) {
                if (selectMenu !== undefined) {
                    document.body.removeChild(selectMenu.menu);
                }
                if (Mass.prototype.isPrototypeOf(selected)){
                    selectMenu = makeMassMenu(selected);
                } else {
                    selectMenu = makeSpringMenu(selected);
                }
                document.body.appendChild(selectMenu.menu);
            } else if (selectMenu !== undefined) {
                document.body.removeChild(selectMenu.menu);
                selectMenu = undefined;
            }
        }, false);
        cv.addEventListener('mouseup', () => Model.clearDrag(), false);
        cv.addEventListener('mouseleave', () => Model.clearDrag(), false);
        cv.addEventListener('contextmenu', e => e.preventDefault(), false);
    }

    return {
        attachEvents: listeners,
        getPos: (scale = 1) => pos.div(scale),
        toggleMenus: () => {
            if (menuEnable) menuEnable = false;
            else menuEnable = true;
            return menuEnable;
        },
        isMenuEnabled: () => menuEnable
    };
}

document.addEventListener('keypress', e =>  {
    if (e.key === ' ')
        Model.togglePause();
    else if (e.key === 'z') mouse.toggleMenus();
}, false);
