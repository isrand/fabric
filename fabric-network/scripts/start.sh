#!/bin/bash

# FABRIC_NETWORK_PATH is pwd because this script will always be ran from the fabric-network root folder, NEVER
# from within the /scripts folder
export FABRIC_NETWORK_PATH=$(pwd)

create_org_cli() {
  ORG_NUMBER=$1
  sed 's/{NUMBER}/'"$ORG_NUMBER"'/g' $FABRIC_NETWORK_PATH/kubernetes/cli.yaml > $FABRIC_NETWORK_PATH/kubernetes/cli.org$ORG_NUMBER.yaml
  kubectl create -f $FABRIC_NETWORK_PATH/kubernetes/cli.org$ORG_NUMBER.yaml -n $NAMESPACE
  rm $FABRIC_NETWORK_PATH/kubernetes/cli.org$ORG_NUMBER.yaml
}

create_org_peer() {
  ORG_NUMBER=$1
  sed 's/{NUMBER}/'"$ORG_NUMBER"'/g' $FABRIC_NETWORK_PATH/kubernetes/peer.yaml > $FABRIC_NETWORK_PATH/kubernetes/peer.org$ORG_NUMBER.yaml
  kubectl create -f $FABRIC_NETWORK_PATH/kubernetes/peer.org$ORG_NUMBER.yaml -n $NAMESPACE
  rm $FABRIC_NETWORK_PATH/kubernetes/peer.org$ORG_NUMBER.yaml
}

create_hlf_components() {
  kubectl create -f $FABRIC_NETWORK_PATH/kubernetes/orderer.yaml -n $NAMESPACE;
  create_org_cli 1
  create_org_peer 1
  create_org_cli 2
  create_org_peer 2
}

create_channel() {
  CLI_PEER_1_POD_NAME=$(kubectl get pods -l component=cli-peer0-org1 -o jsonpath='{.items[*].metadata.name}' -n $NAMESPACE)
  kubectl exec $CLI_PEER_1_POD_NAME -n $NAMESPACE -- bash -c "cd /tmp && peer channel create -o orderer:7050 -c mychannel -f /shared/mychannel.tx"
}

join_channel_org1() {
  CLI_PEER_1_POD_NAME=$(kubectl get pods -l component=cli-peer0-org1 -o jsonpath='{.items[*].metadata.name}' -n $NAMESPACE)
  kubectl exec $CLI_PEER_1_POD_NAME -n $NAMESPACE -- bash -c "cd /tmp && peer channel fetch newest -o orderer:7050 -c mychannel"
  kubectl exec $CLI_PEER_1_POD_NAME -n $NAMESPACE -- bash -c "cd /tmp && peer channel join -b mychannel_newest.block"
}

join_channel_org2() {
  CLI_PEER_2_POD_NAME=$(kubectl get pods -l component=cli-peer0-org2 -o jsonpath='{.items[*].metadata.name}' -n $NAMESPACE)
  kubectl exec $CLI_PEER_2_POD_NAME -n $NAMESPACE -- bash -c "cd /tmp && peer channel fetch newest -o orderer:7050 -c mychannel"
  kubectl exec $CLI_PEER_2_POD_NAME -n $NAMESPACE -- bash -c "cd /tmp && peer channel join -b mychannel_newest.block"
}

set_anchor_peer_org1() {
  CLI_PEER_1_POD_NAME=$(kubectl get pods -l component=cli-peer0-org1 -o jsonpath='{.items[*].metadata.name}' -n $NAMESPACE)
  kubectl cp $FABRIC_NETWORK_PATH/scripts/anchor_peer_org1.sh $NAMESPACE/$CLI_PEER_1_POD_NAME:/tmp/anchor_peer.sh
  kubectl exec $CLI_PEER_1_POD_NAME -n $NAMESPACE -- bash -c "cd /tmp && sh anchor_peer.sh"
}

set_anchor_peer_org2() {
  CLI_PEER_2_POD_NAME=$(kubectl get pods -l component=cli-peer0-org2 -o jsonpath='{.items[*].metadata.name}' -n $NAMESPACE)
  kubectl cp $FABRIC_NETWORK_PATH/scripts/anchor_peer_org2.sh $NAMESPACE/$CLI_PEER_2_POD_NAME:/tmp/anchor_peer.sh
  kubectl exec $CLI_PEER_2_POD_NAME -n $NAMESPACE -- bash -c "cd /tmp && sh anchor_peer.sh"
}

# Spin up the HLF components
create_hlf_components
kubectl wait --timeout=180s --for=condition=Ready -n $NAMESPACE pods --all;

create_channel
sleep 20;
join_channel_org1
join_channel_org2
sleep 5;
set_anchor_peer_org1
set_anchor_peer_org2