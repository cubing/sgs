alg = require('cubing/alg') ;
kpuz = require('cubing/kpuzzle') ;
puzg = require('cubing/puzzle-geometry') ;
twisty = require('cubing/twisty') ;
fs = require('fs') ;

puzname = process.argv[2] ;
/*
 *   Turn a name into a geometry.
 */
if (puzname == "kilominx") {
   pg = puzg.getPuzzleGeometryByName("megaminx", ['allmoves', false, 'optimize', true, "centersets", false, "edgesets", false]) ;
} else {
   pg = puzg.getPuzzleGeometryByName(puzname, ['allmoves', false, 'optimize', true]) ;
}
/*
 *   Parse the ksolve into a kpuzzle.
 */
puzzle = pg.writekpuzzle() ;
worker = new kpuz.KPuzzle(puzzle) ;
/*
 *   Now make a twisty KSolvePuzzle.  Have to export KSolvePuzzle
 *   in src/twisty/index.ts from puzzle.
 */
ksp = new twisty.KSolvePuzzle(puzzle) ;
sgsname = puzname.replace(/ /g, "_").replace(/'/g, "") ;
sgs = fs.readFileSync(sgsname + ".sgs", 'utf8').split("\n") ;
st = ksp.identity() ;
baseorder = [] ;
esgs = [] ;
/*
 *   Build an executable SGS from the set of algorithms we are given.
 */
for (var i=0; i<sgs.length; i++) {
   if (sgs[i].startsWith("SetOrder")) {
      var f = sgs[i].split(" ") ;
      for (var j=2; j<f.length; j++) {
         baseorder[f[j]-1] = [f[1], j-2] ;
      }
   } else if (sgs[i].startsWith("Alg")) {
      var salgo = sgs[i].substring(4) ;
      var algo = alg.parse(salgo) ;
      var tai = new twisty.TreeAlgorithmIndexer(ksp, algo) ;
      var st2 = tai.transformAtIndex(tai.numMoves()) ;
      var st2i = kpuz.Invert(puzzle, st2) ;
      var loc = 0 ;
      while (loc < baseorder.length) {
         var set = baseorder[loc][0] ;
         var ind = baseorder[loc][1] ;
         if (st[set].permutation[ind] !== st2[set].permutation[ind] ||
             st[set].orientation[ind] !== st2[set].orientation[ind])
            break ;
         loc++ ;
      }
      var set = baseorder[loc][0] ;
      var ind = baseorder[loc][1] ;
      if (esgs[loc] === undefined)
         esgs[loc] = [] ;
      if (esgs[loc][st2i[set].permutation[ind]] === undefined)
         esgs[loc][st2i[set].permutation[ind]] = [] ;
      esgs[loc][st2i[set].permutation[ind]][st2i[set].orientation[ind]] =
                                   [alg.algToString(alg.invert(algo)), st2i]  ;
   } else if (sgs[i].length == 0) { // blank line
   } else {
      throw "Bad line in sgs " + sgs[i] ;
   }
}
/*
 *   Get a list of all moves; synthesize the multiples.
 */
var moves = [] ;
var movest = [] ;
Object.keys(puzzle.moves).forEach(function (mvname) {
   var o = kpuz.Order(puzzle, puzzle.moves[mvname]) ;
   var tai = new twisty.TreeAlgorithmIndexer(ksp, alg.parse(mvname)) ;
   var st0 = tai.transformAtIndex(1) ;
   var stm = st0 ;
   for (var i=1; i<o; i++) {
      if (i == 1) {
         moves.push(mvname) ;
      } else if (i + 1 == o) {
         moves.push(mvname + "'") ;
      } else if (i+i<=o) {
         moves.push(mvname + i) ;
      } else {
         moves.push(mvname + (o-i) + "'") ;
      }
      movest.push(stm) ;
      stm = ksp.combine(stm, st0) ;
   }
}) ;
var sum = 0 ;
var scramble = "" ;
for (var i=0; i<100; i++) {
   scramble = scramble + " " + moves[Math.floor(moves.length*Math.random())] ;
}
var sol = '' ;
tai = new twisty.TreeAlgorithmIndexer(ksp, alg.parse(scramble)) ;
st4 = tai.transformAtIndex(tai.numMoves()) ;
function solve(st4) {
   var algos = [] ;
   var len = 0 ;
   for (var i=0; i<baseorder.length; i++) {
      var set = baseorder[i][0] ;
      var ind = baseorder[i][1] ;
      if (st4[set].permutation[ind] !== st[set].permutation[ind] ||
          st4[set].orientation[ind] !== st[set].orientation[ind]) {
         var st4i = kpuz.Invert(puzzle, st4) ;
         var a = esgs[i][st4i[set].permutation[ind]][st4i[set].orientation[ind]] ;
         if (a === undefined)
            throw "Missing algorithm in sgs or esgs?" ;
         len = len + a[0].split(" ").length ;
         algos.push(a[0]) ;
         st4 = ksp.combine(st4, a[1]) ;
         if (st4[set].permutation[ind] !== st[set].permutation[ind] ||
             st4[set].orientation[ind] !== st[set].orientation[ind]) {
            console.log("Fail.") ;
         }
      }
   }
   return [len, algos] ;
}
var best = 1000000 ;
function recur(st4, togo, sofar) {
   if (togo == 0) {
      var t = solve(st4) ;
      if (sofar.length + t[0] < best) {
         best = sofar.length + t[0] ;
         console.log("New best " + best + " with prefix of " + sofar.length) ;
         console.log(sofar.join(" ") + " " + t[1].join(" ")) ;
      }
      return ;
   }
   for (var m=0; m<moves.length; m++) {
      sofar.push(moves[m]) ;
      recur(ksp.combine(st4, movest[m]), togo-1, sofar) ;
      sofar.pop() ;
   }
}
for (var d=0; ; d++) {
   recur(st4, d, []) ;
}
