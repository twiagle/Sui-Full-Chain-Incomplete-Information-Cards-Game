import { useState } from 'react';
import { useImmer } from 'use-immer';
import PokerList from '../../../components/PokerList';
import { useSignAndExecuteTransactionBlock, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { GAME_PACKAGE_ID, PLAYER_WAITLIST_ID, STATE_MANAGER_MODULE, PLAYER_EVENT, REGISTRATION_EVENT, REGISTE_PK, SHUFFLE_CARDS, DEAL_CARDS, DROP_CARDS } from "../../../utils/constants"
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { bcs } from "@mysten/sui.js/bcs";
import { setCardIdsToUint8 } from "../../../utils/poker"

const Operation = (props) => {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock();

  const { game, seat } = props;
  const [selectedCards, setSelectedCards] = useImmer([]);
  const [disabled, setDisabled] = useState(false);

  const handleClick = (cards) => () => {
    setDisabled(true);
    window.console.log(cards);
    const txb = new TransactionBlock();
    const vk_bytes = bcs.vector(bcs.u8()).serialize(new Uint8Array(1));
    const public_inputs_bytes = bcs.vector(bcs.u8()).serialize(new Uint8Array(1));
    const proof_points_bytes = bcs.vector(bcs.u8()).serialize(new Uint8Array(1));
    txb.moveCall({
      arguments: [
        txb.object(game.roomStateId),
        txb.pure(setCardIdsToUint8(cards)),
        txb.pure(vk_bytes),
        txb.pure(public_inputs_bytes),
        txb.pure(proof_points_bytes),],
      target: DROP_CARDS,
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
            }).catch((error) => {
              window.console.log("regi pk fail", error);
            })
        },
      },
    );
    setDisabled(false);

  };
  return (
    <div style={{ height: 30 + 88 }}>
      <div style={{ height: 30, margin: '0 24px', fontSize: 18 }}>
        {game.state === 2 && (
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <button
              className='room-operation-main'
              disabled={disabled || selectedCards.length === 0 || game.turn !== seat}
              onClick={handleClick(selectedCards)}
            >
              drop
            </button>
            <button
              disabled={disabled || game.turn !== seat}
              onClick={handleClick([])}
            >
              hold
            </button>
          </div>
        )}
      </div>
      <PokerList
        height={70}
        ids={game.my}
        selected={selectedCards}
        setSelected={setSelectedCards}
      />
    </div>
  );
};

export default Operation;
