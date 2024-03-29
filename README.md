# Hyperledger Fabric POC Network

![Components 2.4.7](https://img.shields.io/badge/Hyperledger_Fabric-2.4.7-green?style=flat-square)

This repository contains a minimal Hyperledger Fabric Network with extra components to quickly develop and validate a proof of concept.

# **Setup**

## Dependencies

To simplify dependency management it is recommended that you install [Homebrew](http://brew.sh).

To be able to deploy the network you will need:

* [docker](https://docker.com) (`brew cask install docker`)
* [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) (`brew install kubectl`)
* [helm](https://helm.sh) (`brew install helm`)
* [nodejs](https://nodejs.org) (`brew install node`)
* [wget](https://www.gnu.org/software/wget/) (`brew install wget`)

You will also need to install the NPM packages for the gateway and notifier microservices:

```bash
cd gateway && npm install
cd -
cd notifier && npm install
cd -
```

# **Configuration**

## Peer

### State Database

You can choose between *goleveldb* or *couchdb* as the peer's ledger state database. To deploy a *couchdb* instance for the peer, add the `--couchdb` flag when calling the `network` script. The default state database is *goleveldb*.

# **Installation**

Run the following commands from this folder:

## Main components — Minimal network

```bash
./scripts/network
./scripts/chaincode
./scripts/gateway
```


## Optional components

```
./scripts/notifier
```

# **Transacting**

Once all the containers are up and running you can access each Gateway's Swagger UI to perform transactions through it. To do so, run:

```
kubectl port-forward deployment/fabric-gateway-org1 -n fabric 4000:4000 &
kubectl port-forward deployment/fabric-gateway-org2 -n fabric 4001:4000 &
```

and open http://localhost:4000/swagger on your web browser for Org1, and http://localhost:4001/swagger for Org2.

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


# **Real-time notifications**

To get real-time notifications when a new block is added to the network you need to deploy the `notifier` microservice. One instance is deployed per organization. The microservice exposes the port `8080` as a WebSocket Server, and can accept incoming WebSocket connections. A minimal working example of an application can be found in `/notifier/test.js`.

To test the service you can run:

```
kubectl port-forward deployment/notifier-org1 -n fabric 8080:8080 &
node notifier/client.js
```