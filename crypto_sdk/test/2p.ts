import { WebSocket } from "ws";
import { elgamalEncrypt, elgamalDecrypt, shuffleEncryptV2Plaintext } from "../src/plaintext";
import { keyGen, bits2Num, ecCompress, ecDecompress, ecX2Delta, num2Bits, recoverDeck, sampleFieldElements, samplePermutation, prepareDecryptData, keyAggregate } from "../src/utilities";
import { BabyJub } from 'circomlibjs';
import { compressDeck, initDeck, decompressDeck } from "../src/deck";
import { generateDecryptProof, generateShuffleEncryptV2Proof, verify_on_chain } from "../src/proof";
const Scalar = require("ffjavascript").Scalar;
const buildBabyjub = require('circomlibjs-0-1-7').buildBabyjub;
import { SuiClient, getFullnodeUrl, SuiHTTPTransport } from "@mysten/sui.js/client";
import { ExitStatus } from "typescript";

const numCards = 52;
const numBits = BigInt(251);

const WSS_URL = getFullnodeUrl('testnet');
// const SUI_WSS_CLIENT = new SuiClient({ url: WSS_URL });
const SUI_WSS_CLIENT = new SuiClient({
  transport: new SuiHTTPTransport({
    url: getFullnodeUrl("testnet"),
    // The typescript definitions may not match perfectly, casting to never avoids these minor incompatibilities
    WebSocketConstructor: WebSocket as never,
  }),
});

export class PlayingCard {
  idx: number;
  suit: string;
  value: number;

  constructor(idx: number, suit: string, value: number) {
    this.idx = idx;
    this.suit = suit;
    this.value = value;
  }
}

export class ZKShuffle {
  babyjub: any;
  initial_deck: bigint[];
  deck_map: { [key: string]: PlayingCard };
  decrypt_wasm: string;
  decrypt_zkey: string;
  encrypt_wasm: string;
  encrypt_zkey: string;
  keysAlice: any;
  pk: any;
  sk: any;
  pkString: any;
  deck_per_x: bigint[];

  b_pk: any;
  b_sk: any;
  b_pkString: any;




  aggregated_key: any;
  aggregated_pkString: any;

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
    console.log("first");

    this.keysAlice = keyGen(this.babyjub, numBits);
    this.pk = this.keysAlice.pk;
    this.sk = this.keysAlice.sk as bigint;
    this.pkString = [this.babyjub.F.toString(this.keysAlice.pk[0]), this.babyjub.F.toString(this.keysAlice.pk[1])];
    this.initial_deck = initDeck(this.babyjub, Number(numCards));

    const keysBob = keyGen(this.babyjub, numBits);
    this.b_pk = keysBob.pk;
    this.b_sk = keysBob.sk;
    this.b_pkString = [this.babyjub.F.toString(this.b_pk[0]), this.babyjub.F.toString(this.b_pk[1])];
    this.aggregated_key = keyAggregate(this.babyjub, [this.pk, this.b_pk])
    this.aggregated_pkString = [this.babyjub.F.toString(this.aggregated_key[0]), this.babyjub.F.toString(this.aggregated_key[1])];

