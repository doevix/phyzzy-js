# phyzzy-js
A tiny 2d physics simulator. Uses a system of masses and springs to create
objects that bounce and jiggle.

### Details

##### main.js
Script used as main source file and entry point for webapp. Currently used for testing.

##### phyzzy.js
Phyzzy-JS library to perform 2d spring mass simulation. The library contains the following:
- Vector utilities
- Mass: points that contain properties and methods that apply and obey Newtonian movement.
- Spring: lines that act as springs to link mass movement
- Mesh: class that contains collection of masses and springs.
- WallBox: class used as a way to collide against wall. Returns the new position vectors for movement.
