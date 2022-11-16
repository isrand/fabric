if [[ -z "${CORE_CHAINCODE_ID}" ]]; then
  echo "No CCID provided."
  exit 1
fi

export CORE_CHAINCODE_ADDRESS=$CORE_CHAINCODE_ADDRESS
fabric-chaincode-node server