# phyzzy-js
A tiny 2d physics simulator. Uses a system of masses and springs to create
objects that bounce and jiggle. The main goal of the phyzzy library is to
make use of a verlet-based 2d physics simulator with modular characteristics. 
It is possible to add new forces and constraints by modifying the input force
and input collision calculations.

This project is currently a work in progress. There are still many features to 
be added as well as a couple of bugs to fix.

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
for in-browser require() support.
(https://github.com/letorbi/smoothie)
