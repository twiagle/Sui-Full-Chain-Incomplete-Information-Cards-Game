const snarkjs = require("snarkjs");
import { prepareDecryptData } from "./utilities";
import { elgamalDecrypt } from "./plaintext";
export async function generateDecryptProof(Y, skP, pkP, wasmFile, zkeyFile) {
    return await snarkjs.groth16.fullProve({ Y, skP, pkP }, wasmFile, zkeyFile);
}
export async function generateShuffleEncryptV2Proof(pk, A, R, UX0, UX1, UDelta0, UDelta1, s_u, VX0, VX1, VDelta0, VDelta1, s_v, wasmFile, zkeyFile) {
    return await snarkjs.groth16.fullProve({
        pk,
        A,
        R,
        UX0,
        UX1,
        UDelta0,
        UDelta1,
        VX0,
        VX1,
        VDelta0,
        VDelta1,
        s_u,
        s_v,
    }, wasmFile, zkeyFile);
}
export async function decryptMultiCompressedCard(babyjub, numCards, deck, cards, sk, pk, decryptWasmFile, decryptZkeyFile) {
    const elgamalEccPoints = [];
    for (let i = 0; i < cards.length; i++) {
        const Y = prepareDecryptData(babyjub, deck.X0[cards[i]], deck.X1[cards[i]], deck.selector[0], deck.selector[1], Number(numCards), cards[i]);
        let c0 = [babyjub.F.e(Y[0]), babyjub.F.e(Y[1])];
        let c1 = [babyjub.F.e(Y[2]), babyjub.F.e(Y[3])];
        let decryption = elgamalDecrypt(babyjub, c0, c1, sk);
        elgamalEccPoints[i] = {
            x0: Y[0],
            y0: Y[1],
            x1: BigInt(babyjub.F.toString(decryption[0])),
            y1: BigInt(babyjub.F.toString(decryption[1])),
        };
    }
    return elgamalEccPoints;
}
export async function decryptMultiUnCompressedCard(babyjub, deck, cards, sk, pk, decryptWasmFile, decryptZkeyFile) {
    const elgamalEccPoints = [];
    for (let i = 0; i < cards.length; i++) {
        const Y = [
            deck.X0[cards[i]],
            deck.Y0[cards[i]],
            deck.X1[cards[i]],
            deck.Y1[cards[i]],
        ];
        let c0 = [babyjub.F.e(Y[0]), babyjub.F.e(Y[1])];
        let c1 = [babyjub.F.e(Y[2]), babyjub.F.e(Y[3])];
        let decryption = elgamalDecrypt(babyjub, c0, c1, sk);
        elgamalEccPoints[i] = {
            x0: Y[0],
            y0: Y[1],
            x1: BigInt(babyjub.F.toString(decryption[0])),
            y1: BigInt(babyjub.F.toString(decryption[1])),
        };
    }
    return elgamalEccPoints;
}
//# sourceMappingURL=proof.js.map