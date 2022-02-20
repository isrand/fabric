#!/bin/bash

export GATEWAY_PATH=$(pwd)

create_connection_profile_secret(){
    kubectl create secret generic connection-profile-secret --from-file=connection-profile.json=$GATEWAY_PATH/kubernetes/artifacts/connection-profile.json -n $NAMESPACE
}

create_gateway_config_pvc() {
  kubectl create -f $GATEWAY_PATH/kubernetes/storage/gateway-config.pvc.yaml -n $NAMESPACE;
}

generate_admin_identity() {
  for f in $(ls $GATEWAY_PATH/kubernetes/artifacts/certs); do
    awk 'NF {sub(/\r/, ""); printf "%s\n",$0;}' $GATEWAY_PATH/kubernetes/artifacts/certs/$f > $GATEWAY_PATH/kubernetes/artifacts/certs/$f.tmp
    rm $GATEWAY_PATH/kubernetes/artifacts/certs/$f
    mv $GATEWAY_PATH/kubernetes/artifacts/certs/$f.tmp $GATEWAY_PATH/kubernetes/artifacts/certs/$f
  done
  rm $GATEWAY_PATH/kubernetes/artifacts/admin.id &> /dev/null
  echo "{}" > $GATEWAY_PATH/kubernetes/artifacts/admin.id
  jq --arg msp "Org1MSP" '.mspId |= $msp' $GATEWAY_PATH/kubernetes/artifacts/admin.id > $GATEWAY_PATH/kubernetes/artifacts/admin.id.tmp
  jq --arg typ "X.509" '.type |= $typ' $GATEWAY_PATH/kubernetes/artifacts/admin.id.tmp > $GATEWAY_PATH/kubernetes/artifacts/admin.id
  jq --arg ver 1 '.version |= ($ver|tonumber)' $GATEWAY_PATH/kubernetes/artifacts/admin.id > $GATEWAY_PATH/kubernetes/artifacts/admin.id.tmp
  mv $GATEWAY_PATH/kubernetes/artifacts/admin.id.tmp $GATEWAY_PATH/kubernetes/artifacts/admin.id
  jq --arg cert "$(cat $GATEWAY_PATH/kubernetes/artifacts/certs/Admin@org1.example.com-cert.pem)" '.credentials.certificate |= $cert' $GATEWAY_PATH/kubernetes/artifacts/admin.id > $GATEWAY_PATH/kubernetes/artifacts/admin.id.tmp
  jq --arg key "$(cat $GATEWAY_PATH/kubernetes/artifacts/certs/priv_sk)" '.credentials.privateKey |= $key' $GATEWAY_PATH/kubernetes/artifacts/admin.id.tmp > $GATEWAY_PATH/kubernetes/artifacts/admin.id
  rm $GATEWAY_PATH/kubernetes/artifacts/admin.id.tmp
  rm -rf $GATEWAY_PATH/kubernetes/artifacts/certs
}

copy_wallet_info() {
  # Create the job to copy the artifacts...
  kubectl create -f $GATEWAY_PATH/kubernetes/jobs/copy-wallet-info.yaml -n $NAMESPACE;
  # Wait to let the pod come up
  kubectl wait --timeout=180s --for=condition=Ready -n $NAMESPACE pods --all;
  # Get the pod name
  POD_NAME=$(kubectl get pods -l job-name=copywalletinfo -o jsonpath='{.items[*].metadata.name}' -n $NAMESPACE)
  
  # Copy artifacts
  echo "Copying wallet info"
  kubectl cp $GATEWAY_PATH/kubernetes/artifacts/admin.id $NAMESPACE/$POD_NAME:/usr/src/app/wallet
  
  echo "Copy done"
  # Let the pod know copy has finished
  kubectl exec $POD_NAME -n $NAMESPACE -- touch /tmp/copy_wallet_info_done
}


generate_admin_identity

# Create connection profile secret
create_connection_profile_secret

# Create gateway config PVC
create_gateway_config_pvc

# Spin up job to copy artifacts
echo "Copy wallet info job started"
copy_wallet_info

kubectl wait --timeout=120s --for=condition=complete -n $NAMESPACE job.batch/copywalletinfo;
kubectl delete -n $NAMESPACE job.batch/copywalletinfo;
echo "Copy wallet info job deleted"
