# phyzzy-js
A tiny 2d physics simulator. Uses a system of masses and springs to create
objects that bounce and jiggle. The main goal of the phyzzy library is to
make use of a verlet-based 2d physics simulator with modular characteristics.
By modular, it means that new physics and constraints can be added as prototype
methods thereby extending the possibility of the types of creations that can be
made.

### Details

##### main.js
Script used as main source file and entry point for webapp. Only used for testing.

##### phyzzy.js
This library is used as a wrapper to put into use the elements necessary to create a
working simulation. Drawing to canvas is not required to use. Also contains a user object
in case user interaction is desired.

#### mesh.js
This library holds a collection of connected masses and springs and applies their
methods all together.

#### obj.js
This library contains the elements used to simulate, mainly being the mass and spring which
are the main pieces of what makes a mesh. Also contains the environment and containers that act
as walls in case the user does preferres a finite space to work in.

#### vector.js
Library for vector object and used throughout the the previous libraries. Contains properties and
methods for two-dimensional vectors.

