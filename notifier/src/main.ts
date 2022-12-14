import { NetworkProvider } from './common/network.provider';
import { Configuration } from './config/Configuration';
import { Network } from '@hyperledger/fabric-gateway';
import { WebSocketServer } from 'ws';
import { BlockAndPrivateDataDecoder } from './common/block-decoder/BlockAndPrivateDataDecoder';
import { Block } from './common/block-decoder/interfaces/Block';

interface Response {
  block: Block;
  privateDataMap?: any;
}
async function start() {
  console.log('Initializing WebSocket Server...');
  const wss = new WebSocketServer({ port: 8080 });
  console.log('WebSocket Server initialized.');

  wss.on('connection', async function connection(ws) {
    console.log('Handling WebSocket connection.');
    const network: Network = new NetworkProvider(Configuration.channel).getNetwork();
    const blockEvents = await network.getBlockAndPrivateDataEvents();

    console.log('Listening for Blockchain events.');
    for await (const block of blockEvents) {
      const decodedBlock = new BlockAndPrivateDataDecoder(block).decode();

      let response: Response = {
        block: decodedBlock.block
      };
      if (decodedBlock.privateDataMap) {
        response.privateDataMap = JSON.parse(JSON.stringify([...decodedBlock.privateDataMap]))
      }
      console.log(JSON.stringify(response, null, 2));

      ws.send(JSON.stringify(response, null, 2));
    }
  });
}

start();
