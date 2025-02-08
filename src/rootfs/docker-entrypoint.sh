#!/usr/bin/env sh
set -eu

# shellcheck disable=SC2120
replaceEnvSecrets() {
  # replaceEnvSecrets 1.0.0
  local prefix="${1:-}"

  for envSecretName in $(export | awk '{print $2}' | grep -oE '^[^=]+' | grep '__FILE$'); do
    if [ -z "$prefix" ] || printf '%s' "$envSecretName" | grep "^$prefix" >/dev/null; then
      local envName
      envName=$(printf '%s' "$envSecretName" | sed 's/__FILE$//')

      local filePath
      filePath=$(eval echo '${'"$envSecretName"':-}')

      if [ -n "$filePath" ]; then
        if [ -f "$filePath" ]; then
          echo Using content from "$filePath" file for "$envName" environment variable value.

          export "$envName"="$(cat -A "$filePath")"
          unset "$envSecretName"
        else
          echo ERROR: Environment variable "$envSecretName" is defined but does not point to a regular file. 1>&2
          exit 1
        fi
      fi
    fi
  done
}

replaceEnvSecrets POSTFIX_

export POSTFIX_MESSAGE_SIZE_LIMIT="${POSTFIX_MESSAGE_SIZE_LIMIT:-10485760}"
export POSTFIX_NOTIFY_EMAIL="${POSTFIX_NOTIFY_EMAIL:-postmaster}"
export POSTFIX_NOTIFY_CLASSES="${POSTFIX_NOTIFY_CLASSES:-"resource, software"}"

export POSTFIX_TRANSPORT_LMTP_HOST="${POSTFIX_TRANSPORT_LMTP_HOST:-}"
export POSTFIX_TRANSPORT_LMTP_TLS="${POSTFIX_TRANSPORT_LMTP_TLS:-0}"
export POSTFIX_TRANSPORT_LMTP_TLS_SKIP_VERIFY="${POSTFIX_TRANSPORT_LMTP_TLS_SKIP_VERIFY:-0}"
export POSTFIX_TRANSPORT_LMTP_TLS_CA_FILE="${POSTFIX_TRANSPORT_LMTP_TLS_CA_FILE:-}"
export POSTFIX_TRANSPORT_LMTP_TLS_CERT_FILE="${POSTFIX_TRANSPORT_LMTP_TLS_CERT_FILE:-}"
export POSTFIX_TRANSPORT_LMTP_TLS_CERT_KEY_FILE="${POSTFIX_TRANSPORT_LMTP_TLS_CERT_KEY_FILE:-}"

export POSTFIX_SASL_TYPE="${POSTFIX_SASL_TYPE:-dovecot}"
export POSTFIX_SASL_HOST="${POSTFIX_SASL_HOST:-}"
export POSTFIX_SASL_TLS="${POSTFIX_SASL_TLS:-0}"
export POSTFIX_SASL_TLS_SKIP_VERIFY="${POSTFIX_SASL_TLS_SKIP_VERIFY:-0}"
export POSTFIX_SASL_TLS_CA_FILE="${POSTFIX_SASL_TLS_CA_FILE:-}"
export POSTFIX_SASL_TLS_CERT_FILE="${POSTFIX_SASL_TLS_CERT_FILE:-}"
export POSTFIX_SASL_TLS_CERT_KEY_FILE="${POSTFIX_SASL_TLS_CERT_KEY_FILE:-}"

export POSTFIX_RCPT_POLICY_SERVICE_HOST="${POSTFIX_RCPT_POLICY_SERVICE_HOST:-}"
export POSTFIX_RCPT_POLICY_SERVICE_TLS="${POSTFIX_RCPT_POLICY_SERVICE_TLS:-0}"
export POSTFIX_RCPT_POLICY_SERVICE_TLS_SKIP_VERIFY="${POSTFIX_RCPT_POLICY_SERVICE_TLS_SKIP_VERIFY:-0}"
export POSTFIX_RCPT_POLICY_SERVICE_TLS_CA_FILE="${POSTFIX_RCPT_POLICY_SERVICE_TLS_CA_FILE:-}"
export POSTFIX_RCPT_POLICY_SERVICE_TLS_CERT_FILE="${POSTFIX_RCPT_POLICY_SERVICE_TLS_CERT_FILE:-}"
export POSTFIX_RCPT_POLICY_SERVICE_TLS_CERT_KEY_FILE="${POSTFIX_RCPT_POLICY_SERVICE_TLS_CERT_KEY_FILE:-}"

