import { BabyJub } from 'circomlibjs';
export interface CompressedDeck {
    X0: bigint[];
    X1: bigint[];
    selector: bigint[];
}
export interface OnChainDeck extends CompressedDeck {
    Y0: bigint[];
    Y1: bigint[];
}
export declare function initDeck(babyjub: BabyJub, numCards: number): bigint[];
export declare function searchDeck(deck: bigint[], cardX1: bigint, numCards: number): number;
export declare function compressDeck(deck: bigint[]): {
    X0: bigint[];
    X1: bigint[];
    delta0: bigint[];
    delta1: bigint[];
    selector: bigint[];
};
export declare function decompressDeck(X0: bigint[], X1: bigint[], Y0_delta: bigint[], Y1_delta: bigint[], s: bigint[]): bigint[];
