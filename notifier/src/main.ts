import { NetworkProvider } from './common/network.provider';
import { Configuration } from './config/Configuration';
import { Network } from '@hyperledger/fabric-gateway';
import { WebSocketServer } from 'ws';
import { BlockDecoder } from './common/block/BlockDecoder';

async function start() {
  console.log('Initializing WebSocket Server...');
  const wss = new WebSocketServer({ port: 8080 });
  console.log('WebSocket Server initialized.');

  wss.on('connection', async function connection(ws) {
    console.log('Handling WebSocket connection.');
    const network: Network = new NetworkProvider(Configuration.channel).getNetwork();
    const blockEvents = await network.getBlockEvents();

    console.log('Listening for Blockchain events.');
    for await (const block of blockEvents) {
      const decodedBlock = BlockDecoder.decode(block);
      console.log(JSON.stringify(decodedBlock, null, 2));

      ws.send(JSON.stringify(decodedBlock, null, 2));
    }
  });
}

start();
