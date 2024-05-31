import { WebSocket } from "ws";
import { elgamalEncrypt, elgamalDecrypt, shuffleEncryptV2Plaintext } from "../src/plaintext";
import { keyGen, bits2Num, ecCompress, ecDecompress, ecX2Delta, num2Bits, recoverDeck, sampleFieldElements, samplePermutation, prepareDecryptData, keyAggregate, keyGenAddr } from "../src/utilities";
import { BabyJub } from 'circomlibjs';
import { compressDeck, initDeck, decompressDeck, CompressedDeck, OnChainDeck } from "../src/deck";
import { ElgamalECCPoint, decryptMultiCompressedCard, decryptMultiUnCompressedCard, generateDecryptProof, generateShuffleEncryptV2Proof } from "../src/proof";
const Scalar = require("ffjavascript").Scalar;
const buildBabyjub = require('circomlibjs-0-1-7').buildBabyjub;
import { ExitStatus } from "typescript";
import { buildBabyjub } from 'circomlibjs-0-1-7';
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import axios from 'axios';
import { bcs } from "@mysten/sui.js/bcs";

const numCards = 1;
const numBits = BigInt(251);

function base64_to_u8Array(base64String: string): Uint8Array {
  const binaryString = atob(base64String);
  // 将二进制字符串转换为字节数组
  const byteArray = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    byteArray[i] = binaryString.charCodeAt(i);
  }
  // console.log("input", base64String);
  // const bString = Array.from(byteArray, byte => String.fromCharCode(byte)).join('');
  // console.log("out", btoa(bString)); // 输出 base64 编码的字符串
  return byteArray;
}

const get_proof = async (vals): Promise<any> => {
  const data = {
    api: 'shuffle_encrypt',
    names: ["pk", "UX0", "UX1", "VX0", "VX1", "UDelta0", "UDelta1", "VDelta0", "VDelta1", "s_u", "s_v", "A", "R"],
    vals: [vals.pk, vals.UX0, vals.UX1, vals.VX0, vals.VX1, vals.UDelta0, vals.UDelta1, vals.VDelta0, vals.VDelta1, vals.s_u, vals.s_v, vals.A, vals.R],
  };

  let proof: any;
  await axios.post('http://127.0.0.1:3000/zkp', data)
    .then(response => {
      console.log(response.data);
      proof = response.data;
    })
    .catch(error => {
      console.error(error);
    });
  // console.log(typeof proof["vk_bytes"]); // 输出: "number"
  // proof =
  // { "vk_bytes": "BgQl0ap+ouLzN3OCpVEyXavYHnbe4Qae5SGBaUBvLiMR4P/GgxJk7LDbrgQo+T07cl+Pbkpi+ci5Ug/QgpazLXPTWV6iKYtW32AIaDOrfWEPgvPV4c4J1nTv6SphLpmd7cwrU/yct8qNQskuDWB1X8nUIllkU+IOaa4t5o9u9AD8EbU55PPlinTVfmClyV3mm1I8xyh3ovRU/86agTcOg9siLiRnGCHh1LL/3m2KBdjL8mlBKawMs5e4p8FSwtAq0waIesIx2GkZaCaJNz/GCUnuy1vPyLLadwY7M+7aRYsCAAAAAAAAALEyFulZySVCYPJWcNI+sJLeKjNVc61V7eIRLyN4tFkAojlw/5BBhHGA+DYSzbWIy/327JmWT+synjScY9eR1KY=", "public_inputs_bytes": "TiVAYmO3YUJ/uEhwp64clm7N0hWqZmhks7sHQ/XrnA8=", "proof_points_bytes": "24B7kVbGLUkFw5UkRIwAw/z6+HqtkqWLb2bqIqQqk53nPoHVmEqkVSpBOd/WiMHLOwYCESUMnlZFKAzh7BE/CczVKuB6i2AHdHcB4K8AR+rDlp0jcu4Vw4u5yf19/+OmEWn8mBBu+GNVUrrBRSHDVuluixam0qwBoAaVSKuiCiw=" }; const vk_bytes = base64_to_u8Array(proof["vk_bytes"]);
  const vk_bytes = base64_to_u8Array(proof["vk_bytes"]);
  const public_inputs_bytes = base64_to_u8Array(proof["public_inputs_bytes"]);
  const proof_points_bytes = base64_to_u8Array(proof["proof_points_bytes"]);
  return {
    vk_bytes,
    public_inputs_bytes,
    proof_points_bytes,
  }
}

