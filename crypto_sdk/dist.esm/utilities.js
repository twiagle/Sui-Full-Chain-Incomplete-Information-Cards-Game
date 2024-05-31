import { Scalar } from "ffjavascript";
export function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion Failed");
    }
}
export function sampleFieldElements(babyjub, numBits, numElements) {
    const arr = [];
    let num;
    const threshold = Scalar.exp(2, numBits);
    for (let i = 0; i < numElements; i++) {
        do {
            num = Scalar.fromRprLE(babyjub.F.random());
        } while (Scalar.geq(num, threshold));
        arr.push(num);
    }
    return arr;
}
export function bits2Num(arr) {
    let res = 0n;
    let power = 1n;
    for (let i = 0; i < arr.length; i++) {
        res += BigInt(arr[i]) * power;
        power *= 2n;
    }
    return res;
}
export function num2Bits(num, length) {
    const bits = [];
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
export function keyGenAddr(babyjub, numBits, addr) {
    const sk = BigInt(addr.substring(0, 10));
    return {
        g: babyjub.Base8,
        sk,
        pk: babyjub.mulPointEscalar(babyjub.Base8, sk),
    };
}
export function keyGen(babyjub, numBits) {
    const sk = sampleFieldElements(babyjub, numBits, 1)[0];
    return {
        g: babyjub.Base8,
        sk,
        pk: babyjub.mulPointEscalar(babyjub.Base8, sk),
    };
}
export function keyAggregate(babyJub, pks) {
    let aggregateKey = [babyJub.F.e("0"), babyJub.F.e("1")];
    for (let i = 0; i < pks.length; i++) {
        aggregateKey = babyJub.addPoint(aggregateKey, pks[i]);
    }
    return aggregateKey;
}
export function samplePermutation(n) {
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
    const matrixBigint = [];
    for (let i = 0; i < n * n; i++) {
        matrixBigint[i] = BigInt(matrix[i]);
    }
    return matrixBigint;
}
export function convertPk(babyjub, pks) {
    const arr = [];
    for (let i = 0; i < pks.length; i++) {
        const pk = [];
        pk.push(babyjub.F.toString(pks[i][0]));
        pk.push(babyjub.F.toString(pks[i][1]));
        arr.push(string2Bigint(pk));
    }
    return arr;
}
export function matrixMultiplication(A, X, numRows, numCols) {
    assert(A.length === numRows * numCols, "Shape of A should be numRows x numCols");
    assert(X.length === numCols, "Length of X should be numCols");
    const B = [];
    for (let i = 0; i < numRows; i++) {
        let tmp = 0n;
        for (let j = 0; j < numCols; j++) {
            tmp += A[i * numCols + j] * X[j];
        }
        B.push(tmp);
    }
    return B;
}
export function ecCompress(ecArr) {
    assert(ecArr.length < 254 * 2, "Length of ecArr should be less than 254*2.");
    const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
    const q_minus1_over2 = 10944121435919637611123202872628637544274182200208017171849102093287904247808n;
    const deltaArr = [];
    const selectorArr = [];
    for (let i = ecArr.length / 2; i < ecArr.length; i++) {
        if (ecArr[i] <= q_minus1_over2) {
            selectorArr.push(true);
            deltaArr.push(ecArr[i]);
        }
        else {
            selectorArr.push(false);
            deltaArr.push(q - ecArr[i]);
        }
    }
    const selector = bits2Num(selectorArr);
    const xArr = [];
    for (let i = 0; i < ecArr.length / 2; i++) {
        xArr.push(ecArr[i]);
    }
    return { xArr, deltaArr, selector };
}
export function ecDecompress(xArr, deltaArr, selector) {
    assert(xArr.length < 254, "Length of xArr should be less than 254");
    assert(xArr.length === deltaArr.length, "Length of xArr should equal to the length of deltaArr");
    const selectorArr = num2Bits(selector, deltaArr.length);
    assert(selectorArr.length === deltaArr.length, "Length mismatch. selectorArr.length: " +
        String(selectorArr.length) +
        ", deltaArr.length: " +
        String(deltaArr.length));
    const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
    const ecArr = [];
    for (let i = 0; i < xArr.length; i++) {
        ecArr.push(xArr[i]);
    }
    for (let i = 0; i < selectorArr.length; i++) {
        const flag = BigInt(selectorArr[i]);
        ecArr.push(flag * deltaArr[i] + (1n - flag) * (q - deltaArr[i]));
    }
    return ecArr;
}
export function printArray(arr) {
    let str = "[";
    for (let i = 0; i < arr.length; i++) {
        str += '"' + String(arr[i]);
        if (i < arr.length - 1) {
            str += '", ';
        }
    }
    str += "],";
    return str;
}
export function ecX2Delta(babyjub, x) {
    const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
    const q_minus1_over2 = 10944121435919637611123202872628637544274182200208017171849102093287904247808n;
    const xFq = babyjub.F.e(x);
    const a = babyjub.F.e(168700);
    const d = babyjub.F.e(168696);
    const one = babyjub.F.e(1);
    const xSquare = babyjub.F.square(xFq);
    let delta = babyjub.F.sqrt(babyjub.F.div(babyjub.F.sub(babyjub.F.mul(a, xSquare), one), babyjub.F.sub(babyjub.F.mul(d, xSquare), one)));
    delta = Scalar.fromRprLE(babyjub.F.fromMontgomery(delta));
    if (delta > q_minus1_over2) {
        delta = q - delta;
    }
    return delta;
}
export function recoverDeck(babyjub, X0, X1) {
    const Delta0 = [];
    const Delta1 = [];
    for (let i = 0; i < X0.length; i++) {
        Delta0.push(ecX2Delta(babyjub, X0[i]));
        Delta1.push(ecX2Delta(babyjub, X1[i]));
    }
    return { Delta0, Delta1 };
}
export function string2Bigint(arr) {
    const output = [];
    for (let i = 0; i < arr.length; i++) {
        output.push(BigInt(arr[i]));
    }
    return output;
}
export function prepareDecryptData(babyjub, x0, x1, selector0, selector1, numCards, cardIdx) {
    const Y = [];
    const q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
    const delta0 = ecX2Delta(babyjub, x0);
    const delta1 = ecX2Delta(babyjub, x1);
    const flag0 = BigInt(num2Bits(selector0, numCards)[cardIdx]);
    const flag1 = BigInt(num2Bits(selector1, numCards)[cardIdx]);
    Y.push(x0);
    Y.push(flag0 * delta0 + (1n - flag0) * (q - delta0));
    Y.push(x1);
    Y.push(flag1 * delta1 + (1n - flag1) * (q - delta1));
    return Y;
}
export function prepareShuffleDeck(babyjub, deck, numCards) {
    const deckX0 = [];
    const deckX1 = [];
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
//# sourceMappingURL=utilities.js.map