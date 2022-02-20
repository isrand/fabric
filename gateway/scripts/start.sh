#!/bin/bash

export GATEWAY_PATH=$(pwd)

GATEWAY_IMAGE_VERSION=$1
IMAGE_PULL_POLICY=$2

GATEWAY_IMAGE_NAME="${GATEWAY_IMAGE_NAME:-gateway}"

start() {
  GATEWAY_IMAGE_NAME=$(echo $GATEWAY_IMAGE_NAME | sed 's/\//\\\//g')
  sed 's/${{GATEWAY_IMAGE_NAME}}/'"$GATEWAY_IMAGE_NAME"'/g' $GATEWAY_PATH/kubernetes/gateway.yaml > $GATEWAY_PATH/kubernetes/gateway.tmp.yaml
  sed 's/${{GATEWAY_IMAGE_VERSION}}/'"$GATEWAY_IMAGE_VERSION"'/g' $GATEWAY_PATH/kubernetes/gateway.tmp.yaml > $GATEWAY_PATH/kubernetes/gateway.tmp2.yaml
  sed 's/${{IMAGE_PULL_POLICY}}/'"$IMAGE_PULL_POLICY"'/g' $GATEWAY_PATH/kubernetes/gateway.tmp2.yaml > $GATEWAY_PATH/kubernetes/gateway.$GATEWAY_IMAGE_VERSION.yaml
  kubectl create -f $GATEWAY_PATH/kubernetes/gateway.$GATEWAY_IMAGE_VERSION.yaml -n $NAMESPACE;
  rm $GATEWAY_PATH/kubernetes/gateway.*.yaml
}

# Spin up HLF gateway
start

kubectl wait --timeout=180s --for=condition=Ready -n $NAMESPACE pods --all;

echo "Gateway deployed"