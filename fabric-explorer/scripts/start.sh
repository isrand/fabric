#!/bin/bash

export EXPLORER_PATH=$(pwd)

function start_hyperledger_fabric_block_explorer_database() {
  kubectl create -f $EXPLORER_PATH/kubernetes/explorer-database.yaml -n $NAMESPACE
}

function setup_hyperledger_fabric_block_explorer_database() {
  pod=$(kubectl get pods -n $NAMESPACE | grep blockchain-explorer-db | awk '{print $1}')
  kubectl exec $pod -n $NAMESPACE -- /bin/bash -c "
  mkdir -p /fabric/config/explorer/db/;
  mkdir -p /fabric/config/explorer/app/;
  cd /fabric/config/explorer/db/;
  wget https://raw.githubusercontent.com/hyperledger/blockchain-explorer/master/app/persistence/fabric/postgreSQL/db/createdb.sh;
  wget https://raw.githubusercontent.com/hyperledger/blockchain-explorer/master/app/persistence/fabric/postgreSQL/db/explorerpg.sql;
  wget https://raw.githubusercontent.com/hyperledger/blockchain-explorer/master/app/persistence/fabric/postgreSQL/db/processenv.js;
  wget https://raw.githubusercontent.com/hyperledger/blockchain-explorer/master/app/persistence/fabric/postgreSQL/db/updatepg.sql;
  apk update;
  apk add jq;
  apk add nodejs;
  apk add sudo;
  rm -rf /var/cache/apk/*;
  chmod +x ./createdb.sh;
  ./createdb.sh;
  "
}

function start_hyperledger_fabric_block_explorer() {
  kubectl create -f $EXPLORER_PATH/kubernetes/explorer.yaml -n $NAMESPACE
}

start_hyperledger_fabric_block_explorer_database
sleep 5;
setup_hyperledger_fabric_block_explorer_database
start_hyperledger_fabric_block_explorer