// user_action.js
// Defines mouse and touch event handlers for the model.
'use strict';

const makeMenuContainer = () => {
    const div = document.createElement('div');
    div.className = 'menuContainer';
    return div;
}
const makeDiv = className => {
    const div = document.createElement('div');
    div.className = className;
    return div;
}
const makeContainer = (contClass, childElement) => {
    const cont = makeDiv(contClass);
    cont.appendChild(childElement);
    return cont;
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
    range.className = 'slider';
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
const makeButtonInput = (id, usrTxt) => {
    const btn = document.createElement('input');
    btn.type = 'button';
    btn.id = id;
    btn.value = usrTxt;
    return btn;
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

const makeActuatorMenu = a => {
    const menu = makeDiv('actuatorMenu');
    if (MuscleSpringActuator.prototype.isPrototypeOf(a)) {
        const s_range = makeRangeInput('senseRange', 0, 1, 0.01, a.sense);
        const p_range = makeRangeInput('phaseRange', 0, 1, 0.01, a.phase / (2 * Math.PI));
        s_range.oninput = () => a.sense = Number(s_range.value);
        p_range.oninput = () => a.phase = 2 * Math.PI * Number(p_range.value);
        const s_setting = makeContainer('senseContainer', s_range);
        const p_setting = makeContainer('phaseContainer', p_range);
        menu.appendChild(makeInputLabel('senseRange', "Sensitivity"));
        menu.appendChild(s_setting);
        menu.appendChild(makeInputLabel('phaseRange', "Phase"));
        menu.appendChild(p_setting);
    }
    return menu;
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

    const m_setting = makeContainer('rangeContainer', m_range);
    const r_setting = makeContainer('rangeContainer', r_range);

    innerDiv.className = 'massMenuContainer';
    innerDiv.appendChild(makeParagraph('Mass'));
    innerDiv.appendChild(makeInputLabel('massRange', 'Mass'));
    innerDiv.appendChild(m_setting);
    innerDiv.appendChild(makeInputLabel('radRange', 'Radius'));
    innerDiv.appendChild(r_setting);
    innerDiv.appendChild(makeInputLabel('massFixCheck', 'Fixed'));
    innerDiv.appendChild(m_chFix);
    innerDiv.appendChild(document.createElement('br'));
    innerDiv.appendChild(makeInputLabel('colGroupSel', 'Collision Group:'));
    innerDiv.appendChild(c_sel);
    menu.appendChild(innerDiv);
    
    return menu;
}

const makeSpringMenu = s => {
    const menu = makeMenuContainer();
    const a = Model.getActuator(s);
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

    const s_setting = makeContainer('rangeContainer', s_range);
    const d_setting = makeContainer('rangeContainer', d_range);

    s_range.oninput = () => s.stf = Number(s_range.value);
    d_range.oninput = () => s.dmp = Number(d_range.value);
    c_sel.oninput = () => s.c_group = Number(c_sel.value);

    innerDiv.className = 'springMenuContainer';
    innerDiv.appendChild(makeParagraph('Spring'));
    innerDiv.appendChild(makeInputLabel('stfRange', 'Stiff'));
    innerDiv.appendChild(s_setting);
    innerDiv.appendChild(makeInputLabel('dmpRange', 'Damp'));
    innerDiv.appendChild(d_setting);
    innerDiv.appendChild(makeInputLabel('colGroupSel', 'Collision Group:'));
    innerDiv.appendChild(c_sel);
    if (a) innerDiv.appendChild(makeActuatorMenu(a));
    else {
        const btn = makeButtonInput('makeActBtn', 'Make muscle');
        innerDiv.appendChild(btn);
        btn.onclick = () => {
            const na = new MuscleSpringActuator(s, 0, 0);
            Model.attachActuator(na);
            innerDiv.appendChild(makeActuatorMenu(na));
            innerDiv.removeChild(btn);
        }
    }
    menu.appendChild(innerDiv);
    return menu;
}

const makeEnvMenu = () => {
    const env = Model.environment();
    const w = Model.getWaveStats();
    const innerDiv = makeDiv('envMenuContainer');
    const g_range = makeRangeInput('grvRange', 0, 9.81 * 5, 0.01, env.g.y);
    const d_range = makeRangeInput('drgRange', 0, 5, 0.1, env.d);
    const wa_range = makeRangeInput('wampRange', 0, 1, 0.01, w.amp);
    const ws_range = makeRangeInput('wspdRange', 0, 20, 0.01, w.wSpd);
    
    g_range.oninput = () => env.g.y = Number(g_range.value);    
    d_range.oninput = () => env.d = Number(d_range.value);    
    wa_range.oninput = () => Model.setWaveAmplitude(Number(wa_range.value));
    ws_range.oninput = () => Model.setWaveSpeed(Number(ws_range.value));

    const g_setting = makeContainer('rangeContainer', g_range);
    const d_setting = makeContainer('rangeContainer', d_range);
    const wa_setting = makeContainer('rangeContainer', wa_range);
    const ws_setting = makeContainer('rangeContainer', ws_range);

    innerDiv.appendChild(makeParagraph('Environment'));
    innerDiv.appendChild(makeInputLabel('grvRange', 'Gravity'));
    innerDiv.appendChild(g_setting);
    innerDiv.appendChild(makeInputLabel('drgRange', 'Drag'));
    innerDiv.appendChild(d_setting);
    innerDiv.appendChild(makeInputLabel('wampRange', 'Wave Amplitude'));
    innerDiv.appendChild(wa_setting);
    innerDiv.appendChild(makeInputLabel('wspdRange', 'Wave Speed'));
    innerDiv.appendChild(ws_setting);
    return innerDiv;
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
            Model.forceSelect(spr);
        },
        (sel, p) => {
            const m = new Mass(p.div(Model.getScale()));
            const l = m.pos.len(spr.pos);
            Model.addMass(m);
            Model.forceSelect(m);
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
                else if(isMass(sel) && sel === spr) state = 0;
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
    let deleteEnable = false;
    const pos = new v2d();
    const prv = new v2d();

    const genSelectMenu = () => {
        if (selected && menuEnable) {
            if (selectMenu !== undefined) {
                document.body.removeChild(selectMenu);
            }
            if (Mass.prototype.isPrototypeOf(selected)){
                selectMenu = makeMassMenu(selected);
            } else {
                selectMenu = makeSpringMenu(selected);
            }
            document.body.appendChild(selectMenu);
        } else if (selectMenu !== undefined) {
            document.body.removeChild(selectMenu);
            selectMenu = undefined;
        }
    }

    const listeners = () => {
        cv.addEventListener('mousemove', e => {
            prv.mEqu(pos);
            pos.set(e.clientX - cv.offsetLeft + window.scrollX, e.clientY - cv.offsetTop + window.scrollY - 50);
            const D = pos.sub(prv);
            Model.dragAction(D.x, D.y);
        }, false);
        cv.addEventListener('mousedown', e => {
            selected = Model.setSelect();
            genSelectMenu();
            if (constructEnable) MouseConstructor.stateApply(selected, pos, e.which);
            else if (deleteEnable) {
                if (Mass.prototype.isPrototypeOf(selected)) Model.remMass(selected);
                else if (Spring.prototype.isPrototypeOf(selected)) Model.remSpring(selected);
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
            if (menuEnable) {
                menuEnable = false;
                genSelectMenu();
            } else {
                menuEnable = true;
                genSelectMenu();
            }
            return menuEnable;
        },
        toggleConstructor: () => {
            if (constructEnable) constructEnable = false;
            else {
                constructEnable = true;
                if (deleteEnable) deleteEnable = false;
            }
            MouseConstructor.stateReset();
            return constructEnable;
        },
        toggleDelete: () => {
            if (deleteEnable) deleteEnable = false;
            else {
                deleteEnable = true;
                if (constructEnable) constructEnable = false;
                if (menuEnable) menuEnable = false;
                MouseConstructor.stateReset();
            }
            return deleteEnable;
        },
        isMenuEnabled: () => menuEnable,
        isConstructEnabled: () => constructEnable,
        isDeleteEnabled: () => deleteEnable
    };
}

let envMenu = undefined;
document.addEventListener('keypress', e =>  {
    if (e.key === ' ')
        Model.togglePause();
    else if (e.key === 'z') mouse.toggleMenus();
    else if (e.key === 'c') mouse.toggleConstructor();
    else if (e.key === 'd') mouse.toggleDelete();
    else if (e.key === 'e') {
        if (envMenu) {
            document.body.removeChild(envMenu);
            envMenu = undefined;
        } else {
            envMenu = makeEnvMenu();
            document.body.appendChild(envMenu);
        }
    }
}, false);

// I really don't like how this is, but it works for indication. Might be buggy...
const ctrlButtons = document.getElementsByClassName('controlBtn');
ctrlButtons['pseBtn'].addEventListener('click', e => {
    const p = Model.togglePause();
    if (p) ctrlButtons['pseBtn'].className += ' btnSet';
    else ctrlButtons['pseBtn'].className = 'controlBtn';
}, true);
ctrlButtons['cstBtn'].addEventListener('click', e => {
    const c = mouse.toggleConstructor();
    if (c) {
        ctrlButtons['cstBtn'].className += ' btnSet';
        ctrlButtons['delBtn'].className = 'controlBtn';
        
    }
    else ctrlButtons['cstBtn'].className = 'controlBtn';
    
}, true);
ctrlButtons['delBtn'].addEventListener('click', e => {
    const d = mouse.toggleDelete();
    if (d) {
        ctrlButtons['delBtn'].className += ' btnSet';
        ctrlButtons['cstBtn'].className = 'controlBtn';
        
    }
    else ctrlButtons['delBtn'].className = 'controlBtn';
}, true);
ctrlButtons['clrBtn'].addEventListener('click', e => {
    if (window.confirm('You are about to clear the model. Continue?'))
        Model.clear();
}, true);