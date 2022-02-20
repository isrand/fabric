kubectl delete deployment gateway -n $NAMESPACE --ignore-not-found=true
kubectl delete secrets/connection-profile-secret -n $NAMESPACE --ignore-not-found=true
kubectl delete job copywalletinfo -n $NAMESPACE --ignore-not-found=true
kubectl delete pvc/gateway-config-pvc -n $NAMESPACE --ignore-not-found=true