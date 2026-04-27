import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- MATH & ALGORITHM ---

class Sphere {
    constructor(c, r) {
        this.c = c; // THREE.Vector3
        this.r = r; // Number
    }

    contains(p) {
        return this.c.distanceTo(p) <= this.r + 1e-6;
    }
}

function getSphere2(A, B) {
    let c = new THREE.Vector3().addVectors(A, B).multiplyScalar(0.5);
    let r = A.distanceTo(B) / 2;
    return new Sphere(c, r);
}

function getSphere3(A, B, C) {
    let a = new THREE.Vector3().subVectors(A, C);
    let b = new THREE.Vector3().subVectors(B, C);
    let cross = new THREE.Vector3().crossVectors(a, b);
    let denom = 2 * cross.lengthSq();
    if (denom === 0) return getSphere2(A, B);

    let num = new THREE.Vector3().subVectors(
        b.clone().multiplyScalar(a.lengthSq()),
        a.clone().multiplyScalar(b.lengthSq())
    ).cross(cross);
    
    let c = new THREE.Vector3().copy(C).add(num.multiplyScalar(1/denom));
    let r = c.distanceTo(A);
    return new Sphere(c, r);
}

function getSphere4(A, B, C, D) {
    let a = new THREE.Vector3().subVectors(A, D);
    let b = new THREE.Vector3().subVectors(B, D);
    let c = new THREE.Vector3().subVectors(C, D);

    let denom = 2 * a.dot(new THREE.Vector3().crossVectors(b, c));
    if (denom === 0) return getSphere3(A, B, C);

    let term1 = new THREE.Vector3().crossVectors(b, c).multiplyScalar(a.lengthSq());
    let term2 = new THREE.Vector3().crossVectors(c, a).multiplyScalar(b.lengthSq());
    let term3 = new THREE.Vector3().crossVectors(a, b).multiplyScalar(c.lengthSq());

    let num = term1.add(term2).add(term3);
    let center = new THREE.Vector3().copy(D).add(num.multiplyScalar(1/denom));
    let r = center.distanceTo(A);
    return new Sphere(center, r);
}

function trivialSphere(R) {
    if (R.length === 0) {
        return new Sphere(new THREE.Vector3(0, 0, 0), 0);
    } else if (R.length === 1) {
        return new Sphere(R[0].clone(), 0);
    } else if (R.length === 2) {
        return getSphere2(R[0], R[1]);
    } else if (R.length === 3) {
        return getSphere3(R[0], R[1], R[2]);
    } else {
        return getSphere4(R[0], R[1], R[2], R[3]);
    }
}

const delay = ms => new Promise(res => setTimeout(res, ms));

// --- THREE.JS SETUP ---

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 20, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Grid
let gridHelper = new THREE.GridHelper(40, 40, 0x334155, 0x1e293b);
gridHelper.position.y = -10;
scene.add(gridHelper);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- VISUALIZATION LOGIC ---

let points = [];
let pointMeshes = [];
let currentSphereMesh = null;
let isRunning = false;
let isPaused = false;

async function visualDelay(ms) {
    let elapsed = 0;
    while (elapsed < ms) {
        if (!isRunning) throw new Error("Stopped");
        if (isPaused) {
            await delay(100);
            continue;
        }
        await delay(50);
        elapsed += 50;
    }
    if (!isRunning) throw new Error("Stopped");
}

const COLORS = {
    normal: 0xffffff,
    boundary: 0xef4444,
    current: 0xfbbf24,
    sphere: 0x3b82f6
};

const pointGeo = new THREE.SphereGeometry(0.3, 16, 16);
const normalMat = new THREE.MeshStandardMaterial({ color: COLORS.normal, roughness: 0.2, metalness: 0.1 });
const boundaryMat = new THREE.MeshStandardMaterial({ color: COLORS.boundary, emissive: 0xef4444, emissiveIntensity: 0.5 });
const currentMat = new THREE.MeshStandardMaterial({ color: COLORS.current, emissive: 0xfbbf24, emissiveIntensity: 0.8 });

const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
const sphereMat = new THREE.MeshPhysicalMaterial({ 
    color: COLORS.sphere, 
    transparent: true, 
    opacity: 0.2,
    roughness: 0.1,
    transmission: 0.9,
    thickness: 0.5
});
const wireframeMat = new THREE.LineBasicMaterial({ color: COLORS.sphere, transparent: true, opacity: 0.5 });

