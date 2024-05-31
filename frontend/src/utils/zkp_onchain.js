
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import axios from 'axios';
import { bcs } from "@mysten/sui.js/bcs";

function base64_to_u8Array(base64String) {
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

const get_proof = async () => {

  const data = {
    api: 'suitest',
    names: ["in"],
    vals: [7],
  };

  let proof;
  await axios.post('http://127.0.0.1:3000/zkp', data)
    .then(response => {
      // console.log(response.data);
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

//entry public entry_withdraw<Ty0>(Arg0: &Clock, Arg1: &PriceOracle, Arg2: &mut Storage, Arg3: &mut Pool<Ty0>, Arg4: u8, Arg5: u64, Arg6: &mut Incentive, Arg7: &mut Incentive, Arg8: &mut TxContext)
const verify_onchin = async () => {
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
  console.time("get_proof");

  const proof = await get_proof()
  console.timeEnd("get_proof");
  // console.log(proof.vk_bytes);
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
  client.signAndExecuteTransactionBlock({ signer: keypair, transactionBlock: txb });
  console.timeEnd("verify_onchin");
}