    // human card
    this.deck_per_x = this.initial_deck.slice(104, 156);
    const suits: string[] = ['Club', 'Diamond', 'Heart', 'Spade'];
    let i = 0;
    for (const suit of suits) {
      for (let value = 1; value <= 13; value++) {
        this.deck_map[this.deck_per_x[i].toString()] = new PlayingCard(i, suit, value);;
        // console.log(this.initial_deck[i].toString(), i, suit, value);
        i = i + 1;
      }
    }
  }

  private queryCardsPerX(px: string) {
    return this.deck_map[px];
  }

  async openOffchain(gameId: number, cardIds: number[], deck: any): Promise<PlayingCard[]> {
    const { decryptedCards } = await this.getOpenProof(gameId, cardIds, deck);
    const cards: PlayingCard[] = [];
    for (let i = 0; i < decryptedCards.length; i++) {
      cards.push(this.queryCardsPerX(decryptedCards[i].X));
    }
    return cards;
  }
  async getOpenProof(gameId: number, cardIds: number[], deck: any) {
    // remove duplicate card ids
    cardIds = cardIds.filter((v, i, a) => a.indexOf(v) === i);
    // sort card ids
    cardIds = cardIds.sort((n1, n2) => n1 - n2);

    const start = Date.now();
    // const deck = await this.smc.queryDeck(gameId);

    const decryptedCards: Record<string, any> = [];
    const proofs: Record<string, any> = [];
    let cardMap = 0;

    for (let i = 0; i < cardIds.length; i++) {
      const cardId = cardIds[i];
      cardMap += 1 << cardId;

      const decryptProof = await generateDecryptProof(
        [
          deck.X0[cardId].toBigInt(),
          deck.Y0[cardId].toBigInt(),
          deck.X1[cardId].toBigInt(),
          deck.Y1[cardId].toBigInt(),
        ],
        this.sk as bigint,
        this.pk,
        this.decrypt_wasm as string,
        this.decrypt_zkey as string,
      );
      decryptedCards.push({
        X: decryptProof.publicSignals[0],
        Y: decryptProof.publicSignals[1],
      });

      // proofs.push(packToSolidityProof(decryptProof.proof));
    }
    console.log("generate open card proof in ", Date.now() - start, "ms");
    return {
      cardMap,
      decryptedCards,
      proofs,
    };
  }

  main = async () => {
    // Initializes deck. this should done by contract
    let compressedDeck = compressDeck(this.initial_deck);
    let deck: {
      X0: bigint[],
      X1: bigint[],
      selector: bigint[],
    } = {
      X0: compressedDeck.X0,
      X1: compressedDeck.X1,
      selector: compressedDeck.selector,
    };
    // alice receive onchain object
    let deckDelta = recoverDeck(this.babyjub, deck.X0, deck.X1);
    console.log("init deck done");
    // shuffle
    let A = samplePermutation(Number(numCards));
    let R = sampleFieldElements(this.babyjub, numBits, numCards);
    let shuffledEncrypedCompressedDeck = shuffleEncryptV2Plaintext(
      this.babyjub, Number(numCards), A, R, this.aggregated_key,
      deck.X0, deck.X1,
      deckDelta.Delta0, deckDelta.Delta1,
      deck.selector,
    );
    let shuffleEncryptOutput = await generateShuffleEncryptV2Proof(
      this.aggregated_pkString,
      A,
      R,
      deck.X0,
      deck.X1,
      deckDelta.Delta0,
      deckDelta.Delta1,
      deck.selector,
      shuffledEncrypedCompressedDeck.X0,
      shuffledEncrypedCompressedDeck.X1,
      shuffledEncrypedCompressedDeck.delta0,
      shuffledEncrypedCompressedDeck.delta1,
      shuffledEncrypedCompressedDeck.selector,
      this.encrypt_wasm,
      this.encrypt_zkey
    );
    console.log("alice shuffle deck done");
    // verify_on_chain(shuffleEncryptProof);
    // crypto result, send to contract
    const X0 = shuffleEncryptOutput.publicSignals.slice(3 + numCards * 2, 3 + numCards * 3);
    const X1 = shuffleEncryptOutput.publicSignals.slice(3 + numCards * 3, 3 + numCards * 4);
    const selector0 = shuffleEncryptOutput.publicSignals[5 + numCards * 4];
    const selector1 = shuffleEncryptOutput.publicSignals[6 + numCards * 4];

    // bob encrypt
    let b_deckDelta = recoverDeck(this.babyjub, X0.map((str) => BigInt(str)), X1.map((str) => BigInt(str)));
    console.log("init deck done");
    // shuffle
    let b_A = samplePermutation(Number(numCards));
    let b_R = sampleFieldElements(this.babyjub, numBits, numCards);
    let b_shuffledEncrypedCompressedDeck = shuffleEncryptV2Plaintext(
      this.babyjub, Number(numCards), b_A, b_R, this.aggregated_key,
      X0.map((str) => BigInt(str)),
      X1.map((str) => BigInt(str)),
      b_deckDelta.Delta0,
      b_deckDelta.Delta1,
      [BigInt(selector0), BigInt(selector1)]
    );
    let b_shuffleEncryptOutput = await generateShuffleEncryptV2Proof(
      this.aggregated_pkString,
      b_A,
      b_R,
      X0.map((str) => BigInt(str)),
      X1.map((str) => BigInt(str)),
      b_deckDelta.Delta0,
      b_deckDelta.Delta1,
      [BigInt(selector0), BigInt(selector1)],
      b_shuffledEncrypedCompressedDeck.X0,
      b_shuffledEncrypedCompressedDeck.X1,
      b_shuffledEncrypedCompressedDeck.delta0,
      b_shuffledEncrypedCompressedDeck.delta1,
      b_shuffledEncrypedCompressedDeck.selector,
      this.encrypt_wasm,
      this.encrypt_zkey
    );
    console.log("bob shuffle deck done");
    const b_X0 = b_shuffleEncryptOutput.publicSignals.slice(3 + numCards * 2, 3 + numCards * 3);
    const b_X1 = b_shuffleEncryptOutput.publicSignals.slice(3 + numCards * 3, 3 + numCards * 4);
    const b_selector0 = b_shuffleEncryptOutput.publicSignals[5 + numCards * 4];
    const b_selector1 = b_shuffleEncryptOutput.publicSignals[6 + numCards * 4];

    // decrypt alice
    const Y = prepareDecryptData(
      this.babyjub,
      BigInt(b_X0[0]),
      BigInt(b_X1[0]),
      BigInt(b_selector0),
      BigInt(b_selector1),
      numCards,
      0,
    );
    // console.log(Y);
    // console.log(this.sk, this.pk);
    const pk = [this.babyjub.F.toString(this.pk[0]), this.babyjub.F.toString(this.pk[1])];
    const decryptProof = await generateDecryptProof(Y, this.sk, pk, this.decrypt_wasm, this.decrypt_zkey);
    const x = decryptProof.publicSignals[0]; // c0x
    const y = decryptProof.publicSignals[1]; //
    // console.log(X0);

    // decrypt bob
    // const b_Y = prepareDecryptData(
    //   this.babyjub,
    //   BigInt(b_X0[0]),
    //   BigInt(x),
    //   BigInt(selector0),
    //   BigInt(selector1),
    //   numCards,
    //   0,
    // );
    // console.log(Y);
    // console.log(this.sk, this.pk);
    const b_pk = [this.babyjub.F.toString(this.b_pk[0]), this.babyjub.F.toString(this.b_pk[1])];
    const b_decryptProof = await generateDecryptProof(
      [Y[0], Y[1], BigInt(x), BigInt(y)], this.b_sk, b_pk, this.decrypt_wasm, this.decrypt_zkey);
    const b_x = b_decryptProof.publicSignals[0]; // c0x
    const b_y = b_decryptProof.publicSignals[1]; //
    const poker = this.queryCardsPerX(b_x)
    console.log(poker);
    console.log("decrypt deck done");

  }
}
const main = async () => {
  let a = new ZKShuffle();
  await a.init();
  await a.main();
}

main();