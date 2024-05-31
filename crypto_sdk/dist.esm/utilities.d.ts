export type BabyJub = any;
export type EC = any;
export type Deck = any;
export declare function assert(condition: boolean, message: string): void;
export declare function sampleFieldElements(babyjub: BabyJub, numBits: bigint, numElements: number): bigint[];
export declare function bits2Num(arr: boolean[]): bigint;
export declare function num2Bits(num: bigint, length: number): boolean[];
export declare function keyGenAddr(babyjub: BabyJub, numBits: bigint, addr: string): {
    g: EC;
    sk: bigint;
    pk: EC;
};
export declare function keyGen(babyjub: BabyJub, numBits: bigint): {
    g: EC;
    sk: bigint;
    pk: EC;
};
export declare function keyAggregate(babyJub: BabyJub, pks: EC[]): EC;
export declare function samplePermutation(n: number): bigint[];
export declare function convertPk(babyjub: BabyJub, pks: EC[]): bigint[][];
export declare function matrixMultiplication(A: bigint[], X: bigint[], numRows: number, numCols: number): bigint[];
export declare function ecCompress(ecArr: bigint[]): {
    xArr: bigint[];
    deltaArr: bigint[];
    selector: bigint;
};
export declare function ecDecompress(xArr: bigint[], deltaArr: bigint[], selector: bigint): bigint[];
export declare function printArray(arr: bigint[]): string;
export declare function ecX2Delta(babyjub: BabyJub, x: bigint): bigint;
export declare function recoverDeck(babyjub: BabyJub, X0: bigint[], X1: bigint[]): {
    Delta0: bigint[];
    Delta1: bigint[];
};
export declare function string2Bigint(arr: string[]): bigint[];
export declare function prepareDecryptData(babyjub: BabyJub, x0: bigint, x1: bigint, selector0: bigint, selector1: bigint, numCards: number, cardIdx: number): bigint[];
export declare function prepareShuffleDeck(babyjub: BabyJub, deck: Deck, numCards: number): {
    X0: bigint[];
    X1: bigint[];
    Selector: bigint[];
    Delta: bigint[][];
};
