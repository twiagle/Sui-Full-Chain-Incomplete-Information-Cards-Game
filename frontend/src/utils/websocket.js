import { SuiClient, getFullnodeUrl, SuiHTTPTransport } from "@mysten/sui.js/client";
import { WebSocket } from "ws";

const WSS_URL = getFullnodeUrl('testnet');
// const SUI_WSS_CLIENT = new SuiClient({ url: WSS_URL });
const SUI_WSS_CLIENT = new SuiClient({
  transport: new SuiHTTPTransport({
    url: getFullnodeUrl("mainnet"),
    // The typescript definitions may not match perfectly, casting to never avoids these minor incompatibilities
    WebSocketConstructor: WebSocket,
  }),
});
async function subscribeEvent() {
  let unsubscribe = await SUI_WSS_CLIENT.subscribeEvent({
    filter: {
      Package: "0x02ed3badce1cd4d7a129a10ce003bcf88aee6fca79461bf2eea0f3e0a4f3338c"
      // MoveEventModule: {
      //     module: "swap",
      //     package: "0x1b9c1b49f075584c3c35284ef30df5cddff6a0b52457dcf6ab8a9fc915904251"
      // },
    },
    onMessage: (event) => {
      console.log("Got Event");
      console.log(`    Transaction Digest: ${event.id.txDigest}`);
      console.log(`    Package ID: ${event.packageId}`);
      console.log(`    Event Sequence: ${event.id.eventSeq}`);
      console.log(`    Transaction Module: ${event.transactionModule}`);
      console.log(`    Sender: ${event.sender}`);
      console.log(`    Type: ${event.type}`);
      console.log(`    Parsed JSON: ${JSON.stringify(event.parsedJson)}`);
      console.log(`    BCS: ${event.bcs}`);
      console.log(`    Timestamp: ${event.timestampMs}`);
    },
  });

  process.on("SIGINT", async () => {
    console.log("Interrupted...");
    if (unsubscribe) {
      await unsubscribe();
    }
    process.exit();
  });
}