const verify_onchin = async (proof) => {
  const exampleMnemonic = "";
  const rpcUrl = getFullnodeUrl('testnet');
  const client = new SuiClient({ url: rpcUrl });
  const keypair = Ed25519Keypair.deriveKeypair(exampleMnemonic);
  const txb = new TransactionBlock();
  txb.setSender("0x2ee7d9adcb1b004d9af68e8192955c708c5bd17bf087688236dd1f3e1a3a7f07");
  txb.setGasBudget(1000000000);
  const config = {
    ProtocolPackage: "0x1b9c1b49f075584c3c35284ef30df5cddff6a0b52457dcf6ab8a9fc915904251",
  }
  console.time("verify_onchin");
  txb.moveCall({
    target: `${config.ProtocolPackage}::swap::verify_proof`,
    arguments: [
      txb.pure(bcs.vector(bcs.U8).serialize(proof.vk_bytes)),
      txb.pure(bcs.vector(bcs.U8).serialize(proof.public_inputs_bytes)),
      txb.pure(bcs.vector(bcs.U8).serialize(proof.proof_points_bytes)),
    ],
    typeArguments: []
  })
  const r = await client.signAndExecuteTransactionBlock({ signer: keypair, transactionBlock: txb });
  console.log(r.errors)
  console.timeEnd("verify_onchin");
}


export class PokerCard {
  idx: number;
  suit: string;
  value: number;

  constructor(idx: number, suit: string, value: number) {
    this.idx = idx;
    this.suit = suit;
    this.value = value;
  }
}

export interface IZKShuffle {
  shuffleEncryptCards: (deck: CompressedDeck) => Promise<CompressedDeck>;
  dealCards: (deck: OnChainDeck, cardBitIds: number, isFirstDecryption: boolean) => Promise<OnChainDeck>;
  openOffchain: (deck: OnChainDeck, cardBitIds: number, pk, sk) => Promise<PokerCard[]>;
}

export class ZKShuffle implements IZKShuffle {
  babyjub: any;
  initial_deck: bigint[];
  deck_map: { [key: string]: PokerCard };
  decrypt_wasm: string;
  decrypt_zkey: string;
  encrypt_wasm: string;
  encrypt_zkey: string;
  deck_per_x: bigint[];
  aggregated_key: any;
  aggregated_pkString: any;
  pk: any;
  sk: any;

  constructor() {
    this.initial_deck = [];
    this.deck_per_x = [];
    this.deck_map = {};
    const zkbigfile_dir = "/home/cleversushi/sui_projects/Sui-Full-Chain-Incomplete-Information-Cards-Game/zkbigfile/";
    this.decrypt_wasm = zkbigfile_dir + "decrypt.wasm";
    this.decrypt_zkey = zkbigfile_dir + "decrypt.zkey";
    this.encrypt_wasm = zkbigfile_dir + "encrypt.wasm";
    this.encrypt_zkey = zkbigfile_dir + "encrypt.zkey";
  }

  public async init() {
    this.babyjub = await buildBabyjub();
    console.log("buildBabyjub done");
    this.initial_deck = initDeck(this.babyjub, Number(numCards));
    // this.deck_per_x = this.initial_deck.slice(104, 156); // x1 can represent card
    this.deck_per_x = this.initial_deck.slice(2, 3); // x1 can represent card
    this.deck_map[this.deck_per_x[0].toString()] = new PokerCard(1, "Heart", 1);
    const suits: string[] = ['Diamond', 'Club', 'Heart', 'Spade']; // same as fe
    // let i = 0;
    // for (const suit of suits) {
    //   for (let value = 1; value <= 13; value++) {
    //     this.deck_map[this.deck_per_x[i].toString()] = new PokerCard(i, suit, value);
    //     i = i + 1;
    //   }
    // }
    const keys = keyGen(this.babyjub, numBits);
    this.pk = keys.pk;
    this.sk = keys.sk as bigint;
  }

