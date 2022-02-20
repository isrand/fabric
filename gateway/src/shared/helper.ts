import { Logger } from '@nestjs/common';
import { Contract, Gateway, Wallet, Wallets } from 'fabric-network';
import * as fs from 'fs';
import * as path from 'path';
import { MESSAGE_NOTEXIST } from '../configurations/constants';

const logger = new Logger();

const buildCCPOrg = (networkConnectFile: string): Record<string, any> => {
  // load the common connection configuration file
  const ccpPath = path.resolve(__dirname, networkConnectFile);
  const fileExists = fs.existsSync(ccpPath);
  if (!fileExists) {
    logger.error(`no such file or directory: ${ccpPath}`);
  }
  const contents = fs.readFileSync(ccpPath, 'utf8');

  // build a JSON object from the file contents
  const ccp = JSON.parse(contents);

  logger.log(`Loaded the network configuration located at ${ccpPath}`);
  return ccp;
};

const caHostName = (ccp: Record<string, any>): any => {
  let CAHostName = '';
  let keyNotFound = true; // restric search to one key only
  for (const key in ccp.certificateAuthorities) {
    if (keyNotFound) {
      CAHostName = key;
      keyNotFound = false;
    }
  }
  return CAHostName;
};

const mspid = (ccp: Record<string, any>): string => {
  let MSPID = '';
  let keyNotFound = true; // restric search to one key only
  for (const key in ccp.organizations) {
    if (keyNotFound) {
      MSPID = ccp.organizations[key].mspid;
      keyNotFound = false;
    }
  }
  logger.log(MSPID);
  return MSPID;
};

const buildWallet = async (walletPath: string): Promise<Wallet> => {
  // Create a new  wallet : Note that wallet is for managing identities.
  let wallet: Wallet;
  if (walletPath) {
    wallet = await Wallets.newFileSystemWallet(
      path.join(process.cwd(), walletPath),
    );
    logger.log(`Built a file system wallet at ${walletPath}`);
  } else {
    wallet = await Wallets.newInMemoryWallet();
    logger.log('Built an in memory wallet');
  }
  return wallet;
};

const prettyJSONString = (inputString: string): string => {
  if (inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
  }
  return inputString;
};

const connectionOptions = (userEnrollmentId: string, wallet: Wallet): any => {
  const connectionOptionsObj = {
    identity: userEnrollmentId,
    wallet,
    discovery: { enabled: true, asLocalhost: false },
  };
  return connectionOptionsObj;
};

const getContractAux = async (
  dto: any,
  configService: any,
): Promise<Contract> => {
  let responseMessage = '';
  // load the network configuration
  const confFile = configService.get('networkConnectFile');
  // load the network configuration
  const ccp = buildCCPOrg(confFile);

  // Create a new file system based wallet for managing identities.
  const wallet = await buildWallet(configService.get('walletPath'));

  // Check to see if we've already enrolled the user.
  const identity = await wallet.get(dto.userEnrollmentId);
  if (!identity) {
    logger.error(`${dto.userEnrollmentId},${MESSAGE_NOTEXIST}`);
    responseMessage = `${dto.userEnrollmentId},${MESSAGE_NOTEXIST}`;
    throw Error(responseMessage);
  }

  // Create a new gateway for connecting to our peer node.
  const gateway = new Gateway();
  await gateway.connect(ccp, connectionOptions(dto.userEnrollmentId, wallet));

  // Get the network (channel) our contract is deployed to.
  const network = await gateway.getNetwork(dto.channelName);

  // Get the contract from the network.
  const contract = network.getContract(dto.chaincodeId);

  return contract;
};

export {
  buildCCPOrg,
  buildWallet,
  prettyJSONString,
  caHostName,
  mspid,
  connectionOptions,
  getContractAux,
};
