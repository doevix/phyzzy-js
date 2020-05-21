// Spring and Mass components.
'use strict';

// Simplifies drawing with v2d class.
// Draw arc, defaults to circle.
CanvasRenderingContext2D.prototype.v_arc = function(pos, rad, start = 0, end = 2 * Math.PI, counter = false) {
    this.arc(pos.x, pos.y, rad, start, end, counter);
}
// Draw line.
CanvasRenderingContext2D.prototype.v_line = function(A, B) {
    this.moveTo(A.x, A.y);
    this.lineTo(B.x, B.y);
}
CanvasRenderingContext2D.prototype.v_f_sqr = function(pos, r) {
    this.fillRect(pos.x - r, pos.y - r, r, r);
}

class Mass {
    constructor(pos, radius = 0.08, mass = 0.16) {
        this.mass = mass;
        this.radius = radius;
        this.pos = new v2d(pos.x, pos.y); // Current position.
        this.prv = new v2d(pos.x, pos.y); // Previous position.

        // These are default values expected to be rarely changed.
        this.refl = 0.75; // Surface reflection.
        this.mu_s = 0.8; // Static friction coefficient.
        this.mu_k = 0.3; // Dynamic friction coefficient.
        this.c_group = 0; // Collision group. Equal values above 0 will collide.

        // Forces that can't be accumulated instantaneously (springs & surface friction).
        this.F_sum = new v2d();
        this.fric_prv = new v2d();

        // Allows the mass to ignore dynamics from integrator loop.
        this.isFixed = false;
        this.ignore = false;
    }
    // Get segment of previous to current position.
    d_p() {
        return this.pos.sub(this.prv);
    }
    // Set previous position according to a given segment.
    set_d_p(d_p = new v2d()) {
        this.prv.mEqu(this.pos.sub(d_p));
    }
    // Translates the mass by a difference in movement.
    translate(D) {
        this.prv.mEqu(this.pos);
        this.pos.mAdd(D);
    }
    // Get mass velocity [m/s]
    get_v(delta) {
        return this.pos.sub(this.prv).div(delta);
    }
    // Set mass to a given velocity [m/s]
    set_v(v, delta) {
        this.prv.mEqu(this.pos.sub(v.mul(delta)));
    }
    // Verlet integrator acceleration.
    v_accel(delta) {
        if (!this.ignore) {
            this.pos.mAdd(this.F_sum.div(this.mass).mul(delta * delta));
        }
    }
    // Verlet inertia application.
    v_iner() {
        if (!this.ignore) {
            const p = this.pos.mul(2).sub(this.prv);
            this.prv.mEqu(this.pos);
            this.pos.mEqu(p);
        }
    }
    // Calculate and accumulate surface friction.
    f_k(S) {
        // To to: make this work correctly.
        const F_S = this.F_sum.pjt(S);
        const V_S = this.d_p().pjt(S);
        const F_Sp = this.F_sum.pjt(S.prp());
        const V_Sp = this.d_p().pjt(S.prp());

        const fk = V_S.inv().nrm().mul(this.mu_k * F_Sp.mag());
        console.log(fk);
        this.F_sum.mAdd(fk);
    }
    // Reflect mass's velocity according to a tangent direction.
    reflect(tan) {
        this.set_d_p(this.d_p().pjt(tan).add(this.d_p().pjt(tan.prp()).inv().mul(this.refl)));
    }
    // Deflect mass from collision with other mass.
    deflect(mass2, mem) {
        const v1 = mem ? mem.va : this.d_p();
        const v2 = mem ? mem.vb : mass2.d_p();
        const r = (this.refl + mass2.refl) / 2;
        this.set_d_p(v1.sub(v1.sub(v2).pjt(this.pos.sub(mass2.pos)).mul(r * 2 * mass2.mass / (this.mass + mass2.mass))));
    }
    draw(ctx, scale, sum = 0) {
        const rad = (this.radius + sum) * scale;
        if (!this.isFixed) {
            ctx.beginPath();
            ctx.v_arc(this.pos.mul(scale), rad);
            ctx.closePath();
            ctx.fill();
        } else ctx.v_f_sqr(this.pos.mul(scale), rad * 2);
    }
};

