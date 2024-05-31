import { BabyJub } from "./utilities";
import { OnChainDeck } from "./deck";
export declare type FullProof = {
    proof: any;
    publicSignals: string[];
};
export declare type FullProofArkworks = {
    vk_bytes: Uint8Array;
    public_inputs_bytes: Uint8Array;
    proof_points_bytes: Uint8Array;
};
export interface ElgamalECCPoint {
    x0: bigint;
    y0: bigint;
    x1: bigint;
    y1: bigint;
}
export declare function generateDecryptProof(Y: bigint[], skP: bigint, pkP: bigint[], wasmFile: string, zkeyFile: string): Promise<FullProof>;
export declare function generateShuffleEncryptV2Proof(pk: bigint[], A: bigint[], R: bigint[], UX0: bigint[], UX1: bigint[], UDelta0: bigint[], UDelta1: bigint[], s_u: bigint[], VX0: bigint[], VX1: bigint[], VDelta0: bigint[], VDelta1: bigint[], s_v: bigint[], wasmFile: string, zkeyFile: string): Promise<FullProof>;
export declare function decryptMultiCompressedCard(babyjub: BabyJub, numCards: number, deck: OnChainDeck, cards: number[], sk: bigint, pk: bigint[], decryptWasmFile: string, decryptZkeyFile: string): Promise<ElgamalECCPoint[]>;
export declare function decryptMultiUnCompressedCard(babyjub: BabyJub, deck: OnChainDeck, cards: number[], sk: bigint, pk: bigint[], decryptWasmFile: string, decryptZkeyFile: string): Promise<ElgamalECCPoint[]>;
