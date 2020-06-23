import { parse, algToString, invert } from "cubing/alg";
import {
  Canonicalize,
  Invert,
  KPuzzleDefinition,
  KPuzzle,
  IdentityTransformation,
} from "cubing/kpuzzle";

export interface SGSCachedData {
  baseorder: Array<Array<number>>;
  esgs: Array<any>; // TODO
  randgen: Array<Array<string>>;
}

export function parseSGS(def: KPuzzleDefinition, sgs: string): SGSCachedData {
  const baseorder = [];
  const esgs = [];
  const randgen = [];
  const canon = new Canonicalize(def);
  /*
   *   Build an executable SGS from the set of algorithms we are given.
   */
  for (const line of sgs.split("\n")) {
    if (line.startsWith("SetOrder")) {
      var f = line.split(" ");
      for (var j = 2; j < f.length; j++) {
        baseorder[parseInt(f[j], 10) - 1] = [f[1], j - 2];
      }
    } else if (line.startsWith("Alg")) {
      var salgo = line.substring(4);
      var algo = parse(salgo);
      const kpuzzle = new KPuzzle(def);
      kpuzzle.applyAlg(algo);
      const st = IdentityTransformation(def);
      const st2 = kpuzzle.state;
      var st2i = Invert(def, st2);
      var loc = 0;
      while (loc < baseorder.length) {
        var set = baseorder[loc][0];
        var ind = baseorder[loc][1];
        if (
          st[set].permutation[ind] !== st2[set].permutation[ind] ||
          st[set].orientation[ind] !== st2[set].orientation[ind]
        )
          break;
        loc++;
      }
      var set = baseorder[loc][0];
      var ind = baseorder[loc][1];
      if (esgs[loc] === undefined) esgs[loc] = [];
      if (esgs[loc][st2i[set].permutation[ind]] === undefined)
        esgs[loc][st2i[set].permutation[ind]] = [];
      const algoi = invert(algo);
      esgs[loc][st2i[set].permutation[ind]][st2i[set].orientation[ind]] = [
        algToString(algoi),
        canon.sequenceToSearchSequence(algoi),
      ];
      // this empty string as the base element is important; otherwise
      // we won't generate truly random states.  It represents the case
      // where the cubie is already in the correct place.
      if (randgen[loc] === undefined) randgen[loc] = [""];
      randgen[loc].push(salgo);
    } else if (line.length == 0) {
      // blank line
    } else {
      throw new Error(`Bad line in sgs: ${line}`);
    }
  }
  return { baseorder, esgs, randgen };
}
