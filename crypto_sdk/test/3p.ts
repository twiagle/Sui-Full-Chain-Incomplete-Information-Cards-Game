import { elgamalEncrypt, elgamalDecrypt, shuffleEncryptV2Plaintext } from "../src/plaintext";
import { keyGen, bits2Num, ecCompress, ecDecompress, ecX2Delta, num2Bits, recoverDeck, sampleFieldElements, samplePermutation, prepareDecryptData, keyAggregate } from "../src/utilities";
import { BabyJub } from 'circomlibjs';
import { compressDeck, initDeck, OnChainDeck, CompressedDeck } from "../src/deck";
import { generateDecryptProof, generateShuffleEncryptV2Proof, decryptMultiCompressedCard, decryptMultiUnCompressedCard, ElgamalECCPoint } from "../src/proof";

import { buildBabyjub } from 'circomlibjs-0-1-7';
const numCards = 52;
const numBits = BigInt(251);

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
    this.deck_per_x = this.initial_deck.slice(104, 156); // x1 can represent card
    const suits: string[] = ['Diamond', 'Club', 'Heart', 'Spade']; // same as fe
    let i = 0;
    for (const suit of suits) {
      for (let value = 1; value <= 13; value++) {
        this.deck_map[this.deck_per_x[i].toString()] = new PokerCard(i, suit, value);;
        i = i + 1;
      }
    }
    const keys = keyGen(this.babyjub, numBits);
    this.pk = keys.pk;
    this.sk = keys.sk as bigint;
  }

  public async shuffleEncryptCards(deck: CompressedDeck): Promise<CompressedDeck> {
    let deckDelta = recoverDeck(this.babyjub, deck.X0, deck.X1);
    let A = samplePermutation(Number(numCards)); // shuffle
    let R = sampleFieldElements(this.babyjub, numBits, numCards); // rand for each card
    let shuffledEncrypedCompressedDeck = shuffleEncryptV2Plaintext( // encrypt, compress
      this.babyjub, Number(numCards), A, R, this.aggregated_key,
      deck.X0, deck.X1,
      deckDelta.Delta0, deckDelta.Delta1,
      deck.selector,
    );
    let shuffleEncryptOutput = await generateShuffleEncryptV2Proof(
      this.aggregated_pkString,
      A, R,
      deck.X0, deck.X1,
      deckDelta.Delta0, deckDelta.Delta1,
      deck.selector,
      shuffledEncrypedCompressedDeck.X0,
      shuffledEncrypedCompressedDeck.X1,
      shuffledEncrypedCompressedDeck.delta0,
      shuffledEncrypedCompressedDeck.delta1,
      shuffledEncrypedCompressedDeck.selector,
      this.encrypt_wasm,
      this.encrypt_zkey
    );
    console.log("shuffle deck done");
    // TODO: verify_on_chain(shuffleEncryptProof);
    const X0 = shuffleEncryptOutput.publicSignals.slice(3 + numCards * 2, 3 + numCards * 3); // start with out, then non-private signal
    const X1 = shuffleEncryptOutput.publicSignals.slice(3 + numCards * 3, 3 + numCards * 4);
    const selector0 = shuffleEncryptOutput.publicSignals[5 + numCards * 4];
    const selector1 = shuffleEncryptOutput.publicSignals[6 + numCards * 4];
    return {
      X0: X0.map((str) => BigInt(str)),
      X1: X1.map((str) => BigInt(str)),
      selector: [BigInt(selector0), BigInt(selector1)]
    };
  }

  public async dealCards(deck: OnChainDeck, cardBitIds: number, isFirstDecryption: boolean): Promise<OnChainDeck> {
    return await this._dealCards(deck, cardBitIds, isFirstDecryption, this.pk, this.sk);
  }

  async _dealCards(deck: OnChainDeck, cardBitIds: number, isFirstDecryption: boolean, pk, sk): Promise<OnChainDeck> {
    const start = Date.now();
    const cardIds = this.getCardIdsFromUint8(cardBitIds);
    let elgamalEccPoints: ElgamalECCPoint[] = [];
    let newDeck: OnChainDeck = { X0: [], Y0: [], X1: [], Y1: [], selector: [] };
    if (isFirstDecryption) {
      elgamalEccPoints = await this.dealCompressdDeck(deck, cardIds, pk, sk);
      for (let i = 0; i < cardIds.length; i++) {
        newDeck.X0.push(elgamalEccPoints[i].x0);
        newDeck.Y0.push(elgamalEccPoints[i].y0);
        newDeck.X1.push(elgamalEccPoints[i].x1);
        newDeck.Y1.push(elgamalEccPoints[i].y1);
      }
    } else {
      elgamalEccPoints = await this.dealUnCompressdDeck(deck, cardIds, pk, sk);
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
      deck,
      cards,
      sk,
      pk,
      this.decrypt_wasm as string,
      this.decrypt_zkey as string,
    );
  }

  public async openOffchain(deck: OnChainDeck, cardBitIds: number): Promise<PokerCard[]> {
    return await this._openOffchain(deck, cardBitIds, this.pk, this.sk)
  }

  async _openOffchain(deck: OnChainDeck, cardBitIds: number, pk, sk): Promise<PokerCard[]> {
    const onChainDeck = await this._dealCards(deck, cardBitIds, false, pk, sk);
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

  public async newAccount() {
    const keys = keyGen(this.babyjub, numBits);
    const pk = keys.pk;
    const sk = keys.sk as bigint;
    const pkString = [this.babyjub.F.toString(keys.pk[0]), this.babyjub.F.toString(keys.pk[1])];
    return [sk, pk, pkString]
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

    const [skAlice, pkAlice, pkStringAlice] = await this.newAccount();
    const [skBob, pkBob, pkStringBob] = await this.newAccount();
    const [skCharlie, pkCharlie, pkStringCharlie] = await this.newAccount();
    console.log(pkStringAlice[0], pkStringAlice[1])

    // this.aggregated_key = keyAggregate(this.babyjub, [pkAlice, pkBob, pkCharlie]);
    // this.aggregated_pkString = [this.babyjub.F.toString(this.aggregated_key[0]), this.babyjub.F.toString(this.aggregated_key[1])];
    this.setAggregated_key(pkStringAlice[0], pkStringAlice[1], pkStringBob[0], pkStringBob[1], pkStringCharlie[0], pkStringCharlie[1]);
    // Initializes deck. this should done by contract
    let compressedDeck = compressDeck(this.initial_deck);
    console.log(compressedDeck);
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
    const bobEncrypt = await this.shuffleEncryptCards(aliceEncrypt);
    const charlieEncrypt = await this.shuffleEncryptCards(bobEncrypt);
    const onChainDeck = { Y0: [] as bigint[], Y1: [] as bigint[], ...charlieEncrypt };
    // decrypt alice
    const cardIds = this.getCardIdsFromUint8(0xfffff00000000);
    console.log(cardIds);
    const boBDecrypt = await this._dealCards(onChainDeck, 0xfffff00000000, true, skBob, pkStringBob);
    // write contract
    for (let i = 0; i < cardIds.length; i++) {
      onChainDeck.X0[cardIds[i]] = boBDecrypt.X0[i];
      onChainDeck.Y0[cardIds[i]] = boBDecrypt.Y0[i];
      onChainDeck.X1[cardIds[i]] = boBDecrypt.X1[i];
      onChainDeck.Y1[cardIds[i]] = boBDecrypt.Y1[i];
    }
    const charlieDecrypt = await this._dealCards(onChainDeck, 0xfffff00000000, false, skCharlie, pkStringCharlie);
    // write contract
    for (let i = 0; i < cardIds.length; i++) {
      onChainDeck.X1[cardIds[i]] = charlieDecrypt.X1[i];
      onChainDeck.Y1[cardIds[i]] = charlieDecrypt.Y1[i];
    }
    const pokerCard = await this._openOffchain(onChainDeck, 0xfffff00000000, skAlice, pkStringAlice);
    console.log(pokerCard);
    console.log("decrypt deck done");
  }
}

const main = async () => {
  let a = new ZKShuffle();
  await a.init();
  await a.main();
}

main();