function updateVisualSphere(sphere) {
    if (currentSphereMesh) {
        scene.remove(currentSphereMesh);
        currentSphereMesh = null;
    }
    
    document.getElementById('status-radius').innerText = sphere.r.toFixed(2);
    document.getElementById('status-center').innerText = `(${sphere.c.x.toFixed(2)}, ${sphere.c.y.toFixed(2)}, ${sphere.c.z.toFixed(2)})`;
    
    if (sphere.r === 0) return;

    currentSphereMesh = new THREE.Group();

    const mesh = new THREE.Mesh(sphereGeo, sphereMat);
    mesh.scale.set(sphere.r, sphere.r, sphere.r);
    mesh.position.copy(sphere.c);
    
    const wireframeGeo = new THREE.WireframeGeometry(sphereGeo);
    const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
    wireframe.scale.set(sphere.r, sphere.r, sphere.r);
    wireframe.position.copy(sphere.c);

    currentSphereMesh.add(mesh);
    currentSphereMesh.add(wireframe);
    scene.add(currentSphereMesh);
}

function updatePointColors(P, R, currentP) {
    let bPoints = R.map(p => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})`);
    document.getElementById('status-boundary').innerText = bPoints.length > 0 ? bPoints.join('\n') : "None";

    for (let i = 0; i < points.length; i++) {
        let p = points[i];
        let mesh = pointMeshes[i];
        
        if (currentP && p.equals(currentP)) {
            mesh.material = currentMat;
            mesh.scale.set(1.5, 1.5, 1.5);
        } else if (R.includes(p)) {
            mesh.material = boundaryMat;
            mesh.scale.set(1.2, 1.2, 1.2);
        } else {
            mesh.material = normalMat;
            mesh.scale.set(1, 1, 1);
        }
    }
}

async function welzlHelper(P, R, n) {
    if (!isRunning) throw new Error("Stopped");

    if (n === 0 || R.length === 4) {
        let d = trivialSphere(R);
        updateVisualSphere(d);
        updatePointColors(P.slice(0, n), R, null);
        await visualDelay(300);
        return d;
    }

    let idx = Math.floor(Math.random() * n);
    let p = P[idx];

    let temp = P[idx];
    P[idx] = P[n - 1];
    P[n - 1] = temp;

    updatePointColors(P.slice(0, n-1), R, p);
    await visualDelay(200);

    let D = await welzlHelper(P, R, n - 1);

    if (D.contains(p)) {
        updatePointColors(P.slice(0, n), R, p);
        await visualDelay(100);
        return D;
    }

    R.push(p);
    document.getElementById('status-text').innerText = `Adding to Boundary (${R.length}/4)`;
    
    D = await welzlHelper(P, R, n - 1);
    
    R.pop();

    return D;
}

function welzlSync(P, R, n) {
    if (n === 0 || R.length === 4) {
        return trivialSphere(R);
    }

    let idx = Math.floor(Math.random() * n);
    let p = P[idx];

    let temp = P[idx];
    P[idx] = P[n - 1];
    P[n - 1] = temp;

    let D = welzlSync(P, R, n - 1);

    if (D.contains(p)) {
        return D;
    }

    R.push(p);
    D = welzlSync(P, R, n - 1);
    R.pop();

    return D;
}

function computeFinalSphere() {
    if (points.length === 0) return;
    
    let P_copy = [...points];
    let finalSphere = welzlSync(P_copy, [], P_copy.length);
    
    updateVisualSphere(finalSphere);
    updatePointColors(points, [], null);
    
    let boundaryList = [];
    for (let i = 0; i < points.length; i++) {
        let p = points[i];
        if (Math.abs(finalSphere.c.distanceTo(p) - finalSphere.r) < 1e-4) {
            pointMeshes[i].material = boundaryMat;
            pointMeshes[i].scale.set(1.2, 1.2, 1.2);
            boundaryList.push(`(${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})`);
        }
    }
    document.getElementById('status-boundary').innerText = boundaryList.length > 0 ? boundaryList.join('\n') : "None";
    
    statusText.innerText = "Points Generated";
    statusText.style.color = "var(--success)";
}

function generatePoints(count) {
    points.forEach((_, i) => scene.remove(pointMeshes[i]));
    points = [];
    pointMeshes = [];
    if (currentSphereMesh) scene.remove(currentSphereMesh);
    currentSphereMesh = null;
    document.getElementById('status-radius').innerText = "0.00";
    document.getElementById('status-center').innerText = "(0.00, 0.00, 0.00)";

    btnVisualize.disabled = false;
    btnVisualize.innerText = "Visualize Evolution";
    isPaused = false;
    isRunning = false;

    for (let i = 0; i < count; i++) {
        let x = (Math.random() - 0.5) * 20;
        let y = (Math.random() - 0.5) * 20;
        let z = (Math.random() - 0.5) * 20;
        let p = new THREE.Vector3(x, y, z);
        points.push(p);

        let mesh = new THREE.Mesh(pointGeo, normalMat);
        mesh.position.copy(p);
        scene.add(mesh);
        pointMeshes.push(mesh);
    }
    
    computeFinalSphere();
}

// --- UI INTERACTIONS ---

const numPointsInput = document.getElementById('numPoints');
const btnGenerate = document.getElementById('btnGenerate');
const btnVisualize = document.getElementById('btnVisualize');
const btnReset = document.getElementById('btnReset');
const statusText = document.getElementById('status-text');
const themeToggle = document.getElementById('themeToggle');

themeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'light');
        scene.background = new THREE.Color(0xf8fafc);
        scene.remove(gridHelper);
        gridHelper = new THREE.GridHelper(40, 40, 0xcbd5e1, 0xe2e8f0);
        gridHelper.position.y = -10;
        scene.add(gridHelper);
        normalMat.color.setHex(0x0f172a);
    } else {
        document.documentElement.removeAttribute('data-theme');
        scene.background = new THREE.Color(0x0f172a);
        scene.remove(gridHelper);
        gridHelper = new THREE.GridHelper(40, 40, 0x334155, 0x1e293b);
        gridHelper.position.y = -10;
        scene.add(gridHelper);
        normalMat.color.setHex(0xffffff);
    }
});

btnGenerate.addEventListener('click', async () => {
    if (isRunning) {
        isRunning = false;
        isPaused = false;
        await delay(300); // Wait for visualizer to halt
    }
    generatePoints(parseInt(numPointsInput.value));
});

btnReset.addEventListener('click', () => {
    controls.reset();
    camera.position.set(20, 20, 30);
});

btnVisualize.addEventListener('click', async () => {
    if (points.length === 0) return;

    if (isRunning) {
        isPaused = !isPaused;
        if (isPaused) {
            btnVisualize.innerText = "Resume Evolution";
            statusText.innerText = "Paused...";
            statusText.style.color = "var(--text-muted)";
        } else {
            btnVisualize.innerText = "Pause Evolution";
            statusText.innerText = "Visualizing Evolution...";
            statusText.style.color = "var(--accent)";
        }
        return;
    }

    isRunning = true;
    isPaused = false;
    btnVisualize.innerText = "Pause Evolution";
    statusText.innerText = "Visualizing Evolution...";
    statusText.style.color = "var(--accent)";

    // Reset view for visualization
    updatePointColors(points, [], null);
    if (currentSphereMesh) {
        scene.remove(currentSphereMesh);
        currentSphereMesh = null;
        document.getElementById('status-radius').innerText = "0.00";
        document.getElementById('status-center').innerText = "(0.00, 0.00, 0.00)";
    }

    let P_copy = [...points];
    try {
        let finalSphere = await welzlHelper(P_copy, [], P_copy.length);
        if (!isRunning) return; // If stopped by generating new points
        updatePointColors(points, [], null); 
        
        let boundaryList = [];
        for (let i = 0; i < points.length; i++) {
            let p = points[i];
            if (Math.abs(finalSphere.c.distanceTo(p) - finalSphere.r) < 1e-4) {
                pointMeshes[i].material = boundaryMat;
                pointMeshes[i].scale.set(1.2, 1.2, 1.2);
                boundaryList.push(`(${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})`);
            }
        }
        document.getElementById('status-boundary').innerText = boundaryList.length > 0 ? boundaryList.join('\n') : "None";
        
        statusText.innerText = "Visualization Complete!";
        statusText.style.color = "var(--success)";
        btnVisualize.innerText = "Visualize Evolution";
    } catch (e) {
        if (e.message !== "Stopped") console.error(e);
        // Do not update status text here because it could have been stopped by btnGenerate
    } finally {
        isRunning = false;
        isPaused = false;
        if (btnVisualize.innerText === "Pause Evolution" || btnVisualize.innerText === "Resume Evolution") {
             btnVisualize.innerText = "Visualize Evolution";
        }
    }
});

// Init
statusText.innerText = "Generate points to start";

// Render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    // Slow rotation for the sphere wireframe
    if (currentSphereMesh) {
        currentSphereMesh.children[1].rotation.y += 0.005;
        currentSphereMesh.children[1].rotation.x += 0.002;
    }
    
    renderer.render(scene, camera);
}
animate();
