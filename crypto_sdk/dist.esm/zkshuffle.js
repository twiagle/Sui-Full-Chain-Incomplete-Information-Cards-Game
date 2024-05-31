import { shuffleEncryptV2Plaintext } from "./plaintext";
import { keyGen, recoverDeck, sampleFieldElements, samplePermutation, keyAggregate, keyGenAddr } from "./utilities";
import { compressDeck, initDeck } from "./deck";
import { decryptMultiCompressedCard, decryptMultiUnCompressedCard } from "./proof";
import { buildBabyjub } from 'circomlibjs-0-1-7';
const numCards = 52;
const numBits = BigInt(251);
export class PokerCard {
    constructor(idx, suit, value) {
        this.idx = idx;
        this.suit = suit;
        this.value = value;
    }
}
export class ZKShuffle {
    constructor() {
        this.main = async () => {
            const [skAlice, pkStringAlice] = await this.newAccount("0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276");
            const [skBob, pkStringBob] = await this.newAccount("0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6");
            const [skCharlie, pkStringCharlie] = await this.newAccount("0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213");
            console.log(pkStringAlice[0], pkStringAlice[1]);
            console.log(pkStringBob[0], pkStringBob[1]);
            console.log(pkStringCharlie[0], pkStringCharlie[1]);
            this.setAggregated_key(pkStringAlice[0], pkStringAlice[1], pkStringBob[0], pkStringBob[1], pkStringCharlie[0], pkStringCharlie[1]);
            console.log(this.aggregated_pkString[0], this.aggregated_pkString[1]);
            let compressedDeck = compressDeck(this.initial_deck);
            console.log("init deck done");
            let deck = {
                X0: compressedDeck.X0,
                X1: compressedDeck.X1,
                Y0: [],
                Y1: [],
                selector: compressedDeck.selector,
            };
            const aliceEncrypt = await this.shuffleEncryptCards(deck);
            console.log(aliceEncrypt);
            const bobEncrypt = await this.shuffleEncryptCards(aliceEncrypt);
            const charlieEncrypt = await this.shuffleEncryptCards(bobEncrypt);
            const onChainDeck = { Y0: [], Y1: [], ...charlieEncrypt };
            const cardIds = this.getCardIdsFromUint8(0xfffff00000000);
            const boBDecrypt = await this._dealCards(onChainDeck, 0xfffff00000000, true, skBob, pkStringBob);
            for (let i = 0; i < cardIds.length; i++) {
                onChainDeck.X0[cardIds[i]] = boBDecrypt.X0[i];
                onChainDeck.Y0[cardIds[i]] = boBDecrypt.Y0[i];
                onChainDeck.X1[cardIds[i]] = boBDecrypt.X1[i];
                onChainDeck.Y1[cardIds[i]] = boBDecrypt.Y1[i];
            }
            const charlieDecrypt = await this._dealCards(onChainDeck, 0xfffff00000000, false, skCharlie, pkStringCharlie);
            for (let i = 0; i < cardIds.length; i++) {
                onChainDeck.X1[cardIds[i]] = charlieDecrypt.X1[i];
                onChainDeck.Y1[cardIds[i]] = charlieDecrypt.Y1[i];
            }
            const pokerCard = await this._openOffchain(onChainDeck, 0xfffff00000000, skAlice, pkStringAlice);
            console.log("decrypt deck done");
            console.log(pokerCard);
        };
        this.initial_deck = [];
        this.deck_per_x = [];
        this.deck_map = {};
        const zkbigfile_dir = "/home/cleversushi/sui_projects/Sui-Full-Chain-Incomplete-Information-Cards-Game/zkbigfile/";
        this.decrypt_wasm = zkbigfile_dir + "decrypt.wasm";
        this.decrypt_zkey = zkbigfile_dir + "decrypt.zkey";
        this.encrypt_wasm = zkbigfile_dir + "encrypt.wasm";
        this.encrypt_zkey = zkbigfile_dir + "encrypt.zkey";
    }
    async init() {
        this.babyjub = await buildBabyjub();
        console.log("buildBabyjub done");
        this.initial_deck = initDeck(this.babyjub, Number(numCards));
        this.deck_per_x = this.initial_deck.slice(104, 156);
        const suits = ['Diamond', 'Club', 'Heart', 'Spade'];
        let i = 0;
        for (const suit of suits) {
            for (let value = 1; value <= 13; value++) {
                this.deck_map[this.deck_per_x[i].toString()] = new PokerCard(i, suit, value);
                ;
                i = i + 1;
            }
        }
        const keys = keyGen(this.babyjub, numBits);
        this.pk = keys.pk;
        this.sk = keys.sk;
    }
    async shuffleEncryptCards(deck) {
        let deckDelta = recoverDeck(this.babyjub, deck.X0, deck.X1);
        let A = samplePermutation(Number(numCards));
        let R = sampleFieldElements(this.babyjub, numBits, numCards);
        let shuffledEncrypedCompressedDeck = shuffleEncryptV2Plaintext(this.babyjub, Number(numCards), A, R, this.aggregated_key, deck.X0, deck.X1, deckDelta.Delta0, deckDelta.Delta1, deck.selector);
        console.log("shuffledEncrypedCompressedDeck");
        return {
            X0: shuffledEncrypedCompressedDeck.X0,
            X1: shuffledEncrypedCompressedDeck.X1,
            selector: shuffledEncrypedCompressedDeck.selector
        };
    }
    async dealCards(deck, cardBitIds, isFirstDecryption) {
        return await this._dealCards(deck, cardBitIds, isFirstDecryption, this.sk, this.pk);
    }
    async _dealCards(deck, cardBitIds, isFirstDecryption, sk, pk) {
        const start = Date.now();
        const cardIds = this.getCardIdsFromUint8(cardBitIds);
        let elgamalEccPoints = [];
        let newDeck = { X0: [], Y0: [], X1: [], Y1: [], selector: [] };
        if (isFirstDecryption) {
            elgamalEccPoints = await this.dealCompressdDeck(deck, cardIds, sk, pk);
            for (let i = 0; i < cardIds.length; i++) {
                newDeck.X0.push(elgamalEccPoints[i].x0);
                newDeck.Y0.push(elgamalEccPoints[i].y0);
                newDeck.X1.push(elgamalEccPoints[i].x1);
                newDeck.Y1.push(elgamalEccPoints[i].y1);
            }
        }
        else {
            elgamalEccPoints = await this.dealUnCompressdDeck(deck, cardIds, sk, pk);
            for (let i = 0; i < cardIds.length; i++) {
                newDeck.X1.push(elgamalEccPoints[i].x1);
                newDeck.Y1.push(elgamalEccPoints[i].y1);
            }
        }
        console.log("Player deal cards in ", Date.now() - start, "ms");
        return newDeck;
    }
    async dealCompressdDeck(deck, cards, sk, pk) {
        return await decryptMultiCompressedCard(this.babyjub, numCards, deck, cards, sk, pk, this.decrypt_wasm, this.decrypt_zkey);
    }
    async dealUnCompressdDeck(deck, cards, sk, pk) {
        return await decryptMultiUnCompressedCard(this.babyjub, deck, cards, sk, pk, this.decrypt_wasm, this.decrypt_zkey);
    }
    async openOffchain(deck, cardBitIds) {
        return await this._openOffchain(deck, cardBitIds, this.sk, this.pk);
    }
    async _openOffchain(deck, cardBitIds, sk, pk) {
        const onChainDeck = await this._dealCards(deck, cardBitIds, false, sk, pk);
        const cards = [];
        for (let i = 0; i < onChainDeck.X1.length; i++) {
            cards.push(this.queryCardsPerX(onChainDeck.X1[i].toString()));
        }
        return cards;
    }
    getCardIdsFromUint8(num) {
        const binaryString = num.toString(2);
        const cardIds = [];
        for (let i = binaryString.length - 1; i >= 0; i--) {
            if (binaryString[i] === "1") {
                cardIds.push(binaryString.length - 1 - i);
            }
        }
        return cardIds;
    }
    queryCardsPerX(px) {
        return this.deck_map[px];
    }
    async newAccount(addr) {
        const keys = keyGenAddr(this.babyjub, numBits, addr);
        this.sk = keys.sk;
        this.pk = [this.babyjub.F.toString(keys.pk[0]), this.babyjub.F.toString(keys.pk[1])];
        return [this.sk, this.pk];
    }
    async setAggregated_key(pk_x0, pk_y0, pk_x1, pk_y1, pk_x2, pk_y2) {
        const pkAlice = [this.babyjub.F.e(pk_x0), this.babyjub.F.e(pk_y0)];
        const pkBob = [this.babyjub.F.e(pk_x1), this.babyjub.F.e(pk_y1)];
        const pkCharlie = [this.babyjub.F.e(pk_x2), this.babyjub.F.e(pk_y2)];
        this.aggregated_key = keyAggregate(this.babyjub, [pkAlice, pkBob, pkCharlie]);
        this.aggregated_pkString = [this.babyjub.F.toString(this.aggregated_key[0]), this.babyjub.F.toString(this.aggregated_key[1])];
    }
}
//# sourceMappingURL=zkshuffle.js.map