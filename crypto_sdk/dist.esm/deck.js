import { Scalar } from "ffjavascript";
import { ecCompress, ecDecompress } from './utilities';
export function initDeck(babyjub, numCards) {
    const cards = [];
    for (let i = 1; i <= numCards; i++) {
        cards.push(babyjub.mulPointEscalar(babyjub.Base8, i));
    }
    const deck = [];
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
export function searchDeck(deck, cardX1, numCards) {
    for (let i = 0; i < numCards; i++) {
        if (deck[2 * numCards + i] === cardX1) {
            return i;
        }
    }
    return -1;
}
export function compressDeck(deck) {
    const deck0 = deck.slice(0, deck.length / 2);
    const deck1 = deck.slice(deck.length / 2, deck.length);
    const compressedDeck0 = ecCompress(deck0);
    const compressedDeck1 = ecCompress(deck1);
    const s = [];
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
export function decompressDeck(X0, X1, Y0_delta, Y1_delta, s) {
    const decompressedDeck0 = ecDecompress(X0, Y0_delta, s[0]);
    const decompressedDeck1 = ecDecompress(X1, Y1_delta, s[1]);
    const deck = [];
    for (let i = 0; i < decompressedDeck0.length; i++) {
        deck.push(decompressedDeck0[i]);
    }
    for (let i = 0; i < decompressedDeck1.length; i++) {
        deck.push(decompressedDeck1[i]);
    }
    return deck;
}
//# sourceMappingURL=deck.js.map