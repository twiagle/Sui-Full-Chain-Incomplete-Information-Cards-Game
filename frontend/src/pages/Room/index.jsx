/* global BigInt */
import { useEffect, useState, useCallback, useContext, useRef } from 'react';
import { useImmer } from 'use-immer';
import Message from '../../components/Message';
import { SetRoleContext } from '../../utils/use-set-role';
import GamingRoom from './GamingRoom';
import WaitingRoom from './WaitingRoom';
// import useSetLocation from '../../utils/use-set-location';
import { useSignAndExecuteTransactionBlock, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { GAME_PACKAGE_ID, PLAYER_WAITLIST_ID, STATE_MANAGER_MODULE, PLAYER_EVENT, REGISTRATION_EVENT, REGISTE_PK, SHUFFLE_CARDS, DEAL_CARDS, DROP_CARDS, ROOM_STATE_ID } from "../../utils/constants"
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { getCardIdsFromUint8 } from '../../utils/poker';
import { bcs } from "@mysten/sui.js/bcs";
import { ZKShuffle } from "ddz_crypto_sdk/dist.esm/index.js";
const Waiting = 0;
const Regist = 2; // send pk
const Shuffle = 3;
const Deal = 4;
const Open = 5;
const Drop = 6;
const See = 7;

const Room = () => {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock();

  // local UI show
  const { role, setRole } = useContext(SetRoleContext);

  const [seat, setSeat] = useState(1); // lord=1, farmer=2/3

  const [room, setRoom] = useImmer({
    players: [null, null, null],
    state: Waiting,
  });

  const [game, setGame] = useImmer(() => ({
    roomStateId: 0x0,
    state: -1,
    held: [0, 0, 0],
    used: [],
    last: [[], [], []],
    my: [],
    revealed: [],
    total: 0,
    landlord: null,
    top: null,
    turn: null,
  }));

  const zkShuffle = useRef(null);
  // const initZkShuffle = useCallback(async () => {
  //   // await buildBabyjub();
  //   const zkShuffle = new ZKShuffle();
  //   await zkShuffle.init();
  //   const [sk, pk, pkString] = await zkShuffle.newAccount();
  //   setPlayer({ sk: sk, pk: pk, pkString: pkString })
  // }, []);

  // const zkShuffle = initZkShuffle();
  useEffect(
    () => {
      if (!account) {
        alert("connect wallet first");
        return;
      }
      window.console.log("sddf");
      const bb = async () => {
        // await buildBabyjub();
        zkShuffle.current = new ZKShuffle();
        await zkShuffle.current.init();
        await zkShuffle.current.newAccount(account.address);
      }
      bb();
    }, [account]);


  const get_on_chain_deck = async (room_state_id) => {
    const objectId = room_state_id;
    const objectInfo = await suiClient.getObject({
      id: objectId,
      options: { showDisplay: true, showType: true, showContent: true }
    });
    const deck = objectInfo.data.content.fields.card_deck.fields;
    window.console.log(typeof deck.X0.map((str) => BigInt(str))[0]);
    const compressedDeck = {
      X0: deck.X0.map((str) => BigInt(str)),
      X1: deck.X1.map((str) => BigInt(str)),
      Y0: deck.Y0.map((str) => BigInt(str)),
      Y1: deck.Y1.map((str) => BigInt(str)),
      selector: [BigInt(deck.selector0), BigInt(deck.selector1)]
    };
    // window.console.log(compressedDeck);
    return compressedDeck
  }

  const registe_pk = (roomStateId, to_addr) => {
    window.console.log("registe_pk", zkShuffle.current.pk[0]);
    const txb = new TransactionBlock();
    txb.moveCall({
      arguments: [
        txb.object(roomStateId),
        txb.pure(bcs.string().serialize(zkShuffle.current.pk[0])),
        txb.pure(bcs.string().serialize(zkShuffle.current.pk[1])),
      ],
      target: REGISTE_PK,
    });
    signAndExecuteTransactionBlock(
      {
        transactionBlock: txb,
      },
      {
        onSuccess: (tx) => {
          suiClient
            .waitForTransactionBlock({ digest: tx.digest, })
            .then((result) => {
              window.console.log("regi pk success", result);
              for (let i = 0; i < to_addr.length; i++) {
                setRoom((room) => {
                  room.players[i] = { "name": to_addr[i].slice(0, 6) };
                });
                if (to_addr[i] === account.address) {
                  setSeat(i);
                };
              }
            }).catch((error) => {
              window.console.log("regi pk fail", error);
            })
        },
      },
    );
  }

  const shuffleCards = async (room_state_id) => {
    const compressedDeck = await get_on_chain_deck(room_state_id);
    window.console.log("shuffleEncryptCards");
    const shuffled_deck = await zkShuffle.current.shuffleEncryptCards(compressedDeck);
    window.console.log(shuffled_deck);
    await push_compressed_card(room_state_id, shuffled_deck);
  }

  const push_compressed_card = async (room_state_id, shuffled_deck) => {
    const X0 = shuffled_deck.X0.map((bigint) => bigint.toString());
    const X1 = shuffled_deck.X1.map((bigint) => bigint.toString());
    const selector0 = shuffled_deck.selector[0];
    const selector1 = shuffled_deck.selector[1];
    window.console.log(X0);
    window.console.log(typeof selector0);
    // rust backend
    const vk_bytes = bcs.vector(bcs.u8()).serialize(new Uint8Array(1));
    const public_inputs_bytes = bcs.vector(bcs.u8()).serialize(new Uint8Array(1));
    const proof_points_bytes = bcs.vector(bcs.u8()).serialize(new Uint8Array(1));
    window.console.log(typeof shuffled_deck.X1);
    window.console.log(typeof shuffled_deck.X1[0]);
    // contract
    const txb = new TransactionBlock();
    txb.moveCall({
      arguments: [
        txb.object(room_state_id),
        txb.pure(X0),
        txb.pure(X1),
        txb.pure(selector0),
        txb.pure(selector1),
        txb.pure(vk_bytes),
        txb.pure(public_inputs_bytes),
        txb.pure(proof_points_bytes),
      ],
      target: SHUFFLE_CARDS,
    });
    signAndExecuteTransactionBlock(
      {
        transactionBlock: txb,
      },
      {
        onSuccess: (tx) => {
          suiClient
            .waitForTransactionBlock({ digest: tx.digest, })
            .then((result) => {
              window.console.log("push success", result);
            }).catch((error) => {
              window.console.log("push success fail", error);
            })
        },
      },
    );
  }

  const dealCards = async (room_state_id, cards, isFirstDecryption) => {
    const compressedDeck = await get_on_chain_deck(room_state_id);
    window.console.log(compressedDeck);
    const onchain_deck = await zkShuffle.current.dealCards(compressedDeck, BigInt(cards), isFirstDecryption);
    window.console.log("push_onchain_card");
    window.console.log(onchain_deck);
    await push_onchain_card(room_state_id, onchain_deck);
  }

  const push_onchain_card = async (room_state_id, onchain_deck) => {
    const X0 = onchain_deck.X0.map((bigint) => bigint.toString());
    const X1 = onchain_deck.X1.map((bigint) => bigint.toString());
    const Y0 = onchain_deck.Y0.map((bigint) => bigint.toString());
    const Y1 = onchain_deck.Y1.map((bigint) => bigint.toString());
    // window.console.log(X0);
    // window.console.log(Y0);
    // window.console.log(X1);
    // window.console.log(Y1);
    // rust backend
    const vk_bytes = bcs.vector(bcs.u8()).serialize(new Uint8Array(1));
    const public_inputs_bytes = bcs.vector(bcs.u8()).serialize(new Uint8Array(1));
    const proof_points_bytes = bcs.vector(bcs.u8()).serialize(new Uint8Array(1));
    // contract
    const txb = new TransactionBlock();
    txb.moveCall({
      arguments: [
        txb.object(room_state_id),
        txb.pure(X0),
        txb.pure(Y0),
        txb.pure(X1),
        txb.pure(Y1),
        txb.pure(vk_bytes),
        txb.pure(public_inputs_bytes),
        txb.pure(proof_points_bytes),
      ],
      target: DEAL_CARDS,
    });
    signAndExecuteTransactionBlock(
      {
        transactionBlock: txb,
      },
      {
        onSuccess: (tx) => {
          suiClient
            .waitForTransactionBlock({ digest: tx.digest, })
            .then((result) => {
              window.console.log("push success", result);
            }).catch((error) => {
              window.console.log("push success fail", error);
            })
        },
      },
    );
  }

  const openOffchain = async (room_state_id, cards) => {
    const compressedDeck = await get_on_chain_deck(room_state_id);
    const onchain_deck = await zkShuffle.current.openOffchain(compressedDeck, BigInt(cards));
    const my = onchain_deck.map((o) => o.idx);
    window.console.log(my);

    setGame((game) => {
      game.landlord = 0;
      game.total = 52;
      game.held = [20, 16, 16];
      game.my = my;
      game.state = 2;
      game.top = -1;
      game.turn = seat;
      game.last = [[], [], []];

      game.roomStateId = room_state_id;
    });
    setRoom((room) => {
      room.state = 1;
    });
  }

  const dropCards = async (room_state_id) => {
    setGame((game) => {
      if (game.turn === -1) {
        game.turn = seat;
      } else {
        game.top = game.turn;
        game.turn = seat;
      }
    })
  }
  const seeDropedCards = async (addr, cards) => {
    const ids = getCardIdsFromUint8(cards);
    // const new_my = game.my.filter((card) => !(card.toString() in cards));
    window.console.log(game.my);
    window.console.log(cards);
    window.console.log(ids);
    // setGame((game) => {
    //   game.last[game.turn] = ids;
    //   if (game.turn === seat) {
    //     game.my = new_my;
    //   } else {
    //     game.top = game.turn;
    //     game.turn = (game.turn + 1) % 3;
    //   }
    // });
  }

  const processPlayerEvent = (event) => {
    if (!account) {
      alert("connect wallet first");
      return
    }
    const room_state_id = event.parsedJson.room_state_id;
    const to_addr = event.parsedJson.to_addr;
    const action = event.parsedJson.action;
    const cards = event.parsedJson.cards;
    const is_first_decryption = event.parsedJson.is_first_decryption;

    window.console.log(to_addr, account.address);
    // broadcast
    switch (action) {
      case Regist:
        registe_pk(room_state_id, to_addr);
        return;
      case See:
        seeDropedCards(to_addr, cards);
        return;
      default:
    }
    // private instruction
    if (to_addr.includes(account.address)) {
      switch (action) {
        case Shuffle:
          shuffleCards(room_state_id);
          break;
        case Deal:
          dealCards(room_state_id, cards, is_first_decryption);
          break;
        case Open:
          openOffchain(room_state_id, cards)
          break;
        case Drop:
          dropCards(room_state_id);
          break;
        default:
      }
    }
  }


  const processRegistrationEvent = (event) => {
    if (!account) {
      alert("connect wallet first");
      return
    }
    const pk_x0 = event.parsedJson.pk_x0;
    const pk_y0 = event.parsedJson.pk_y0;
    const pk_x1 = event.parsedJson.pk_x1;
    const pk_y1 = event.parsedJson.pk_y1;
    const pk_x2 = event.parsedJson.pk_x2;
    const pk_y2 = event.parsedJson.pk_y2;
    zkShuffle.current.setAggregated_key(pk_x0, pk_y0, pk_x1, pk_y1, pk_x2, pk_y2);
    window.console.log("aggkey", zkShuffle.current.aggregated_pkString);
  }

  // useEffect(() => {
  //   const subscribe = async () => {
  //     const unsubscribe = await suiClient.subscribeEvent({
  //       filter: {
  //         Package: GAME_PACKAGE_ID
  //         // MoveEventModule: {
  //         //   module: STATE_MANAGER_MODULE,
  //         //   package: GAME_PACKAGE_ID,
  //         // },
  //       },
  //       onMessage(event) {
  //         try {
  //           if (event.type === PLAYER_EVENT) {
  //             processPlayerEvent(event);
  //           } else if (event.type === REGISTRATION_EVENT) {
  //             processRegistrationEvent(event);
  //           }
  //         } catch (error) {
  //         }
  //       },
  //     });
  //   };
  //   subscribe();
  // }, []);
  const init_turn = () => {
    const to_addr = [
      "0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276",
      "0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6",
      "0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213"];
    for (let i = 0; i < to_addr.length; i++) {
      setRoom((room) => {
        room.players[i] = { "name": to_addr[i].slice(0, 6) };
      });
      if (to_addr[i] === account.address) {
        setSeat(i);
      };
    }
  }

  const testUI = (seat, addr) => {
    setSeat(1);

    setRoom((room) => {
      room.state = 1;
      room.players[0] = { "name": addr.slice(0, 6) };
      room.players[1] = { "name": addr.slice(0, 6) };
      room.players[2] = { "name": addr.slice(0, 6) };
    });
    setGame((game) => {
      // game.landlord = 1;
      game.my = [1, 2, 3];
      game.turn = 1;
      game.state = 2;
      game.held = [1, 2, 3];
      // game.used = [ // 本局已经出了的牌
      //   27,
      //   28,
      //   1,
      //   2,
      //   53,
      //   54,
      //   15,
      //   26,
      //   14,
      //   52,
      //   3,
      //   18,
      //   6,
      //   38,
      //   12
      // ];
      game.last = [ // 每个player上次出过的牌，
        [
          38,
          12
        ],
        [
          14,
          52
        ],
        [
          3,
          18,
          6
        ]
      ];
      game.top = 1;
    })
  }
  return (
    <>
      <button onClick={() => {
        processPlayerEvent({
          "parsedJson": {
            "action": 2,
            "cards": "0",
            "is_first_decryption": false,
            "room_state_id": ROOM_STATE_ID,
            "to_addr": [
              "0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213", // david
              "0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276", // clerlie
              "0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6", // bob
            ]
          }
        })
      }}>
        pk
      </button>
      <button onClick={() => {
        processRegistrationEvent({
          "parsedJson": {
            "pk_x0": "3934313667732623778996877368189959309832454575008386046848166362826565211099",
            "pk_x1": "17665929393873591561779895441508792330925964438206713965253103689655984491166",
            "pk_x2": "17102898322776700891468269181606217693028589758588402398328615253087861492697",
            "pk_y0": "4557945884114343619476854855433425392124300346918869402994815871631862753675",
            "pk_y1": "8387834084895853948615443556065273938832082178300039686989585072126915179120",
            "pk_y2": "91341696165872286493950953935016553250607560768376364314193154257943148723",
            "room_state_id": ROOM_STATE_ID,
            "to_addr": [
              "0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276",
              "0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6",
              "0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213"]
          }
        })
      }}>
        aggPK
      </button>
      <button onClick={() => {
        processPlayerEvent({
          "parsedJson": {
            "action": 3,
            "cards": "0",
            "is_first_decryption": false,
            "room_state_id": ROOM_STATE_ID,
            "to_addr": [
              "0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276", // clerlie
              "0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6", // bob
              "0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213", // davad
            ]
          }
        })
      }}>
        shuffle
      </button>
      <button onClick={() => {
        processPlayerEvent({
          "parsedJson": {
            "action": 4,
            "cards": "4503595332403200",
            "is_first_decryption": true,
            "room_state_id": ROOM_STATE_ID,
            "to_addr": [
              "0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276", // clerlie
              "0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6", // bob
              "0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213", // davad
            ]
          }
        })
      }}>
        deal 1p1
      </button>
      <button onClick={() => {
        processPlayerEvent({
          "parsedJson": {
            "action": 4,
            "cards": "4503595332403200",
            "is_first_decryption": false,
            "room_state_id": ROOM_STATE_ID,
            "to_addr": [
              "0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276", // clerlie
              "0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6", // bob
              "0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213", // davad
            ]
          }
        })
      }}>
        deal 1p2
      </button>
      <button onClick={() => {
        processPlayerEvent({
          "parsedJson": {
            "action": 4,
            "cards": "4294901760",
            "is_first_decryption": true,
            "room_state_id": ROOM_STATE_ID,
            "to_addr": [
              "0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276", // clerlie
              "0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6", // bob
              "0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213", // davad
            ]
          }
        })
      }}>
        deal 2p1
      </button>
      <button onClick={() => {
        processPlayerEvent({
          "parsedJson": {
            "action": 4,
            "cards": "4294901760",
            "is_first_decryption": false,
            "room_state_id": ROOM_STATE_ID,
            "to_addr": [
              "0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276", // clerlie
              "0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6", // bob
              "0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213", // davad
            ]
          }
        })
      }}>
        deal 2p2
      </button>
      <button onClick={() => {
        processPlayerEvent({
          "parsedJson": {
            "action": 4,
            "cards": "65535",
            "is_first_decryption": true,
            "room_state_id": ROOM_STATE_ID,
            "to_addr": [
              "0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276", // clerlie
              "0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6", // bob
              "0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213", // davad
            ]
          }
        })
      }}>
        deal 3p1
      </button>
      <button onClick={() => {
        processPlayerEvent({
          "parsedJson": {
            "action": 4,
            "cards": "65535",
            "is_first_decryption": false,
            "room_state_id": ROOM_STATE_ID,
            "to_addr": [
              "0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276", // clerlie
              "0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6", // bob
              "0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213", // davad
            ]
          }
        })
      }}>
        deal 3p2
      </button>
      <button onClick={() => {
        processPlayerEvent({
          "parsedJson": {
            "action": 5,
            "cards": "4503595332403200",
            "is_first_decryption": false,
            "room_state_id": ROOM_STATE_ID,
            "to_addr": [
              "0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276", // clerlie
              "0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6", // bob
              "0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213", // davad
            ]
          }
        })
      }}>
        open 1p
      </button>
      <button onClick={() => {
        processPlayerEvent({
          "parsedJson": {
            "action": 5,
            "cards": "4294901760",
            "is_first_decryption": false,
            "room_state_id": ROOM_STATE_ID,
            "to_addr": [
              "0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276", // clerlie
              "0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6", // bob
              "0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213", // davad
            ]
          }
        })
      }}>
        open 2p
      </button>
      <button onClick={() => {
        processPlayerEvent({
          "parsedJson": {
            "action": 5,
            "cards": "65535",
            "is_first_decryption": false,
            // "is_first_decryption": true,
            "room_state_id": ROOM_STATE_ID,
            "to_addr": [
              "0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276", // clerlie
              "0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6", // bob
              "0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213", // davad
            ]
          }
        })
      }}>
        open 3p
      </button>
      <button onClick={() => {
        processPlayerEvent({
          "parsedJson": {
            "action": 6,
            "cards": "",
            "is_first_decryption": false,
            "room_state_id": ROOM_STATE_ID,
            "to_addr": [
              "0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276", // clerlie
              "0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6", // bob
              "0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213", // davad
            ]
          }
        })
      }}>
        drop
      </button>
      <button onClick={() => {
        processPlayerEvent({
          "parsedJson": {
            "action": 7,
            "cards": "6",
            "is_first_decryption": false,
            "room_state_id": ROOM_STATE_ID,
            "to_addr": [account.address
              // "0xbd66e361051513ffd73d1b95d27b2f3eebf8de3ba5e907c3456e301c607bc276", // clerlie
              // "0x39ea3b2a390279050c1b9d72576693cb903c6a3aa48f00fc8d46f84dc20346b6", // bob
              // "0x9f14f7d2b2f03fe13401ac05560aa30f04363e140802fabad9faab33adc17213", // davad
            ]
          }
        })
      }}>
        see
      </button>

      <button onClick={() => {
        // testUI(1, "0x12345678")
        init_turn()
      }}>
        init_turn
      </button>
      {room.state === 0 ? (
        <>
          <button onClick={() => { testUI(0, "0x1234") }}>
            test UI
          </button>
          <WaitingRoom room={room} seat={seat} />
        </>
      ) : room.state === 1 ? (
        <GamingRoom room={room} game={game} seat={seat} />
      ) : null}
    </>
  );
};

export default Room;
