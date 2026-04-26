class Point3D {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    sub(p) {
        return new Point3D(this.x - p.x, this.y - p.y, this.z - p.z);
    }

    add(p) {
        return new Point3D(this.x + p.x, this.y + p.y, this.z + p.z);
    }

    mul(s) {
        return new Point3D(this.x * s, this.y * s, this.z * s);
    }

    dot(p) {
        return this.x * p.x + this.y * p.y + this.z * p.z;
    }

    cross(p) {
        return new Point3D(
            this.y * p.z - this.z * p.y,
            this.z * p.x - this.x * p.z,
            this.x * p.y - this.y * p.x
        );
    }

    magSq() {
        return this.dot(this);
    }

    mag() {
        return Math.sqrt(this.magSq());
    }

    dist(p) {
        return this.sub(p).mag();
    }
}

class Sphere {
    constructor(c, r) {
        this.c = c;
        this.r = r;
    }

    contains(p) {
        return this.c.dist(p) <= this.r + 1e-9;
    }
}

function getSphere2(A, B) {
    let c = A.add(B).mul(0.5);
    let r = A.dist(B) / 2;
    return new Sphere(c, r);
}

function getSphere3(A, B, C) {
    let a = A.sub(C);
    let b = B.sub(C);
    let cross = a.cross(b);
    let denom = 2 * cross.magSq();
    if (denom === 0) return getSphere2(A, B); // Degenerate case

    let num = b.mul(a.magSq()).sub(a.mul(b.magSq())).cross(cross);
    let c = C.add(num.mul(1/denom));
    let r = c.dist(A);
    return new Sphere(c, r);
}

function getSphere4(A, B, C, D) {
    let a = A.sub(D);
    let b = B.sub(D);
    let c = C.sub(D);

    let denom = 2 * a.dot(b.cross(c));
    if (denom === 0) return getSphere3(A, B, C); // Degenerate case (coplanar)

    let term1 = b.cross(c).mul(a.magSq());
    let term2 = c.cross(a).mul(b.magSq());
    let term3 = a.cross(b).mul(c.magSq());

    let num = term1.add(term2).add(term3);
    let center = D.add(num.mul(1/denom));
    let r = center.dist(A);
    return new Sphere(center, r);
}

function trivialSphere(R) {
    if (R.length === 0) {
        return new Sphere(new Point3D(0, 0, 0), 0);
    } else if (R.length === 1) {
        return new Sphere(R[0], 0);
    } else if (R.length === 2) {
        return getSphere2(R[0], R[1]);
    } else if (R.length === 3) {
        return getSphere3(R[0], R[1], R[2]);
    } else {
        return getSphere4(R[0], R[1], R[2], R[3]);
    }
}

function welzlHelper(P, R, n) {
    if (n === 0 || R.length === 4) {
        return trivialSphere(R);
    }

    // Pick a random point
    let idx = Math.floor(Math.random() * n);
    let p = P[idx];

    // Swap P[idx] with P[n - 1] to "remove" it
    let temp = P[idx];
    P[idx] = P[n - 1];
    P[n - 1] = temp;

    let D = welzlHelper(P, R, n - 1);

    if (D.contains(p)) {
        return D;
    }

    R.push(p);
    D = welzlHelper(P, R, n - 1);
    R.pop();

    return D;
}

function minBoundingSphere(P) {
    let P_copy = [...P];
    return welzlHelper(P_copy, [], P_copy.length);
}

// Export for usage
if (typeof module !== 'undefined') {
    module.exports = { Point3D, Sphere, minBoundingSphere };
}

// Test
if (require.main === module) {
    let points = [
        new Point3D(0, 0, 0),
        new Point3D(10, 0, 0),
        new Point3D(0, 10, 0),
        new Point3D(0, 0, 10)
    ];
    console.log(minBoundingSphere(points));
}
