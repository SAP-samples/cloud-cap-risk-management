{{/*
Backend Destinations
*/}}
{{- define "cap.backendDestinations" -}}
{{- $ := . -}}
{{- $destinations := list -}}
{{- range $destinationName, $destination := .backendDestinations -}}
    {{- $destination := merge (dict "name" $destinationName) $destination -}}
    {{- $deployment := (get $.root.Values $destination.service) -}}
    {{- $srv := merge (dict "name" $destination.service "destination" $destination "deployment" $deployment) $.root -}}
    {{- $destinationHost := include "cap.deploymentHost" $srv -}}
    {{- $currentDestination := dict "Name" $destination.name "Type" "HTTP" "ProxyType" "Internet" "URL" (print  "https://" $destinationHost "." $.root.Values.global.domain ($destination.path | default "")) "Authentication" "NoAuthentication" "sap.cloud.service" $.cloudService "HTML5.forwardAuthToken" "true" -}}
    {{- $destinations = (append $destinations $currentDestination) -}}
{{- end -}}
{{- $destinations | toJson }}
{{- end -}}