import * as histogram from "ascii-histogram";
import { algToString } from "cubing/alg";
import {
  getPuzzleGeometryByName,
  PuzzleGeometry,
} from "cubing/puzzle-geometry";
import { readFileSync } from "fs";
import { parseSGS } from "../sgs";
import { TrembleSolver } from "../tremble";

// node
if (typeof performance === "undefined") {
  const { performance } = require("perf_hooks");
}

function getPuzzleGeometry(puzzleName): PuzzleGeometry {
  if (puzzleName == "kilominx") {
    return getPuzzleGeometryByName("megaminx", [
      "allmoves",
      "false",
      "optimize",
      "true",
      "centersets",
      "false",
      "edgesets",
      "false",
    ]);
  } else {
    return getPuzzleGeometryByName(puzzleName, [
      "allmoves",
      "false",
      "optimize",
      "true",
    ]);
  }
}

function readSGSFile(puzname): string {
  const sgsname = puzname.replace(/ /g, "_").replace(/'/g, "");
  return readFileSync(__dirname + "/puzzles/" + sgsname + ".sgs", "utf8");
}

async function benchmark(puzzleName: string, n: number) {
  const pg = getPuzzleGeometry(puzzleName);
  const def = pg.writekpuzzle();

  const sgs = parseSGS(def, readSGSFile(puzzleName));
  const solver = new TrembleSolver(def, sgs);

  const lengths = {};
  const roundedTimes = {};
  // const results = [];

  console.log(`Benchmarking ${n} random-move scrambles for ${puzzleName}.`)
  for (let i = 0; i < n; i++) {
    const state = solver.badRandomMoves();
    var t0 = performance.now();
    const seq = await solver.solve(state);
    const len = seq.nestedUnits.length;
    var t1 = performance.now();
    // console.log([algToString(seq), len, t1 - t0]);
    // results.push([alg, len, t1 - t0]);

    lengths[Math.floor(len)] |= 0;
    lengths[Math.floor(len)]++;

    roundedTimes[Math.floor(t1 - t0)] |= 0;
    roundedTimes[Math.floor(t1 - t0)]++;
    process.stdout.write(".");
  }
  // console.log(results);
  console.log("\n"); // Clear dots.
  console.log("# Solution lengths\n");
  console.log(histogram(lengths));

  console.log(""); // Clear dots.
  console.log("#Milliseconds to solve\n");
  console.log(histogram(roundedTimes));
}

const puzzleName = process.argv[2];
const n = parseInt(process.argv[3] ?? "100", 10);
if (puzzleName) {
  benchmark(process.argv[2], n);
} else {
  console.error("Please specify a puzzle (e.g. 2x2x2).");
}
