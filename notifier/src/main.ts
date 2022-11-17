import { NetworkProvider } from './common/network.provider';
import { Configuration } from './config/Configuration';
import { Network } from '@hyperledger/fabric-gateway';
import { WebSocketServer } from 'ws';
import { BlockDecoder } from './common/block.decoder';

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
      const decodedBlock = new BlockDecoder(block).decode();
      console.log(`Received new block. Block number ${decodedBlock.blockNum}`);

      ws.send(JSON.stringify(decodedBlock, null, 2));
    }
  });
}

start();