  public async shuffleEncryptCards(deck: CompressedDeck): Promise<CompressedDeck> {
    // let compressedDeck = compressDeck(this.initial_deck);
    // console.log("init deck done");
    // let deck1: {
    //   X0: bigint[],
    //   X1: bigint[],
    //   Y0: bigint[],
    //   Y1: bigint[],
    //   selector: bigint[],
    // } = {
    //   X0: compressedDeck.X0,
    //   X1: compressedDeck.X1,
    //   Y0: [],
    //   Y1: [],
    //   selector: compressedDeck.selector,
    // };
    let deckDelta = recoverDeck(this.babyjub, deck.X0, deck.X1);
    let A = samplePermutation(Number(numCards)); // shuffle
    let R = sampleFieldElements(this.babyjub, numBits, numCards); // rand for each card
    let shuffledEncrypedCompressedDeck = shuffleEncryptV2Plaintext( // encrypt, compress
      this.babyjub, Number(numCards), A, R, this.aggregated_key,
      deck.X0, deck.X1,
      deckDelta.Delta0, deckDelta.Delta1,
      deck.selector,
    );
    console.log("shuffledEncrypedCompressedDeck");
    let val = {
      pk: this.aggregated_pkString,
      UX0: deck.X0.map((bigint) => bigint.toString()),
      UX1: deck.X1.map((bigint) => bigint.toString()),
      VX0: shuffledEncrypedCompressedDeck.X0.map((bigint) => bigint.toString()),
      VX1: shuffledEncrypedCompressedDeck.X1.map((bigint) => bigint.toString()),
      UDelta0: deckDelta.Delta0.map((bigint) => bigint.toString()),
      UDelta1: deckDelta.Delta1.map((bigint) => bigint.toString()),
      VDelta0: shuffledEncrypedCompressedDeck.delta0.map((bigint) => bigint.toString()),
      VDelta1: shuffledEncrypedCompressedDeck.delta1.map((bigint) => bigint.toString()),
      s_u: deck.selector.map((bigint) => bigint.toString()),
      s_v: shuffledEncrypedCompressedDeck.selector.map((bigint) => bigint.toString()),
      A: A.map((bigint) => bigint.toString()),
      R: R.map((bigint) => bigint.toString()),
    }
    let proof = await get_proof(val);
    await verify_onchin(proof);
    // let shuffleEncryptOutput = await generateShuffleEncryptV2Proof(
    //   this.aggregated_pkString,
    //   A, R,
    //   deck.X0, deck.X1,
    //   deckDelta.Delta0, deckDelta.Delta1,
    //   deck.selector,
    //   shuffledEncrypedCompressedDeck.X0,
    //   shuffledEncrypedCompressedDeck.X1,
    //   shuffledEncrypedCompressedDeck.delta0,
    //   shuffledEncrypedCompressedDeck.delta1,
    //   shuffledEncrypedCompressedDeck.selector,
    //   this.encrypt_wasm,
    //   this.encrypt_zkey
    // );
    // console.log("shuffle deck done");
    // // TODO: verify_on_chain(shuffleEncryptProof);
    // const X0 = shuffleEncryptOutput.publicSignals.slice(3 + numCards * 2, 3 + numCards * 3); // start with out, then non-private signal
    // const X1 = shuffleEncryptOutput.publicSignals.slice(3 + numCards * 3, 3 + numCards * 4);
    // const selector0 = shuffleEncryptOutput.publicSignals[5 + numCards * 4];
    // const selector1 = shuffleEncryptOutput.publicSignals[6 + numCards * 4];
    // return {
    //   X0: X0.map((str) => BigInt(str)),
    //   X1: X1.map((str) => BigInt(str)),
    //   selector: [BigInt(selector0), BigInt(selector1)]
    // };
    return {
      X0: shuffledEncrypedCompressedDeck.X0,
      X1: shuffledEncrypedCompressedDeck.X1,
      selector: shuffledEncrypedCompressedDeck.selector
    };
    // return {
    //   X0: [],
    //   X1: [],
    //   selector: []
    // };
  }

  public async dealCards(deck: OnChainDeck, cardBitIds: number, isFirstDecryption: boolean): Promise<OnChainDeck> {
    return await this._dealCards(deck, cardBitIds, isFirstDecryption, this.sk, this.pk);
  }

