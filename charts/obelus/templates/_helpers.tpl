{{- define "obelus.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "obelus.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "obelus.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "obelus.labels" -}}
helm.sh/chart: {{ include "obelus.chart" . }}
app.kubernetes.io/name: {{ include "obelus.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "obelus.selectorLabels" -}}
app.kubernetes.io/name: {{ include "obelus.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "obelus.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "obelus.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{- define "obelus.secretName" -}}
{{- if .Values.secrets.name -}}
{{- .Values.secrets.name -}}
{{- else -}}
{{- printf "%s-secrets" (include "obelus.fullname" .) -}}
{{- end -}}
{{- end -}}

{{- define "obelus.apiImage" -}}
{{- $tag := default .Chart.AppVersion .Values.api.image.tag -}}
{{- printf "%s:%s" .Values.api.image.repository $tag -}}
{{- end -}}

{{- define "obelus.webImage" -}}
{{- $tag := default .Chart.AppVersion .Values.web.image.tag -}}
{{- printf "%s:%s" .Values.web.image.repository $tag -}}
{{- end -}}

{{- define "obelus.apiEnv" -}}
{{- $dbSecretName := .Values.api.secretRefs.DATABASE_URL.existingSecret -}}
{{- if and (not $dbSecretName) .Values.secrets.create -}}
{{- $dbSecretName = include "obelus.secretName" . -}}
{{- end -}}
{{- $redisSecretName := .Values.api.secretRefs.REDIS_URL.existingSecret -}}
{{- if and (not $redisSecretName) .Values.secrets.create -}}
{{- $redisSecretName = include "obelus.secretName" . -}}
{{- end -}}
{{- $sessionSecretName := .Values.api.secretRefs.SESSION_SECRET.existingSecret -}}
{{- if and (not $sessionSecretName) .Values.secrets.create -}}
{{- $sessionSecretName = include "obelus.secretName" . -}}
{{- end -}}
{{- $oauthClientSecretName := .Values.api.secretRefs.OAUTH_CLIENT_SECRET.existingSecret -}}
{{- if and (not $oauthClientSecretName) .Values.secrets.create -}}
{{- $oauthClientSecretName = include "obelus.secretName" . -}}
{{- end -}}
- name: NODE_ENV
  value: {{ .Values.api.env.NODE_ENV | quote }}
- name: API_PORT
  value: {{ .Values.api.env.API_PORT | quote }}
- name: TRUST_PROXY
  value: {{ .Values.api.env.TRUST_PROXY | quote }}
- name: APP_ORIGIN
  value: {{ .Values.api.env.APP_ORIGIN | quote }}
- name: APP_ORIGINS
  value: {{ .Values.api.env.APP_ORIGINS | quote }}
- name: SESSION_COOKIE_NAME
  value: {{ .Values.api.env.SESSION_COOKIE_NAME | quote }}
- name: CSRF_COOKIE_NAME
  value: {{ .Values.api.env.CSRF_COOKIE_NAME | quote }}
- name: OPENLIBRARY_CONTACT_EMAIL
  value: {{ required "Set api.env.OPENLIBRARY_CONTACT_EMAIL to an administrator contact email for OpenLibrary API User-Agent." .Values.api.env.OPENLIBRARY_CONTACT_EMAIL | quote }}
- name: OAUTH_PROVIDER
  value: {{ .Values.api.env.OAUTH_PROVIDER | quote }}
- name: OAUTH_ISSUER
  value: {{ .Values.api.env.OAUTH_ISSUER | quote }}
- name: OAUTH_JWKS_URL
  value: {{ .Values.api.env.OAUTH_JWKS_URL | quote }}
- name: OAUTH_CLIENT_ID
  value: {{ .Values.api.env.OAUTH_CLIENT_ID | quote }}
- name: OAUTH_AUTHORIZE_URL
  value: {{ .Values.api.env.OAUTH_AUTHORIZE_URL | quote }}
- name: OAUTH_TOKEN_URL
  value: {{ .Values.api.env.OAUTH_TOKEN_URL | quote }}
- name: OAUTH_USERINFO_URL
  value: {{ .Values.api.env.OAUTH_USERINFO_URL | quote }}
- name: OAUTH_REDIRECT_URI
  value: {{ .Values.api.env.OAUTH_REDIRECT_URI | quote }}
- name: OAUTH_SCOPES
  value: {{ .Values.api.env.OAUTH_SCOPES | quote }}
- name: DATABASE_URL
  {{- if $dbSecretName }}
  valueFrom:
    secretKeyRef:
      name: {{ $dbSecretName | quote }}
      key: {{ .Values.api.secretRefs.DATABASE_URL.key | quote }}
  {{- else }}
  value: {{ required "Set api.secretRefs.DATABASE_URL.existingSecret or enable secrets.create or provide api.env.DATABASE_URL." .Values.api.env.DATABASE_URL | quote }}
  {{- end }}
- name: REDIS_URL
  {{- if $redisSecretName }}
  valueFrom:
    secretKeyRef:
      name: {{ $redisSecretName | quote }}
      key: {{ .Values.api.secretRefs.REDIS_URL.key | quote }}
  {{- else }}
  value: {{ required "Set api.secretRefs.REDIS_URL.existingSecret or enable secrets.create or provide api.env.REDIS_URL." .Values.api.env.REDIS_URL | quote }}
  {{- end }}
- name: SESSION_SECRET
  {{- if $sessionSecretName }}
  valueFrom:
    secretKeyRef:
      name: {{ $sessionSecretName | quote }}
      key: {{ .Values.api.secretRefs.SESSION_SECRET.key | quote }}
  {{- else }}
  value: {{ required "Set api.secretRefs.SESSION_SECRET.existingSecret or enable secrets.create or provide api.env.SESSION_SECRET." .Values.api.env.SESSION_SECRET | quote }}
  {{- end }}
- name: OAUTH_CLIENT_SECRET
  {{- if $oauthClientSecretName }}
  valueFrom:
    secretKeyRef:
      name: {{ $oauthClientSecretName | quote }}
      key: {{ .Values.api.secretRefs.OAUTH_CLIENT_SECRET.key | quote }}
  {{- else }}
  value: {{ .Values.api.env.OAUTH_CLIENT_SECRET | default "" | quote }}
  {{- end }}
{{- with .Values.api.extraEnv }}
{{ toYaml . }}
{{- end }}
{{- end -}}
