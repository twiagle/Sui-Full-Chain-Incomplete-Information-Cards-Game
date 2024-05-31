import { useEffect, useMemo, useState, useContext } from 'react';
import { Spin } from "antd";
import { useCurrentAccount, useSignAndExecuteTransactionBlock, useSuiClient } from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import Message from '../../components/Message';
import useSetLocation from '../../utils/use-set-location';
import { SetRoleContext } from '../../utils/use-set-role';
import { GAME_PACKAGE_ID, PLAYER_WAITLIST_ID, STATE_MANAGER_MODULE, JOIN_GAME } from "../../utils/constants"
// import { buildBabyjub } from 'circomlibjs-0-1-7';
import './style.css'

const Home = () => {
  const { mutate: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock();
  const [disabled, setDisabled] = useState(false);
  const setLocation = useSetLocation();

  const { role, setRole } = useContext(SetRoleContext);
  const [isLoading, setIsloading] = useState(false)
  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  // useEffect(

  //   () => {
  //     // console.log("sddf")
  //     const bb = async () => {
  //       const b = await buildBabyjub();
  //       b.mulPointEscalar(b.Base8, 1);
  //       window.console.log()
  //     };
  //     bb();
  //   }, []);

  const handleSubmit = (selected_role) => {
    if (!account) {
      alert("connect wallet first");
      return
    }
    setRole(selected_role);
    setDisabled(true);
    setIsloading(true);

    // setLocation("/game");
    const txb = new TransactionBlock();
    txb.moveCall({
      arguments: [txb.object(PLAYER_WAITLIST_ID), txb.pure.u64(selected_role)],
      target: JOIN_GAME,
    });

    signAndExecuteTransactionBlock(
      {
        transactionBlock: txb,
        options: {
          // We need the effects to get the objectId of the created counter object
          showEffects: true,
        },
      },
      {
        onSuccess: (tx) => {
          suiClient
            .waitForTransactionBlock({
              digest: tx.digest,
            })
            .then(() => {
              setLocation("/game");
            })
        },
      },
    );
    setIsloading(false);
    setDisabled(false);

  }

  return (
    <div className='home-page-component'>
      <br />
      <br />
      <br />
      <br />
      <div className='title'> Landlord and Farmer</div>

      <br />
      <br />
      <br />
      <br />
      <Spin spinning={isLoading}>
        {!account ? ('please connect your wallet') : (
          <div style={{ marginTop: 21, textAlign: 'center' }}>
            <button className='lan-button' disabled={disabled} onClick={() => handleSubmit(0)}>
              Landlord
            </button>
            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <button className='lv-button' disabled={disabled} onClick={() => handleSubmit(1)}>
              Farmer
            </button>
          </div>
        )}

      </Spin>
    </div>
  );
};

export default Home;
