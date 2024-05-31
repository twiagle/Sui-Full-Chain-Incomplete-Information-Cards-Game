// const Scalar = require("ffjavascript").Scalar;
import { Scalar } from "ffjavascript";
import { BabyJub, Point } from 'circomlibjs';
import { ecCompress, ecDecompress } from './utilities';

export interface CompressedDeck {
  // x0 of cards
  X0: bigint[];
  // x1 of cards
  X1: bigint[];
  // y0 of cards
  // Y0: bigint[];
  // y1 of cards
  // Y1: bigint[];
  // 2 selectors for recovering y coordinates
  selector: bigint[];
  // selector0: bigint;
  // selector1: bigint;
}
export interface OnChainDeck extends CompressedDeck {
  // y0 of cards
  Y0: bigint[];
  // y1 of cards
  Y1: bigint[];
}


/// Initializes a deck of `numCards` cards. Each card is represented as 2 elliptic curve
/// points (c0i.x, c0i.y, c1i.x, c1i.y)
/// Layout: [
///     c01.x, ..., c0n.x,
///     c01.y, ..., c0n.y,
///     c11.x, ..., c1n.x,
///     c11.y, ..., c1n.y,
/// ]
export function initDeck(babyjub: BabyJub, numCards: number): bigint[] {
  const cards: Point[] = [];
  for (let i = 1; i <= numCards; i++) {
    cards.push(babyjub.mulPointEscalar(babyjub.Base8, i));
  }
  const deck: bigint[] = [];
  for (let i = 0; i < numCards; i++) {
    deck.push(0n);
  }
  for (let i = 0; i < numCards; i++) {
    deck.push(1n);
  }
  for (let i = 0; i < numCards; i++) {
    deck.push(Scalar.fromRprLE(babyjub.F.fromMontgomery(cards[i][0])));
  }
  for (let i = 0; i < numCards; i++) {
    deck.push(Scalar.fromRprLE(babyjub.F.fromMontgomery(cards[i][1])));
  }
  return deck;
}

/// Searches the deck for a card. If the card is in the deck, returns the card index.
/// If the card is not in the deck, return -1.
export function searchDeck(deck: bigint[], cardX1: bigint, numCards: number): number {
  for (let i = 0; i < numCards; i++) {
    if (deck[2 * numCards + i] === cardX1) {
      return i;
    }
  }
  return -1;
}


/// Compresses a deck of cards with the following layout:
///     [
///         x00, x01, ..., x0{n-1},
///         y00, y01, ..., y0{n-1},
///         x10, x11, ..., x1{n-1},
///         y10, y11, ..., y1{n-1},
///     ]
export function compressDeck(deck: bigint[]): {
  X0: bigint[];
  X1: bigint[];
  delta0: bigint[];
  delta1: bigint[];
  selector: bigint[];
} {
  const deck0 = deck.slice(0, deck.length / 2);
  const deck1 = deck.slice(deck.length / 2, deck.length);
  const compressedDeck0 = ecCompress(deck0);
  const compressedDeck1 = ecCompress(deck1);
  const s: bigint[] = [];
  s.push(compressedDeck0.selector);
  s.push(compressedDeck1.selector);
  return {
    X0: compressedDeck0.xArr,
    X1: compressedDeck1.xArr,
    delta0: compressedDeck0.deltaArr,
    delta1: compressedDeck1.deltaArr,
    selector: s,
  };
}

/// Decompresses a deck of cards.
export function decompressDeck(
  X0: bigint[],
  X1: bigint[],
  Y0_delta: bigint[],
  Y1_delta: bigint[],
  s: bigint[],
): bigint[] {
  const decompressedDeck0 = ecDecompress(X0, Y0_delta, s[0]);
  const decompressedDeck1 = ecDecompress(X1, Y1_delta, s[1]);
  const deck: bigint[] = [];
  for (let i = 0; i < decompressedDeck0.length; i++) {
    deck.push(decompressedDeck0[i]);
  }
  for (let i = 0; i < decompressedDeck1.length; i++) {
    deck.push(decompressedDeck1[i]);
  }
  return deck;
}
