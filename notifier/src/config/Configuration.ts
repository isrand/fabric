export class Configuration {
	public static readonly peerTLSRootCertificatePath = String(process.env.PEER_TLS_ROOT_CERT_PATH);
	public static readonly organizationName = String(process.env.ORGANIZATION_NAME);
	public static readonly mspID = String(process.env.MSP_ID);
	public static readonly peerEndpoint = String(process.env.PEER_ENDPOINT);

	public static readonly adminPrivateKeyPath = String(process.env.ADMIN_PRIVATEKEY_PATH);
	public static readonly adminSigncertPath = String(process.env.ADMIN_SIGNCERT_PATH);

	public static readonly channel = String(process.env.CHANNEL_NAME);
}