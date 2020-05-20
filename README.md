A set of base orders and strong generating sets for some twisty puzzles.
These go with cubing.js and twsearch.  Still under development.  The
testtremble.js is just a sample exerciser.

To install:

    npm init
    npm install cubing

To try it out:

    node testtremble.js 3x3x3

Todo:

* Merge/cancel moves between algorithms
* Merge/cancel moves with respect to commutating moves
* Make trembling respect canonical sequences.
* Make trembling include pre/post rotations.
* Make trembling consider inverse positions.
* Make trembling use a beam search approach.
* Make different sgs for different move sets (i.e., block vs slice for
the 4x4x4).

To integrate into twizzle, we'll need to either update the way twizzle
generates random positions (so it doesn't move centers on the 3x3x3, for
instance) or else add code to rotate the whole puzzle appropriately before
trying these algorithms.
