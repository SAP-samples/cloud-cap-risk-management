#!/bin/bash

set -e

npm run build:cf --prefix risks
npm run build:cf --prefix mitigations

rm -rf resources
mkdir -p resources

mv risks/dist/nsrisks.zip resources
mv mitigations/dist/nsmitigations.zip resources

if [ "$CNB_STACK_ID" != "" ]; then
    # Delete directories if running in CNB build to avoid them getting packaged
    rm -rf risks
    rm -rf mitigations
fi