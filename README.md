# Hyperledger Fabric POC Network

![Components 2.4.7](https://img.shields.io/badge/Hyperledger_Fabric-2.4.7-green?style=flat-square) ![Explorer 1.1.8](https://img.shields.io/badge/Hyperledger_Explorer-1.1.8-blue?style=flat-square)

This repository contains a minimal Hyperledger Fabric Network with extra components to quickly develop and validate a proof of concept.

# Setup

## Dependencies

To simplify dependency management it is recommended that you install [Homebrew](http://brew.sh).

To be able to deploy the network you will need:

* [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) (`brew install kubectl`)
* [helm](https://helm.sh) (`brew install helm`)

Furthermore, if you want to develop new features or expand upon this boilerplate you will need:

* [nodejs](https://nodejs.org) (`brew install node`)


## Aliases

To be able to deploy the network with just a couple of scripts it is recommended that you run the following in your terminal session:

```bash
alias chaincode=./scripts/chaincode
alias gateway=./scripts/gateway
alias network=./scripts/network
```

# Installation

If you have set the previous aliases in your terminal session, you can deploy all components by running:

```bash
network && chaincode && gateway
```

Once all the containers are up and running you can access each Gateway's Swagger UI to perform transactions through it. To do so, run:

```
kubectl port-forward deployment/fabric-gateway-org1 -n fabric 4000:4000 &
kubectl port-forward deployment/fabric-gateway-org2 -n fabric 4001:4000 &
```

and open http://localhost:4000/swagger on your web browser for Org1, and http://localhost:4001/swagger for Org2.

# Transacting

## Organization 1

From Org1's Gateway you can initialize the ledger and add sample data. Expand the `/invoke` menu, click "Try it out" and paste the following in the request body:

```
{
  "channel": "test-channel",
  "chaincode": "asset-transfer-chaincode",
  "function": "initLedger",
  "params": []
}
```

Click `Execute` and wait for a couple of seconds. You can check the `peer-org1` logs to see the process. After the new block gets added to the chain you will receive the response:

```
{
  "blockNumber": <block_number>,
  "transactionId": "b91860f7fe4e6f8c4e26c97d55844b65938483345d556c1bed833f1a4bc368f4",
  "status": "VALID"
}
```

## Organization 2

Once you get a response back you can open Org2's Gateway page, expand the `/query` menu, click "Try it out" and execute the following request:

```
{
  "channel": "test-channel",
  "chaincode": "asset-transfer-chaincode",
  "function": "GetAllAssets",
  "params": []
}
```

You will receive an array of elements that were added to the chain with the ledger initialization:

```
{
  "payload": [
    {
      "Key": "candy",
      "Record": {
        "ID": "candy",
        "Weight": "0.1kg",
        "Flavour": "Sweet",
        "LastRecordedStation": "Lisbon",
        "AppraisedValue": "300$",
        "docType": "asset"
      }
    },
    {
      "Key": "carrots",
      "Record": {
        "ID": "carrots",
        "Weight": "2kg",
        "Flavour": "Sweet",
        "LastRecordedStation": "Rotterdam",
        "AppraisedValue": "700$",
        "docType": "asset"
      }
    },
		...
	]
}
```