  async _dealCards(deck: OnChainDeck, cardBitIds: number, isFirstDecryption: boolean, sk, pk): Promise<OnChainDeck> {
    const start = Date.now();
    const cardIds = this.getCardIdsFromUint8(cardBitIds);
    let elgamalEccPoints: ElgamalECCPoint[] = [];
    let newDeck: OnChainDeck = { X0: [], Y0: [], X1: [], Y1: [], selector: [] };
    if (isFirstDecryption) {
      elgamalEccPoints = await this.dealCompressdDeck(deck, cardIds, sk, pk);
      for (let i = 0; i < cardIds.length; i++) {
        newDeck.X0.push(elgamalEccPoints[i].x0);
        newDeck.Y0.push(elgamalEccPoints[i].y0);
        newDeck.X1.push(elgamalEccPoints[i].x1);
        newDeck.Y1.push(elgamalEccPoints[i].y1);
      }
    } else {
      elgamalEccPoints = await this.dealUnCompressdDeck(deck, cardIds, sk, pk);
      for (let i = 0; i < cardIds.length; i++) {
        newDeck.X1.push(elgamalEccPoints[i].x1);
        newDeck.Y1.push(elgamalEccPoints[i].y1);
      }
    }
    console.log("Player deal cards in ", Date.now() - start, "ms");
    return newDeck
  }

  async dealCompressdDeck(deck: OnChainDeck, cards: number[], sk: bigint, pk: bigint[]) {
    return await decryptMultiCompressedCard(
      this.babyjub,
      numCards,
      deck,
      cards,
      sk,
      pk,
      this.decrypt_wasm as string,
      this.decrypt_zkey as string,
    );
  }

  async dealUnCompressdDeck(deck: OnChainDeck, cards: number[], sk: bigint, pk: bigint[]) {
    return await decryptMultiUnCompressedCard(
      this.babyjub,
      deck,
      cards,
      sk,
      pk,
      this.decrypt_wasm as string,
      this.decrypt_zkey as string,
    );
  }

  public async openOffchain(deck: OnChainDeck, cardBitIds: number): Promise<PokerCard[]> {
    return await this._openOffchain(deck, cardBitIds, this.sk, this.pk)
  }

  async _openOffchain(deck: OnChainDeck, cardBitIds: number, sk, pk): Promise<PokerCard[]> {
    const onChainDeck = await this._dealCards(deck, cardBitIds, false, sk, pk);
    const cards: PokerCard[] = [];
    for (let i = 0; i < onChainDeck.X1.length; i++) {
      cards.push(this.queryCardsPerX(onChainDeck.X1[i].toString()));
    }
    return cards;
  }

  private getCardIdsFromUint8(num: number): number[] {
    const binaryString = num.toString(2);
    // console.log(binaryString);
    const cardIds: number[] = [];
    for (let i = binaryString.length - 1; i >= 0; i--) {
      if (binaryString[i] === "1") {
        cardIds.push(binaryString.length - 1 - i);
      }
    }
    return cardIds
  }

  private queryCardsPerX(px: string): PokerCard {
    return this.deck_map[px];
  }

  public async newAccount(addr) {
    const keys = keyGenAddr(this.babyjub, numBits, addr);
    // const keys = keyGen(this.babyjub, numBits);
    this.sk = keys.sk as bigint;
    this.pk = [this.babyjub.F.toString(keys.pk[0]), this.babyjub.F.toString(keys.pk[1])];
    return [this.sk, this.pk];
  }

  public async setAggregated_key(pk_x0, pk_y0, pk_x1, pk_y1, pk_x2, pk_y2) {
    const pkAlice = [this.babyjub.F.e(pk_x0), this.babyjub.F.e(pk_y0)];
    const pkBob = [this.babyjub.F.e(pk_x1), this.babyjub.F.e(pk_y1)];
    const pkCharlie = [this.babyjub.F.e(pk_x2), this.babyjub.F.e(pk_y2)];
    this.aggregated_key = keyAggregate(this.babyjub, [pkAlice, pkBob, pkCharlie]);
    this.aggregated_pkString = [this.babyjub.F.toString(this.aggregated_key[0]), this.babyjub.F.toString(this.aggregated_key[1])];
  }

