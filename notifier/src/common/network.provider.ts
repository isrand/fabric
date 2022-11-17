import * as grpc from '@grpc/grpc-js';
import { connect, Gateway, Identity, Network, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { Configuration } from '../config/Configuration';

export class NetworkProvider {

	public constructor(private readonly channelName: string) { }

	public getNetwork(): Network {
		const gateway: Gateway = this.getGateway();

		return gateway.getNetwork(this.channelName);
	}

	private getGateway(): Gateway {
		return connect({
			client: this.createGrpcClient(),
			identity: this.createIdentity(),
			signer: this.createSigner()
		})
	}

	private createGrpcClient(): grpc.Client {
		const peerTLSRootCertificate = fs.readFileSync(Configuration.peerTLSRootCertificatePath);
		const tlsCredentials = grpc.credentials.createSsl(peerTLSRootCertificate);
		
		return new grpc.Client(Configuration.peerEndpoint, tlsCredentials);
	}

	private createIdentity(): Identity {
		return {
			credentials: fs.readFileSync(Configuration.adminSigncertPath),
			mspId: Configuration.mspID
		};
	}

	private createSigner(): Signer {
		const privateKey = crypto.createPrivateKey(fs.readFileSync(Configuration.adminPrivateKeyPath));

		return signers.newPrivateKeySigner(privateKey);
	}
}
