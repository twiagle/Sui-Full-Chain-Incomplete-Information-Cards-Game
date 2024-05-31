import { OnChainDeck, CompressedDeck } from "./deck";
import { ElgamalECCPoint } from "./proof";
export declare class PokerCard {
    idx: number;
    suit: string;
    value: number;
    constructor(idx: number, suit: string, value: number);
}
export interface IZKShuffle {
    shuffleEncryptCards: (deck: CompressedDeck) => Promise<CompressedDeck>;
    dealCards: (deck: OnChainDeck, cardBitIds: number, isFirstDecryption: boolean) => Promise<OnChainDeck>;
    openOffchain: (deck: OnChainDeck, cardBitIds: number, pk: any, sk: any) => Promise<PokerCard[]>;
}
export declare class ZKShuffle implements IZKShuffle {
    babyjub: any;
    initial_deck: bigint[];
    deck_map: {
        [key: string]: PokerCard;
    };
    decrypt_wasm: string;
    decrypt_zkey: string;
    encrypt_wasm: string;
    encrypt_zkey: string;
    deck_per_x: bigint[];
    aggregated_key: any;
    aggregated_pkString: any;
    pk: any;
    sk: any;
    constructor();
    init(): Promise<void>;
    shuffleEncryptCards(deck: CompressedDeck): Promise<CompressedDeck>;
    dealCards(deck: OnChainDeck, cardBitIds: number, isFirstDecryption: boolean): Promise<OnChainDeck>;
    _dealCards(deck: OnChainDeck, cardBitIds: number, isFirstDecryption: boolean, sk: any, pk: any): Promise<OnChainDeck>;
    dealCompressdDeck(deck: OnChainDeck, cards: number[], sk: bigint, pk: bigint[]): Promise<ElgamalECCPoint[]>;
    dealUnCompressdDeck(deck: OnChainDeck, cards: number[], sk: bigint, pk: bigint[]): Promise<ElgamalECCPoint[]>;
    openOffchain(deck: OnChainDeck, cardBitIds: number): Promise<PokerCard[]>;
    _openOffchain(deck: OnChainDeck, cardBitIds: number, sk: any, pk: any): Promise<PokerCard[]>;
    private getCardIdsFromUint8;
    private queryCardsPerX;
    newAccount(addr: any): Promise<any[]>;
    setAggregated_key(pk_x0: any, pk_y0: any, pk_x1: any, pk_y1: any, pk_x2: any, pk_y2: any): Promise<void>;
    main: () => Promise<void>;
}
