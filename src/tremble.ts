import { coalesceBaseMoves, parse, Sequence } from "cubing/alg";
import { Puzzle, State } from "cubing/dist/esm/src/twisty/puzzle";
import {
  Invert,
  KPuzzleDefinition,
  Order,
  Transformation,
} from "cubing/kpuzzle";
import { KSolvePuzzle, TreeAlgorithmIndexer } from "cubing/twisty";
import { SGSCachedData } from "./sgs";

const DEFAULT_STAGE1_DEPTH_LIMIT = 4; // For 2x2x2 demo.

function calculateMoves(puzzle, ksp) {
  /*
   *   Get a list of all moves; synthesize the multiples.
   */
  var moves = [];
  var movest = [];
  (function () {
    Object.keys(puzzle.moves).forEach(function (mvname) {
      var o = Order(puzzle, puzzle.moves[mvname]);
      const tai = new TreeAlgorithmIndexer(ksp, parse(mvname));
      var st0 = tai.transformAtIndex(1) as Transformation;
      let stm: Transformation = st0;
      for (var i = 1; i < o; i++) {
        if (i == 1) {
          moves.push(mvname);
        } else if (i + 1 == o) {
          moves.push(mvname + "'");
        } else if (i + i <= o) {
          moves.push(mvname + i);
        } else {
          moves.push(mvname + (o - i) + "'");
        }
        movest.push(stm);
        stm = ksp.combine(stm, st0);
      }
    });
  })();
  return {
    moves,
    movest,
  };
}

function badRandomMoves(moves, ksp): State<Puzzle> {
  var sum = 0;
  var scramble = "";
  for (var i = 0; i < 1000; i++) {
    scramble = scramble + " " + moves[Math.floor(moves.length * Math.random())];
  }
  var sol = "";
  const indexer = new TreeAlgorithmIndexer(ksp, parse(scramble));
  return indexer.transformAtIndex(indexer.numMoves());
}

function goodRandomMoves(randgen: Array<Array<string>>, ksp): State<Puzzle> {
  var scramble = "";
  for (const a of randgen) {
    if (a) { // not all elements may be defined
      scramble = scramble + " " + a[Math.floor(a.length * Math.random())];
    }
  }
  const indexer = new TreeAlgorithmIndexer(ksp, parse(scramble));
  return indexer.transformAtIndex(indexer.numMoves());  
}

export class TrembleSolver {
  private puzzle: KPuzzleDefinition;
  private ksp;
  private st;

  private baseorder: Array<any>; // TODO
  private esgs: Array<any>; // TODO
  private randgen: Array<Array<string>>;

  private moves;
  private movest;

  constructor(private def: KPuzzleDefinition, sgs: SGSCachedData) {
    this.ksp = new KSolvePuzzle(this.def);
    this.st = this.ksp.identity();

    this.baseorder = sgs.baseorder;
    this.esgs = sgs.esgs;
    this.randgen = sgs.randgen;

    const movesInfo = calculateMoves(this.def, this.ksp);
    this.moves = movesInfo.moves;
    this.movest = movesInfo.movest;
  }

  public badRandomMoves(): State<Puzzle> {
    return badRandomMoves(this.moves, this.ksp);
  }

  public goodRandomMoves(): State<Puzzle> {
    return goodRandomMoves(this.randgen, this.ksp);
  }

  public async solve(
    state: State<Puzzle>,
    stage1DepthLimit: number = DEFAULT_STAGE1_DEPTH_LIMIT
  ): Promise<Sequence> {
    let bestAlg: string;
    var best = 1000000;
    const recur = (st4, togo, sofar) => {
      if (togo == 0) {
        var t = this.sgsPhaseSolve(st4);
        if (sofar.length + t[0] < best) {
          best = sofar.length + t[0];
          bestAlg = sofar.join(" ") + " " + t[1].join(" ");
          // console.log("New best " + best + " with prefix of " + sofar.length);
          // console.log(sofar.join(" ") + " " + t[1].join(" "));
        }
        return;
      }
      for (var m = 0; m < this.moves.length; m++) {
        sofar.push(this.moves[m]);
        recur(this.ksp.combine(st4, this.movest[m]), togo - 1, sofar);
        sofar.pop();
      }
    };
    for (var d = 0; d < stage1DepthLimit; d++) {
      recur(state, d, []);
    }
    return coalesceBaseMoves(parse(bestAlg));
  }

  private sgsPhaseSolve(st4): [number, string[]] {
    var algos = [];
    var len = 0;
    for (var i = 0; i < this.baseorder.length; i++) {
      var set = this.baseorder[i][0];
      var ind = this.baseorder[i][1];
      if (
        st4[set].permutation[ind] !== this.st[set].permutation[ind] ||
        st4[set].orientation[ind] !== this.st[set].orientation[ind]
      ) {
        var st4i = Invert(this.def, st4);
        var a = this.esgs[i][st4i[set].permutation[ind]][
          st4i[set].orientation[ind]
        ];
        if (a === undefined) throw "Missing algorithm in sgs or esgs?";
        len = len + a[0].split(" ").length;
        algos.push(a[0]);
        st4 = this.ksp.combine(st4, a[1]);
        if (
          st4[set].permutation[ind] !== this.st[set].permutation[ind] ||
          st4[set].orientation[ind] !== this.st[set].orientation[ind]
        ) {
          console.log("Fail.");
        }
      }
    }
    return [len, algos];
  }
}
