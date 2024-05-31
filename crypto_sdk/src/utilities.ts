// const Scalar = require("ffjavascript").Scalar;
import { Scalar } from "ffjavascript";
// todo
export type BabyJub = any;
export type EC = any;
export type Deck = any;

/// Throws an error if `condition` is not true.
export function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message || "Assertion Failed");
  }
}

/// Samples field elements between 0 ~ min(2**numBits-1, Fr size).
export function sampleFieldElements(
  babyjub: BabyJub,
  numBits: bigint,
  numElements: number,
): bigint[] {
  const arr: bigint[] = [];
  let num: bigint;
  const threshold = Scalar.exp(2, numBits);
  for (let i = 0; i < numElements; i++) {
    do {
      num = Scalar.fromRprLE(babyjub.F.random());
    } while (Scalar.geq(num, threshold));
    arr.push(num);
  }
  return arr;
}

/// Compresses an array of boolean into a bigint.
export function bits2Num(arr: boolean[]): bigint {
  let res = 0n;
  let power = 1n;
  for (let i = 0; i < arr.length; i++) {
    res += BigInt(arr[i]) * power;
    power *= 2n;
  }
  return res;
}

/// Decomposes `num` into a boolean array of bits. note this is tranversed e.g. 4 -> f f t
export function num2Bits(num: bigint, length: number): boolean[] {
  const bits: boolean[] = [];
  while (num > 0) {
    const tmp = Boolean(num % 2n);
    bits.push(tmp);
    num = (num - (num % 2n)) / 2n;
  }
  while (bits.length < length) {
    bits.push(false);
  }
  return bits;
}

// Generates a secret key between 0 ~ min(2**numBits-1, Fr size).
export function keyGenAddr(babyjub: BabyJub, numBits: bigint, addr: string): { g: EC; sk: bigint; pk: EC } {
  const sk = BigInt(addr.substring(0, 10));
  return {
    g: babyjub.Base8,
    sk,
    pk: babyjub.mulPointEscalar(babyjub.Base8, sk),
  };
}

// Generates a secret key between 0 ~ min(2**numBits-1, Fr size).
export function keyGen(babyjub: BabyJub, numBits: bigint): { g: EC; sk: bigint; pk: EC } {
  const sk = sampleFieldElements(babyjub, numBits, 1)[0];
  return {
    g: babyjub.Base8,
    sk,
    pk: babyjub.mulPointEscalar(babyjub.Base8, sk),
  };
}

/// Aggregates public keys into a single public key.
/// aggregateKey = \sum_{i=0}^n pks[i]
export function keyAggregate(babyJub: BabyJub, pks: EC[]): EC {
  let aggregateKey = [babyJub.F.e("0"), babyJub.F.e("1")];
  for (let i = 0; i < pks.length; i++) {
    aggregateKey = babyJub.addPoint(aggregateKey, pks[i]);
  }
  return aggregateKey;
}

/// Samples a nxn permutation matrix.
export function samplePermutation(n: number): bigint[] {
  const array = [...Array(n).keys()];
  let currentIndex = array.length - 1;
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    currentIndex--;
  }
  const matrix = Array(n * n).fill(0);
  for (let i = 0; i < n; i++) {
    matrix[i * n + array[i]] = 1;
  }
  const matrixBigint: bigint[] = [];
  for (let i = 0; i < n * n; i++) {
    matrixBigint[i] = BigInt(matrix[i]);
  }
  return matrixBigint;
}

/// Converts the type of pks to be string.
export function convertPk(babyjub: BabyJub, pks: EC[]): bigint[][] {
  const arr: bigint[][] = [];
  for (let i = 0; i < pks.length; i++) {
    const pk: string[] = [];
    pk.push(babyjub.F.toString(pks[i][0]));
    pk.push(babyjub.F.toString(pks[i][1]));
    arr.push(string2Bigint(pk));
  }
  return arr;
}

/// Computes B = A \times X.
export function matrixMultiplication(
  A: bigint[],
  X: bigint[],
  numRows: number,
  numCols: number,
): bigint[] {
  assert(A.length === numRows * numCols, "Shape of A should be numRows x numCols");
  assert(X.length === numCols, "Length of X should be numCols");
  const B: bigint[] = [];
  for (let i = 0; i < numRows; i++) {
    let tmp = 0n;
    for (let j = 0; j < numCols; j++) {
      tmp += A[i * numCols + j] * X[j];
    }
    B.push(tmp);
  }
  return B;
}

/// Compresses an array of elliptic curve points into compressed format.
/// For each ec point (xi,yi), we have compressed format (xi, si) where si is a 1-bit selector.
/// In particular, we can find a delta_i \in {0,1,...,(q-1)/2} given xi and recover
/// yi = s_i * delta_i + (1-s_i) * (q-delta_i).
/// This function compresses an array of ec from format
///     [x1, x2, ..., xn, y1, y2, ..., yn]
/// to the compressed format
///     [x1, x2, ..., xn, s]
/// s can be bit decomposed into s1, s2, ..., sn.
/// Assumption: the length of input `ecArr` is less than 254; ec is on Baby Jubjub curve.
export function ecCompress(ecArr: bigint[]): {
  xArr: bigint[];
  deltaArr: bigint[];
  selector: bigint;
} {
  assert(ecArr.length < 254 * 2, "Length of ecArr should be less than 254*2.");
  const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
  const q_minus1_over2 =
    10944121435919637611123202872628637544274182200208017171849102093287904247808n;
  const deltaArr: bigint[] = [];
  const selectorArr: boolean[] = [];
  for (let i = ecArr.length / 2; i < ecArr.length; i++) {
    if (ecArr[i] <= q_minus1_over2) {
      selectorArr.push(true);
      deltaArr.push(ecArr[i]);
    } else {
      selectorArr.push(false);
      deltaArr.push(q - ecArr[i]);
    }
  }
  const selector: bigint = bits2Num(selectorArr);
  const xArr: bigint[] = [];
  for (let i = 0; i < ecArr.length / 2; i++) {
    xArr.push(ecArr[i]);
  }
  return { xArr, deltaArr, selector };
}

