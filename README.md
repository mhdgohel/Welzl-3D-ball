# Welzl's 3D Minimum Enclosing Ball

An interactive, high-performance 3D visualization of **Welzl's Algorithm** for computing the Minimum Bounding Sphere (Minimum Enclosing Ball) of a set of 3D points. 

![Algorithm in action]

This project features a completely vanilla JavaScript implementation of Welzl's elegant randomized geometric algorithm, rendered with stunning clarity using Three.js.

## Features

- **Blazing Fast `O(n)` Computation:** Mathematically accurate vector operations handle sets up to 5,000+ points practically instantaneously using a completely iterative-fallback strategy.
- **Real-Time Algorithm Evolution:** Instead of just spitting out the answer, click **"Visualize Evolution"** to watch the recursive divide-and-conquer steps dynamically update point states and spheres right before your eyes.
- **Dynamic Math Feed:** Track the exact real-time boundary coordinates and radius as the algorithm converges on the mathematical optimal bounding volume.

## Welzl's Algorithm

Welzl's algorithm is a randomized algorithm designed to find the smallest circle (in 2D) or sphere (in 3D) that completely encloses a given set of points.

It works recursively by picking a random point from the set. It computes the minimum bounding sphere for the *remaining* points. If the randomly picked point is outside that sphere, the math guarantees that the point **must** be on the boundary of the new minimum bounding sphere! It then recursively enforces that point as a boundary constraint.

- **Time Complexity:** Expected $\mathcal{O}(n)$
- **Space Complexity:** $\mathcal{O}(n)$ memory

### The Math (3D Spheres)
The algorithm gracefully computes boundary spheres for unique geometrical edge cases:
- **0 Points:** Empty sphere with radius 0.
- **1 Point:** Point-sphere exactly on the coordinate with radius 0.
- **2 Points:** Midpoint sphere between the two coordinates.
- **3 Points:** Coplanar circumsphere of the triangle formed by the points.
- **4 Points:** Complex circumsphere of the spatial tetrahedron.

## Built With
- **Three.js** (3D Rendering)
- **Vanilla JavaScript** (Algorithm Math & DOM Manipulation)
- **CSS3 / HTML5** 
