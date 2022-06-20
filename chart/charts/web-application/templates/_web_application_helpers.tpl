{{/*
Old Service Bindings: volumes
*/}}
{{- define "cap.web-application.serviceVolumes" -}}
    {{- $ := . -}}
    {{ range $bindingName, $binding := $.Values.bindings -}}
        {{- $secret := default (print $.Release.Name "-" $.Chart.Name "-" $bindingName) $binding.fromSecret }}
- name: {{ $bindingName }}-secret
  secret:
    secretName: {{ $secret | quote }}
- name: {{ $bindingName }}-metadata
  secret:
    secretName: {{ $secret | quote }}
    optional: true
    items:
    - key: label
      path: label
    - key: plan
      path: plan
    - key: tags
      path: tags
    {{- end -}}
{{- end -}}

{{/*
Service Bindings: env vars
*/}}
{{- define "cap.web-application.env" }}
  {{- $ := . }}
    {{- range $key, $binding := $.Values.bindings }}
        {{- $cleanKey := $key | upper | replace "-" "" | replace "_" "" | replace "." "" }}
        {{- $prefix := print "CDS_ENVIRONMENT_K8S_SERVICEBINDINGS_" $cleanKey }}
        {{- $secret := default (print $.Release.Name "-" $.Chart.Name "-" $key) $binding.fromSecret }}
- name: {{ $prefix }}_SERVICE
  valueFrom:
    secretKeyRef:
      name: {{ $secret | quote }}
      key: label
- name: {{ $prefix }}_PLAN
  valueFrom:
    secretKeyRef:
      name: {{ $secret | quote }}
      key: plan
      optional: true
- name: {{ $prefix }}_SECRETSPATH
  value: /etc/secrets/cds/requires/{{ $key }}/credentials
        {{- end }}
- name: CDS_CONFIG
  value: /etc/secrets/cds
{{- end }}


{{/*
Old Service Bindings: volume mounts
*/}}
{{- define "cap.web-application.serviceMounts" }}
    {{- $ := . -}}
    {{- range $key, $binding := $.Values.bindings }}
- name: {{ $key }}-secret
  mountPath: /etc/secrets/cds/requires/{{ $key }}/credentials
  readOnly: true
- name: {{ $key }}-metadata
  mountPath: /etc/secrets/cds/requires/{{ $key }}/vcap
  readOnly: true
    {{- end }}
{{- end }}


