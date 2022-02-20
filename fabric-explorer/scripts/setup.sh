#!/bin/bash

export EXPLORER_PATH=$(pwd)

function create_explorer_config_pvc() {
  kubectl create -f $EXPLORER_PATH/kubernetes/storage/explorer-config.pvc.yaml -n $NAMESPACE
}

function create_explorer_crypto_config_pvc() {
  kubectl create -f $EXPLORER_PATH/kubernetes/storage/explorer-crypto-config.pvc.yaml -n $NAMESPACE
}

function create_explorer_database_pvc() {
  kubectl create -f $EXPLORER_PATH/kubernetes/storage/explorer-database.pvc.yaml -n $NAMESPACE
}

function copy_explorer_config_files() {
  # Create the job to copy the config files...
  kubectl create -f $EXPLORER_PATH/kubernetes/jobs/copy-explorer-config.yaml -n $NAMESPACE;
  # Wait to let the pod come up
  kubectl wait --timeout=180s --for=condition=Ready -n $NAMESPACE pods --all;
  # Get the pod name
  POD_NAME=$(kubectl get pods -l job-name=copyexplorerconfig -o jsonpath='{.items[*].metadata.name}' -n $NAMESPACE)

  # Copy config files
  echo "Copying explorer config.json"
  kubectl cp $EXPLORER_PATH/config/config.json $NAMESPACE/$POD_NAME:/explorer
  echo "Copying connection profile"
  kubectl cp $EXPLORER_PATH/config/connection-profile.json $NAMESPACE/$POD_NAME:/explorer
  echo "Copying crypto-config"
  kubectl cp $EXPLORER_PATH/config/crypto-config/peerOrganizations/ $NAMESPACE/$POD_NAME:/tmp/crypto/
  kubectl cp $EXPLORER_PATH/config/crypto-config/ordererOrganizations/ $NAMESPACE/$POD_NAME:/tmp/crypto/

  echo "Copy done"
  # Let the pod know copy has finished
  kubectl exec $POD_NAME -n $NAMESPACE -- touch /tmp/copy_explorer_config_done
}

function set_admin_credentials_in_connection_profile() {
  jq '.organizations.Org1.adminPrivateKey.path |= "/tmp/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/priv_sk"' $EXPLORER_PATH/config/connection-profile.json > $EXPLORER_PATH/config/connection-profile.tmp.json
  jq '.organizations.Org1.signedCert.path |= "/tmp/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem"' $EXPLORER_PATH/config/connection-profile.tmp.json > $EXPLORER_PATH/config/connection-profile.json

  rm $EXPLORER_PATH/config/connection-profile.tmp.json
}

set_admin_credentials_in_connection_profile

create_explorer_config_pvc
create_explorer_crypto_config_pvc
create_explorer_database_pvc

copy_explorer_config_files
kubectl wait --timeout=120s --for=condition=complete -n $NAMESPACE job.batch/copyexplorerconfig;
kubectl delete -n $NAMESPACE job.batch/copyexplorerconfig;