class Spring {
    constructor(mA, mB, restlength, stiffness = 50, damping = 5) {
        this.mA = mA;
        this.mB = mB;
        this.rst = restlength;
        this.stf = stiffness;
        this.dmp = damping;
        this.c_group = 0; // Collision group. Equal values above 0 will collide.
    }
    translate(D) {
        this.mA.translate(D);
        this.mB.translate(D);
    }
    // Returns the spring's geometric center.
    centroid() {
        return this.mA.pos.add(this.mB.pos).div(2);
    }
    // Returns the spring's center of mass.
    m_center() {
        return this.mA.pos.mul(this.mA.mass).add(this.mB.pos.mul(this.mB.mass)).div(2 * (this.mA.mass + this.mB.mass));
    }
    // Returns perpendicular segment to a given point. Returns undefined if point is not within range.
    p_seg(P, rad) {
        const AB = this.mB.pos.sub(this.mA.pos);
        const l = AB.mag2();
        const AP = P.sub(this.mA.pos);
        const BP = P.sub(this.mB.pos);
        const isInRange = AP.mag2() < l && BP.mag2() < l;
        const S = AP.pjt(AB).sub(AP)
        return isInRange && S.mag2() < rad * rad ? S : undefined;
    }
    // Returns resulting force respect to mA.
    F(delta) {
        const AB = this.mB.pos.sub(this.mA.pos);
        const l = AB.mag();
        // Springing force.
        const Fk = AB.div(l).mul((l - this.rst) * this.stf);
        // Damping force.
        const v_A = !this.mA.ignore ? this.mA.d_p() : new v2d();
        const v_B = !this.mB.ignore ? this.mB.d_p() : new v2d();
        const Fd = v_B.sub(v_A).div(delta).pjt(AB).mul(this.dmp);

        return Fk.add(Fd);
    }
    // Calculates forces and mutably sums to masses.
    apply_F(delta) {
        const F = this.F(delta);
        if (!this.mA.ignore) this.mA.F_sum.mAdd(F);
        if (!this.mB.ignore) this.mB.F_sum.mAdd(F.inv());
    }
    draw(ctx, scale) {
        ctx.beginPath();
        ctx.v_line(this.mA.pos.mul(scale), this.mB.pos.mul(scale));
        ctx.closePath();
        ctx.stroke();
    }
}

// Environment that acts on the model.
class Environment {
    constructor(gravity = new v2d(), drag = 0, x = undefined, y = undefined, w = undefined, h = undefined)
    {
        this.g = gravity;
        this.d = drag;
        this.bounds = [];
        this.s_bounds = { x: x, y: y, w: w, h: h };
    }
    addBound(A, B) {
        this.bounds.push({ A: new v2d(A.x, A.y), B: new v2d(B.x, B.y) });
    }
    boundCollide(m, preserve) {
        for (let i = 0; i < this.bounds.length; i++) {
            const b = this.bounds[i];
            const AB = b.B.sub(b.A);
            const AP = m.pos.sub(b.A);
            const BP = m.pos.sub(b.B);
            const pjt = AP.pjt(AB);
            if (pjt.isInRad(AP, m.radius) && AB.isGreater(AP) && AB.isGreater(BP)
            || b.A.isInRad(m.pos, m.radius) || b.B.isInRad(m.pos, m.radius)) {
                const S = pjt.sub(AP);
                const R = S.nrm().mul(m.radius);
                const T = R.sub(S);
                // Reposition mass.
                m.pos.mSub(T);
                m.prv.mSub(T);
                if (preserve) m.reflect(AB);
            }
        }
    }
    // Screen bounds.
    s_boundHit(m, preserve) {
        const d_horz = new v2d(1, 0); // Horizontal direction
        const d_vert = new v2d(0, 1); // Vertical direction
        if (this.s_bounds.h !== undefined && m.pos.y + m.radius > this.s_bounds.h) {
            const p_temp = m.pos.y;
            m.pos.y = this.s_bounds.h - m.radius;
            m.prv.y += m.pos.y - p_temp;
            if (preserve) m.reflect(d_horz);
        } else if (this.s_bounds.y !== undefined && m.pos.y - m.radius < this.s_bounds.y) {
            const p_temp = m.pos.y;
            m.pos.y = this.s_bounds.y + m.radius;
            m.prv.y += m.pos.y - p_temp;
            if (preserve) m.reflect(d_horz);
        }
        if (this.s_bounds.w !== undefined && m.pos.x + m.radius > this.s_bounds.w) {
            const p_temp = m.pos.x;
            m.pos.x = this.s_bounds.w - m.radius;
            m.prv.x += m.pos.x - p_temp;
            if (preserve) m.reflect(d_vert);
        } else if (this.s_bounds.x !== undefined && m.pos.x - m.radius < this.s_bounds.x) {
            const p_temp = m.pos.x;
            m.pos.x = this.s_bounds.x + m.radius;
            m.prv.x += m.pos.x - p_temp;
            if (preserve) m.reflect(d_vert);
        }
    }
    screenFriction(m) {
        if (this.s_bounds.h != undefined && m.pos.y + m.radius >= this.s_bounds.h) {
            const fk = m.d_p().x !== 0 ? Math.abs(m.F_sum.y) * m.mu_k * -(m.d_p().x / Math.abs(m.d_p().x)) : 0;
            m.F_sum.x += fk;
        }
    }
    draw(ctx, color, scale = 100) {
        ctx.strokeStyle = color;
        for (let b of this.bounds) {
            ctx.beginPath();
            ctx.moveTo(b.A.x * scale, b.A.y * scale);
            ctx.lineTo(b.B.x * scale, b.B.y * scale);
            ctx.closePath();
            ctx.stroke();
        }
    }
}