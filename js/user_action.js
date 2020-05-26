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

// Graphical construction, acts like a finite state machine.
const MouseConstructor = (() => {
    let spr = undefined; // Where a spring will be drawn from.
    let state = 0; // Constructor's current state.
    const isMass = e => Mass.prototype.isPrototypeOf(e);
    const stateActions = [
        (sel, p) => {
            sel = undefined;
            spr = undefined;
        },
        (sel, p) => {
            spr = new Mass(p.div(Model.getScale()));
            Model.addMass(spr);
        },
        (sel, p) => {
            const m = new Mass(p.div(Model.getScale()));
            const l = m.pos.len(spr.pos);
            Model.addMass(m);
            if (spr !== m) {
                Model.addSpring(new Spring(spr, m, l));
                spr = m;
            }
        },
        (sel, p) => spr = sel,
        (sel, p) => {
            if (spr !== sel) {
                Model.addSpring(new Spring(spr, sel, sel.pos.len(spr.pos)));
                spr = sel;
            }
        }
    ];

    const stateApply = (sel, p, w) => {
        if (w === 3) state = 0;
        else switch (state) {
            case 0:
                if (!isMass(sel)) state = 1;
                else state = 3;
                break;
            case 1:
                if (!isMass(sel)) state = 2;
                else state = 4;
                break;
            case 2:
                if (!isMass(sel)) state = 2;
                else state = 4;
                break;    
            case 3:
                if (!isMass(sel)) state = 2;
                else state = 4;
                break;    
            case 4:
                if (!isMass(sel)) state = 2;
                else state = 4;
                break;    
            default:
                state = 0
                break;
        }
        stateActions[state](sel, p);
    }

    const stateReset = () => {
        state = 0;
        spr = undefined;
    }

    const draw = (ctx, p, hlt, theme) => {
        if (spr) {
            const sp = spr.pos.mul(Model.getScale())
            const mp = !isMass(hlt) ? p : hlt.pos.mul(Model.getScale());
            ctx.strokeStyle = theme.s_construct;
            ctx.beginPath();
            ctx.moveTo(sp.x, sp.y);
            ctx.lineTo(mp.x, mp.y);
            ctx.closePath();
            ctx.stroke();
        }
    }

    const getSpr = () => spr;
    return { getSpr, stateApply, stateReset, draw };
})();

const MouseHandler = (cv) => {
    let selected = undefined;
    let selectMenu = undefined;
    let menuEnable = false;
    let constructEnable = false;
    const pos = new v2d();

    const genSelectMenu = () => {
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
    }

    const listeners = () => {
        cv.addEventListener('mousemove', e => {
            pos.set(e.clientX - cv.offsetLeft + window.scrollX, e.clientY - cv.offsetTop + window.scrollY);
            Model.dragAction(e.movementX, e.movementY);
        }, false);
        cv.addEventListener('mousedown', e => {
            selected = Model.setSelect();
            genSelectMenu();
            if (constructEnable) MouseConstructor.stateApply(selected, pos, e.which);
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
        toggleConstructor: () => {
            if (constructEnable) constructEnable = false;
            else constructEnable = true;
            MouseConstructor.stateReset();
        },
        isMenuEnabled: () => menuEnable,
        isConstructEnabled: () => constructEnable
    };
}

document.addEventListener('keypress', e =>  {
    if (e.key === ' ')
        Model.togglePause();
    else if (e.key === 'z') mouse.toggleMenus();
    else if (e.key === 'c') mouse.toggleConstructor();
}, false);