/// Decompresses into an array of elliptic curve points from the compressed format `xArr`, `deltaArr`, and `selector`.
export function ecDecompress(xArr: bigint[], deltaArr: bigint[], selector: bigint): bigint[] {
  assert(xArr.length < 254, "Length of xArr should be less than 254");
  assert(xArr.length === deltaArr.length, "Length of xArr should equal to the length of deltaArr");
  const selectorArr: boolean[] = num2Bits(selector, deltaArr.length);
  assert(
    selectorArr.length === deltaArr.length,
    "Length mismatch. selectorArr.length: " +
    String(selectorArr.length) +
    ", deltaArr.length: " +
    String(deltaArr.length),
  );
  const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
  const ecArr: bigint[] = [];
  for (let i = 0; i < xArr.length; i++) {
    ecArr.push(xArr[i]);
  }
  for (let i = 0; i < selectorArr.length; i++) {
    const flag = BigInt(selectorArr[i]);
    ecArr.push(flag * deltaArr[i] + (1n - flag) * (q - deltaArr[i]));
  }
  return ecArr;
}

/// Prints an array to match circom input format.
export function printArray(arr: bigint[]) {
  let str = "[";
  for (let i = 0; i < arr.length; i++) {
    // eslint-disable-next-line quotes
    str += '"' + String(arr[i]);
    if (i < arr.length - 1) {
      // eslint-disable-next-line quotes
      str += '", ';
    }
  }
  str += "],";
  return str;
}

/// Given x coordinate of a point on baby jubjub curve, returns a delta such that
///     (a * x^2 + delta^2 = 1 + d * x^2 * delta^2) % q
///     0 <= delta <= (q-1)/2
export function ecX2Delta(babyjub: BabyJub, x: bigint): bigint {
  const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
  const q_minus1_over2 =
    10944121435919637611123202872628637544274182200208017171849102093287904247808n;
  const xFq = babyjub.F.e(x);
  const a = babyjub.F.e(168700);
  const d = babyjub.F.e(168696);
  const one = babyjub.F.e(1);
  const xSquare = babyjub.F.square(xFq);
  let delta = babyjub.F.sqrt(
    babyjub.F.div(
      babyjub.F.sub(babyjub.F.mul(a, xSquare), one),
      babyjub.F.sub(babyjub.F.mul(d, xSquare), one),
    ),
  );
  delta = Scalar.fromRprLE(babyjub.F.fromMontgomery(delta));
  if (delta > q_minus1_over2) {
    delta = q - delta;
  }
  return delta;
}

/// Receovers an array of delta from an array of x-coordinate of points on babyjubjub curve.
export function recoverDeck(
  babyjub: BabyJub,
  X0: bigint[],
  X1: bigint[],
): { Delta0: bigint[]; Delta1: bigint[] } {
  const Delta0: bigint[] = [];
  const Delta1: bigint[] = [];
  for (let i = 0; i < X0.length; i++) {
    Delta0.push(ecX2Delta(babyjub, X0[i]));
    Delta1.push(ecX2Delta(babyjub, X1[i]));
  }
  return { Delta0, Delta1 };
}

/// Converts an array of string to an array of bigint.
export function string2Bigint(arr: string[]): bigint[] {
  const output: bigint[] = [];
  for (let i = 0; i < arr.length; i++) {
    output.push(BigInt(arr[i]));
  }
  return output;
}

/// `x0`, `x1`, `selector0`, and `selector1` => x0, y0, x1, y1
export function prepareDecryptData(
  babyjub: BabyJub,
  x0: bigint,
  x1: bigint,
  selector0: bigint,
  selector1: bigint,
  numCards: number,
  cardIdx: number,
): bigint[] {
  const Y: bigint[] = [];
  const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
  const delta0 = ecX2Delta(babyjub, x0);
  const delta1 = ecX2Delta(babyjub, x1);
  const flag0 = BigInt(num2Bits(selector0, numCards)[cardIdx]);
  const flag1 = BigInt(num2Bits(selector1, numCards)[cardIdx]);
  // Y layout: [c0.x, c0.y, c1.x, c1.y]
  Y.push(x0);
  Y.push(flag0 * delta0 + (1n - flag0) * (q - delta0));
  Y.push(x1);
  Y.push(flag1 * delta1 + (1n - flag1) * (q - delta1));
  return Y;
}

// Prepares deck queried from contract to the deck for generating ZK proof.
export function prepareShuffleDeck(
  babyjub: BabyJub,
  deck: Deck,
  numCards: number,
): { X0: bigint[]; X1: bigint[]; Selector: bigint[]; Delta: bigint[][] } {
  const deckX0: bigint[] = [];
  const deckX1: bigint[] = [];
  for (let i = 0; i < numCards; i++) {
    deckX0.push(deck.X0[i].toBigInt());
  }
  for (let i = 0; i < numCards; i++) {
    deckX1.push(deck.X1[i].toBigInt());
  }
  const deckDelta = recoverDeck(babyjub, deckX0, deckX1);
  return {
    X0: deckX0,
    X1: deckX1,
    Selector: [deck.selector0._data.toBigInt(), deck.selector1._data.toBigInt()],
    Delta: [deckDelta.Delta0, deckDelta.Delta1],
  };
}
