#!/bin/bash

set -e
cd "$(dirname "$(dirname "$0")")"
. ./scripts/values.sh

if true-value .multitenancy.enabled; then
  echo >&2 "[ERROR] DB secret only required for single tenancy apps"
fi

NAME="$1"
if [ "$NAME" == "" ]; then
    NAME="$(value .srv.bindings.db.fromSecret)"
fi

SECRET_HEADER="$(cat <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: $NAME
type: Opaque
stringData:
  type: hana
  label: hana
EOF
)"

cf service $NAME || cf create-service hana hdi-shared $NAME
while true; do
    STATUS="$(cf service $NAME | grep status:)"
    echo $STATUS
    if [[ "$STATUS" = *succeeded* ]]; then
        break
    fi
    sleep 1
done

cf create-service-key $NAME $NAME-key

node "$(dirname "$0")/format-kyma-secret.js" -- "$(echo "$SECRET_HEADER")" "$(cf service-key $NAME $NAME-key)" | kubectl apply -f -
exit 0