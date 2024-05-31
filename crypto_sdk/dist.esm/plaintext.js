import { matrixMultiplication } from "./utilities";
import { compressDeck, decompressDeck } from "./deck";
export function elgamalEncrypt(babyJub, ic0, ic1, r, pk) {
    return [
        babyJub.addPoint(babyJub.mulPointEscalar(babyJub.Base8, r), ic0),
        babyJub.addPoint(babyJub.mulPointEscalar(pk, r), ic1),
    ];
}
export function elgamalDecrypt(babyJub, c0, c1, sk) {
    const r = 2736030358979909402780800718157159386076813972158567259200215660948447373041n;
    return babyJub.addPoint(c1, babyJub.mulPointEscalar(c0, r - sk));
}
export function shuffleEncryptPlaintext(babyjub, numCards, A, X, R, pk) {
    const B = [];
    for (let i = 0; i < 4; i++) {
        const tmp = matrixMultiplication(A, X.slice(i * numCards, (i + 1) * numCards), numCards, numCards);
        for (let j = 0; j < numCards; j++) {
            B.push(tmp[j]);
        }
    }
    const ECOutArr = [];
    for (let i = 0; i < numCards; i++) {
        const ic0 = [babyjub.F.e(B[i]), babyjub.F.e(B[numCards + i])];
        const ic1 = [babyjub.F.e(B[2 * numCards + i]), babyjub.F.e(B[3 * numCards + i])];
        const out = elgamalEncrypt(babyjub, ic0, ic1, R[i], pk);
        ECOutArr.push(out);
    }
    const Y = [];
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            for (let k = 0; k < ECOutArr.length; k++) {
                Y[(i * 2 + j) * numCards + k] = BigInt(babyjub.F.toString(ECOutArr[k][i][j]));
            }
        }
    }
    return Y;
}
export function shuffleEncryptV2Plaintext(babyjub, numCards, A, R, pk, UX0, UX1, UY0_delta, UY1_delta, s_u) {
    const U = decompressDeck(UX0, UX1, UY0_delta, UY1_delta, s_u);
    return compressDeck(shuffleEncryptPlaintext(babyjub, numCards, A, U, R, pk));
}
//# sourceMappingURL=plaintext.js.map