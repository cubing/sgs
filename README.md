A set of base orders and strong generating sets for some twisty puzzles.
These go with [`cubing.js`](https://github.com/cubing/cubing.js) and [`twsearch`](https://github.com/cubing/twsearch). Still under development.

To try it out:

    npm install
    make test # Run default puzzle test

    # Run a particular puzzle
    npx ts-node --transpile-only ./src/test/benchmark.ts [name of puzzle] [number of tries]

Sample output:

    npx ts-node --transpile-only ./src/test/benchmark.ts 2x2x2
    Benchmarking 100 random-move scrambles for 2x2x2.
    ....................................................................................................

    # Solution lengths

    5 | ##                                                           | 1
    6 | ##                                                           | 1
    7 | #########                                                    | 4
    8 | #######                                                      | 3
    9 | ####################                                         | 9
    10 | ########################################                     | 18
    11 | ############################################################ | 27
    12 | #################################################            | 22
    13 | ###########################                                  | 12
    14 | ##                                                           | 1
    15 | ####                                                         | 2

    # Milliseconds to solve

    22 | ##############                                               | 8
    23 | ############################################################ | 35
    24 | ##################################                           | 20
    25 | ###############                                              | 9
    26 | ###############                                              | 9
    27 | #################                                            | 10
    28 | #######                                                      | 4
    29 | ##                                                           | 1
    31 | ###                                                          | 2
    35 | ##                                                           | 1
    40 | ##                                                           | 1

Todo:

* Merge/cancel moves between algorithms
* Merge/cancel moves with respect to commutating moves
* Make trembling respect canonical sequences.
* Make trembling include pre/post rotations.
* Make trembling permit mid-solution rotations.
* Make trembling consider inverse positions.
* Make trembling use a beam search approach.
* Make different sgs for different move sets (i.e., block vs slice for
the 4x4x4).

To integrate into twizzle, we'll need to either update the way twizzle
generates random positions (so it doesn't move centers on the 3x3x3, for
instance) or else add code to rotate the whole puzzle appropriately before
trying these algorithms.
