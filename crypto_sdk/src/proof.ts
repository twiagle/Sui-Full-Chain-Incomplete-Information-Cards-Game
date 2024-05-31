const snarkjs = require("snarkjs");
import snarkjs from "snarkjs";
import { BabyJub, prepareDecryptData } from "./utilities";
import { OnChainDeck } from "./deck";
import { elgamalDecrypt } from "./plaintext";

export declare type FullProof = {
  proof: any;
  publicSignals: string[];
};

export declare type FullProofArkworks = {
  vk_bytes: Uint8Array;
  public_inputs_bytes: Uint8Array,
  proof_points_bytes: Uint8Array,
};

export interface ElgamalECCPoint {
  x0: bigint,
  y0: bigint,
  x1: bigint;
  y1: bigint;
}

// decrypt and generates proof for decryption circuit.
export async function generateDecryptProof(
  Y: bigint[],
  skP: bigint,
  pkP: bigint[],
  wasmFile: string,
  zkeyFile: string,
): Promise<FullProof> {
  // eslint-disable-next-line keyword-spacing
  return <FullProof>await snarkjs.groth16.fullProve({ Y, skP, pkP }, wasmFile, zkeyFile);
}

// Generates proof for shuffle encrypt v2 circuit.
export async function generateShuffleEncryptV2Proof(
  pk: bigint[],
  A: bigint[],
  R: bigint[],
  UX0: bigint[],
  UX1: bigint[],
  UDelta0: bigint[],
  UDelta1: bigint[],
  s_u: bigint[],
  VX0: bigint[],
  VX1: bigint[],
  VDelta0: bigint[],
  VDelta1: bigint[],
  s_v: bigint[],
  wasmFile: string,
  zkeyFile: string,
): Promise<FullProof> {
  // eslint-disable-next-line keyword-spacing
  return <FullProof>await snarkjs.groth16.fullProve(
    {
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
    },
    wasmFile,
    zkeyFile,
  );
}

export async function decryptMultiCompressedCard(
  babyjub: BabyJub,
  numCards: number,
  deck: OnChainDeck,
  cards: number[],
  sk: bigint,
  pk: bigint[],
  decryptWasmFile: string,
  decryptZkeyFile: string,
) {
  const elgamalEccPoints: ElgamalECCPoint[] = [];
  // const initDeltas: bigint[][] = [];
  for (let i = 0; i < cards.length; i++) {
    const Y = prepareDecryptData(
      babyjub,
      deck.X0[cards[i]],
      deck.X1[cards[i]],
      deck.selector[0],
      deck.selector[1],
      Number(numCards),
      cards[i],
    );
    let c0 = [babyjub.F.e(Y[0]), babyjub.F.e(Y[1])];
    let c1 = [babyjub.F.e(Y[2]), babyjub.F.e(Y[3])];
    let decryption = elgamalDecrypt(babyjub, c0, c1, sk);
    elgamalEccPoints[i] = {
      x0: Y[0],
      y0: Y[1],
      x1: BigInt(babyjub.F.toString(decryption[0])),
      y1: BigInt(babyjub.F.toString(decryption[1])),
    };
    // const decryptProof = await generateDecryptProof(Y, sk, pk, decryptWasmFile, decryptZkeyFile);
    // elgamalEccPoint[i] = {
    //   x0: Y[0],
    //   y0: Y[1],
    //   x1: BigInt(decryptProof.publicSignals[0]),
    //   y1: BigInt(decryptProof.publicSignals[1]),
    // };
    // initDeltas[i] = [ecX2Delta(babyjub, Y[0]), ecX2Delta(babyjub, Y[2])]; ??? why not Y, we have zkp
  }
  return elgamalEccPoints
}

export async function decryptMultiUnCompressedCard(
  babyjub: BabyJub,
  deck: OnChainDeck,
  cards: number[],
  sk: bigint,
  pk: bigint[],
  decryptWasmFile: string,
  decryptZkeyFile: string,
) {
  const elgamalEccPoints: ElgamalECCPoint[] = [];
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
    // const decryptProof = await generateDecryptProof(Y, sk, pk, decryptWasmFile, decryptZkeyFile);
    // elgamalEccPoints[i] = {
    //   x0: Y[0],
    //   y0: Y[1],
    //   x1: BigInt(decryptProof.publicSignals[0]),
    //   y1: BigInt(decryptProof.publicSignals[1]),
    // };
  }
  return elgamalEccPoints
}
