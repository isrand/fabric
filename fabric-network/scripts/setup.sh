#!/bin/bash

# FABRIC_NETWORK_PATH is pwd because this script will always be ran from the fabric-network root folder, NEVER
# from within the /scripts folder
export FABRIC_NETWORK_PATH=$(pwd)
export FABRIC_CFG_PATH=$FABRIC_NETWORK_PATH/config

# Refresh local artifacts folder
rm -rf $FABRIC_NETWORK_PATH/artifacts
mkdir $FABRIC_NETWORK_PATH/artifacts

fetch_hyperledger_fabric_binaries() {
  echo "Fetching Hyperledger Fabric binaries, hang on tight..."
  mkdir binaries
  ARCH=$(echo "$(uname -s|tr '[:upper:]' '[:lower:]'|sed 's/mingw64_nt.*/windows/')-$(uname -m |sed 's/x86_64/amd64/g')" |sed 's/darwin-arm64/darwin-amd64/g')
  echo $ARCH
  VERSION=2.2.3
  curl -L --retry 5 --retry-delay 3 "https://github.com/hyperledger/fabric/releases/download/v$VERSION/hyperledger-fabric-${ARCH}-${VERSION}.tar.gz" --output ./binaries/hyperledger-fabric-$ARCH-$VERSION.tar.gz
  cd binaries
  tar xf hyperledger-fabric-$ARCH-$VERSION.tar.gz
  mv ./bin ..
  cd ..
  rm -rf binaries
}

generate_crypto_material() {
  $FABRIC_NETWORK_PATH/bin/cryptogen generate --config $FABRIC_NETWORK_PATH/config/crypto-config.yaml --output=$FABRIC_NETWORK_PATH/config/crypto-config
}

generate_genesis_block() {
  cd $FABRIC_NETWORK_PATH/config
  $FABRIC_NETWORK_PATH/bin/configtxgen -profile TwoOrgsOrdererGenesis -channelID system-channel -outputBlock genesis.block
}

generate_channel_block() {
  cd $FABRIC_NETWORK_PATH/config
  $FABRIC_NETWORK_PATH/bin/configtxgen -profile mychannel -outputCreateChannelTx mychannel.tx -channelID mychannel
}

move_artifacts_to_folder() {
  mv $FABRIC_NETWORK_PATH/config/crypto-config $FABRIC_NETWORK_PATH/artifacts/
  mv $FABRIC_NETWORK_PATH/config/genesis.block $FABRIC_NETWORK_PATH/artifacts
  mv $FABRIC_NETWORK_PATH/config/mychannel.tx $FABRIC_NETWORK_PATH/artifacts
}

create_artifacts_pvc() {
  kubectl create -f $FABRIC_NETWORK_PATH/kubernetes/storage/artifacts.pvc.yaml -n $NAMESPACE;
}

create_peer_config_pvc() {
  kubectl create -f $FABRIC_NETWORK_PATH/kubernetes/storage/peer-config.pvc.yaml -n $NAMESPACE;
}

create_buildpack_pvc() {
  kubectl create -f $FABRIC_NETWORK_PATH/kubernetes/storage/buildpack.pvc.yaml -n $NAMESPACE;
}

create_chaincode_packages_pvc() {
  kubectl create -f $FABRIC_NETWORK_PATH/kubernetes/storage/chaincode-packages.pvc.yaml -n $NAMESPACE;
}

copy_artifacts() {
  # Create the job to copy the artifacts...
  kubectl create -f $FABRIC_NETWORK_PATH/kubernetes/jobs/copy-artifacts.yaml -n $NAMESPACE;
  # Wait to let the pod come up
  kubectl wait --timeout=180s --for=condition=Ready -n $NAMESPACE pods --all;
  # Get the pod name
  POD_NAME=$(kubectl get pods -l job-name=copyartifacts -o jsonpath='{.items[*].metadata.name}' -n $NAMESPACE)
  # Copy artifacts
  echo "Copying crypto-config"
  kubectl cp $FABRIC_NETWORK_PATH/artifacts/crypto-config $NAMESPACE/$POD_NAME:/shared/crypto-config
  echo "Copying genesis block"
  kubectl cp $FABRIC_NETWORK_PATH/artifacts/genesis.block $NAMESPACE/$POD_NAME:/shared/genesis.block
  echo "Copying channel configuration"
  kubectl cp $FABRIC_NETWORK_PATH/artifacts/mychannel.tx $NAMESPACE/$POD_NAME:/shared/mychannel.tx

  echo "Copying buildpack"
  kubectl cp $FABRIC_NETWORK_PATH/buildpack/bin/build $NAMESPACE/$POD_NAME:/opt/buildpack/bin/build
  kubectl cp $FABRIC_NETWORK_PATH/buildpack/bin/release $NAMESPACE/$POD_NAME:/opt/buildpack/bin/release
  kubectl cp $FABRIC_NETWORK_PATH/buildpack/bin/detect $NAMESPACE/$POD_NAME:/opt/buildpack/bin/detect

  echo "Copying peer configuration file"
  kubectl cp $FABRIC_NETWORK_PATH/config/core.yaml $NAMESPACE/$POD_NAME:/etc/hyperledger/fabric/core.yaml

  echo "Copy done"
  # Let the pod know copy has finished
  kubectl exec $POD_NAME -n $NAMESPACE -- touch /shared/copy_artifacts_done
}

# Only fetch HLF binaries if bin folder doesn't exist
if [ ! -d $FABRIC_NETWORK_PATH/bin ]; then
  fetch_hyperledger_fabric_binaries
fi

generate_crypto_material
generate_genesis_block
generate_channel_block

move_artifacts_to_folder

# Create the PVCs for the artifacts, buildpack
create_artifacts_pvc
create_peer_config_pvc
create_buildpack_pvc
create_chaincode_packages_pvc

# Wait for all PVCs to be bound and ready to use
sleep 10;

# Spin up job to copy artifacts
copy_artifacts
sleep 10;
kubectl wait --timeout=120s --for=condition=complete -n $NAMESPACE job.batch/copyartifacts;
kubectl delete -n $NAMESPACE job.batch/copyartifacts;
sleep 5;