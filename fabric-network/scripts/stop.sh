kubectl delete deploy peer0-org1 -n $NAMESPACE --ignore-not-found=true
kubectl delete deploy peer0-org2 -n $NAMESPACE --ignore-not-found=true
kubectl delete deploy cli-peer0-org1 -n $NAMESPACE --ignore-not-found=true
kubectl delete deploy cli-peer0-org2 -n $NAMESPACE --ignore-not-found=true
kubectl delete deploy orderer -n $NAMESPACE --ignore-not-found=true

kubectl delete pvc artifacts-pvc -n $NAMESPACE --ignore-not-found=true
kubectl delete pvc chaincode-buildpack-pvc -n $NAMESPACE --ignore-not-found=true
kubectl delete pvc chaincode-packages-pvc -n $NAMESPACE --ignore-not-found=true
kubectl delete pvc peer-config-pvc -n $NAMESPACE --ignore-not-found=true

kubectl delete svc orderer -n $NAMESPACE --ignore-not-found=true
kubectl delete svc peer0-org1 -n $NAMESPACE --ignore-not-found=true
kubectl delete svc peer0-org2 -n $NAMESPACE --ignore-not-found=true