  main = async () => {
    /*
     * Note:
     * sk = sk_A + sk_B + sk_C
     * pk = sk*g
    
     * Init:
     * (0, m)
     * Alice Encrypt:
     * (a*g, m + a*pk)
     * Bob Encrypt:
     * ((a+b)*g, m + (a+b)*pk)
     * Charlie Encrypt:
     * ((a+b+c)*g, m + (a+b+c)*pk), note as (c0, c1)
     * 
     * Alice Decrypt -> Bob Decrypt -> Charlie Decrypt
     * 
     * Alice Decrypt = c1 - sk_A*c0 = m+(a+b+c)*pk - sk_A*(a+b+c)*g
     * Bob Decrypt = Alice Decrypt - sk_B*c0 = (m+(a+b+c)*pk - sk_A*(a+b+c)*g) - sk_B*(a+b+c)*g
     * Charlie Decrypt = Bob Decrypt - sk_C*c0
     *                 = ((m+(a+b+c)*pk - sk_A*(a+b+c)*g) - sk_B*(a+b+c)*g) - sk_C*(a+b+c)*g 
     *                 = m +(a+b+c)*pk -g(sk_A+sk_B+sk_C)(a+b+b)
     *                 = m 
     * last turn decrypt result, but always c0                 
    */

    const [skAlice, pkStringAlice] = await this.newAccount("0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276");
    const [skBob, pkStringBob] = await this.newAccount("0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6");
    const [skCharlie, pkStringCharlie] = await this.newAccount("0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213");
    console.log(pkStringAlice[0], pkStringAlice[1])
    console.log(pkStringBob[0], pkStringBob[1])
    console.log(pkStringCharlie[0], pkStringCharlie[1])

    // this.aggregated_key = keyAggregate(this.babyjub, [pkAlice, pkBob, pkCharlie]);
    // this.aggregated_pkString = [this.babyjub.F.toString(this.aggregated_key[0]), this.babyjub.F.toString(this.aggregated_key[1])];
    this.setAggregated_key(pkStringAlice[0], pkStringAlice[1], pkStringBob[0], pkStringBob[1], pkStringCharlie[0], pkStringCharlie[1]);
    console.log(this.aggregated_pkString[0], this.aggregated_pkString[1])
    // Initializes deck. this should done by contract
    let compressedDeck = compressDeck(this.initial_deck);
    console.log("init deck done");
    let deck: {
      X0: bigint[],
      X1: bigint[],
      Y0: bigint[],
      Y1: bigint[],
      selector: bigint[],
    } = {
      X0: compressedDeck.X0,
      X1: compressedDeck.X1,
      Y0: [],
      Y1: [],
      selector: compressedDeck.selector,
    };
    // alice receive onchain object
    const aliceEncrypt = await this.shuffleEncryptCards(deck);

    //   console.log(aliceEncrypt);
    //   const bobEncrypt = await this.shuffleEncryptCards(aliceEncrypt);
    //   const charlieEncrypt = await this.shuffleEncryptCards(bobEncrypt);
    //   const onChainDeck = { Y0: [] as bigint[], Y1: [] as bigint[], ...charlieEncrypt };
    //   // decrypt alice
    //   const cardIds = this.getCardIdsFromUint8(0xfffff00000000);
    //   // console.log(cardIds);
    //   const boBDecrypt = await this._dealCards(onChainDeck, 0xfffff00000000, true, skBob, pkStringBob);
    //   // write contract
    //   for (let i = 0; i < cardIds.length; i++) {
    //     onChainDeck.X0[cardIds[i]] = boBDecrypt.X0[i];
    //     onChainDeck.Y0[cardIds[i]] = boBDecrypt.Y0[i];
    //     onChainDeck.X1[cardIds[i]] = boBDecrypt.X1[i];
    //     onChainDeck.Y1[cardIds[i]] = boBDecrypt.Y1[i];
    //   }
    //   const charlieDecrypt = await this._dealCards(onChainDeck, 0xfffff00000000, false, skCharlie, pkStringCharlie);
    //   // write contract
    //   for (let i = 0; i < cardIds.length; i++) {
    //     onChainDeck.X1[cardIds[i]] = charlieDecrypt.X1[i];
    //     onChainDeck.Y1[cardIds[i]] = charlieDecrypt.Y1[i];
    //   }
    //   const pokerCard = await this._openOffchain(onChainDeck, 0xfffff00000000, skAlice, pkStringAlice);
    //   console.log("decrypt deck done");
    //   console.log(pokerCard);
  }
}
const main = async () => {
  const a1 = [1];
  console.log(typeof a1);

  let a = new ZKShuffle();
  await a.init();
  await a.main();
}

main();