export POSTFIX_MILTER_DEFAULT_ACTION="${POSTFIX_MILTER_DEFAULT_ACTION:-tempfail}"
export POSTFIX_MILTER_HOST="${POSTFIX_MILTER_HOST:-}"
export POSTFIX_MILTER_TLS="${POSTFIX_MILTER_TLS:-0}"
export POSTFIX_MILTER_TLS_SKIP_VERIFY="${POSTFIX_MILTER_TLS_SKIP_VERIFY:-0}"
export POSTFIX_MILTER_TLS_CA_FILE="${POSTFIX_MILTER_TLS_CA_FILE:-}"
export POSTFIX_MILTER_TLS_CERT_FILE="${POSTFIX_MILTER_TLS_CERT_FILE:-}"
export POSTFIX_MILTER_TLS_CERT_KEY_FILE="${POSTFIX_MILTER_TLS_CERT_KEY_FILE:-}"

if [ -n "$POSTFIX_TRANSPORT_LMTP_HOST" ]; then
  if [ "$POSTFIX_TRANSPORT_LMTP_TLS" -eq 0 ]; then
    export POSTFIX_TRANSPORT_LMTP_PORT="${POSTFIX_TRANSPORT_LMTP_PORT:-24}"

    export _POSTFIX_TRANSPORT_LMTP_HOST="$POSTFIX_TRANSPORT_LMTP_HOST"
    export _POSTFIX_TRANSPORT_LMTP_PORT="$POSTFIX_TRANSPORT_LMTP_PORT"
  else
    if [ -z "${POSTFIX_TRANSPORT_LMTP_PORT:-}" ]; then
      echo "$0": missing POSTFIX_TRANSPORT_LMTP_PORT environment variable
      exit 1
    fi

    export _POSTFIX_TRANSPORT_LMTP_HOST=127.0.0.20
    export _POSTFIX_TRANSPORT_LMTP_PORT=10000
  fi
fi

if [ -n "$POSTFIX_SASL_HOST" ]; then
  if [ -z "${POSTFIX_SASL_PORT:-}" ]; then
    echo "$0": missing POSTFIX_SASL_PORT environment variable
    exit 1
  fi

  if [ "$POSTFIX_SASL_TLS" -eq 0 ]; then
    export _POSTFIX_SASL_HOST="$POSTFIX_SASL_HOST"
    export _POSTFIX_SASL_PORT="$POSTFIX_SASL_PORT"
  else
    export _POSTFIX_SASL_HOST=127.0.0.20
    export _POSTFIX_SASL_PORT=10001
  fi
fi

if [ -n "$POSTFIX_RCPT_POLICY_SERVICE_HOST" ]; then
  if [ -z "${POSTFIX_RCPT_POLICY_SERVICE_PORT:-}" ]; then
    echo "$0": missing POSTFIX_RCPT_POLICY_SERVICE_PORT environment variable
    exit 1
  fi

  if [ "$POSTFIX_RCPT_POLICY_SERVICE_TLS" -eq 0 ]; then
    export _POSTFIX_RCPT_POLICY_SERVICE_HOST="$POSTFIX_RCPT_POLICY_SERVICE_HOST"
    export _POSTFIX_RCPT_POLICY_SERVICE_PORT="$POSTFIX_RCPT_POLICY_SERVICE_PORT"
  else
    export _POSTFIX_RCPT_POLICY_SERVICE_HOST=127.0.0.20
    export _POSTFIX_RCPT_POLICY_SERVICE_PORT=10002
  fi
fi

if [ -n "$POSTFIX_MILTER_HOST" ]; then
  if [ "$POSTFIX_MILTER_TLS" -eq 0 ]; then
    export POSTFIX_MILTER_PORT="${POSTFIX_MILTER_PORT:-11332}"

    export _POSTFIX_MILTER_HOST="$POSTFIX_MILTER_HOST"
    export _POSTFIX_MILTER_PORT="$POSTFIX_MILTER_PORT"
  else
    if [ -z "${POSTFIX_MILTER_PORT:-}" ]; then
      echo "$0": missing POSTFIX_MILTER_PORT environment variable
      exit 1
    fi

    export _POSTFIX_MILTER_HOST=127.0.0.20
    export _POSTFIX_MILTER_PORT=10003
  fi
fi

j2Templates="
/etc/postfix/main.cf
/etc/postfix/mysql-recipient-access.cf
/etc/postfix/mysql-sender-login-maps.cf
/etc/postfix/mysql-virtual-alias-maps.cf
/etc/postfix/mysql-virtual-mailbox-domains.cf
/etc/postfix/mysql-virtual-mailbox-maps.cf
/etc/stunnel/stunnel.conf
"

for file in $j2Templates; do
  jinja2 -o "$file" "$file.j2"

  # can't use --reference with alpine
  chmod "$(stat -c '%a' "$file.j2")" "$file"
  chown "$(stat -c '%U:%G' "$file.j2")" "$file"
done

exec "$@"
