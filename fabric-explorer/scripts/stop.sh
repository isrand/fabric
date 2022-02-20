kubectl delete deploy explorer -n $NAMESPACE --ignore-not-found=true
kubectl delete deploy blockchain-explorer-db -n $NAMESPACE --ignore-not-found=true
kubectl delete job copyexplorerconfig -n $NAMESPACE --ignore-not-found=true

kubectl delete pvc explorer-config-pvc -n $NAMESPACE --ignore-not-found=true
kubectl delete pvc explorer-crypto-config-pvc -n $NAMESPACE --ignore-not-found=true
kubectl delete pvc explorer-database-pvc -n $NAMESPACE --ignore-not-found=true

kubectl delete svc explorer -n $NAMESPACE --ignore-not-found=true
kubectl delete svc blockchain-explorer-db -n $NAMESPACE --ignore-not-found=true