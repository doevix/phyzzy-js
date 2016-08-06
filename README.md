# phyzzy-js
A tiny 2d physics simulator. Uses a system of masses and springs to create
objects that bounce and jiggle. The main goal of the phyzzy library is to
make use of a verlet-based 2d physics simulator with modular characteristics.
By modular, it means that new physics and constraints can be added as prototype
methods thereby extending the possibility of the types of creations that can be
made.

### Details
The main Phyzzy library is found within the folder named phyzzy. The following
elements can be found inside:

- **components/**
    - *mass.js*
    - *spring.js*
    - *environment.js*
    - *vector.js*
- engine.js

Each of the modules contain factory functions (excluding vector.js) which
generate their corresponding object. The engine.js module creates the Phyzzy 
engine which simulates the movement via a fixed-time Verlet integrator.

Current implementation uses Smoothie's standalone require.js by Torben Haase
(https://github.com/letorbi/smoothie)