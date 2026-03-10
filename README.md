# Postfix Container

![GitHub License](https://img.shields.io/github/license/anthochamp/container-postfix?style=for-the-badge)
![GitHub Release](https://img.shields.io/github/v/release/anthochamp/container-postfix?style=for-the-badge&color=457EC4)
![GitHub Release Date](https://img.shields.io/github/release-date/anthochamp/container-postfix?style=for-the-badge&display_date=published_at&color=457EC4)

Container images based on [Postfix](http://www.postfix.org/), pre-configured for virtual mail hosting with MySQL, LMTP delivery, SASL authentication, milter filtering, SRS (canonical maps), DANE/MTA-STS (TLS policy), and TLSRPT.

## How to use this image

Start a Postfix container with basic MySQL configuration:

```shell
docker run -d \
  -p 25:25 \
  -p 587:587 \
  -e POSTFIX_HOSTNAME=smtp.example.com \
  -e POSTFIX_MYSQL_HOST=mysql \
  -e POSTFIX_MYSQL_USERNAME=postfix \
  -e POSTFIX_MYSQL_PASSWORD=secret \
  -e POSTFIX_MYSQL_DATABASE=mailserver \
  -e POSTFIX_TRANSPORT_LMTP_HOST=dovecot \
  anthochamp/postfix
```

For production use with SASL authentication and milter filtering:

```shell
docker run -d \
  -p 25:25 \
  -p 587:587 \
  -e POSTFIX_HOSTNAME=smtp.example.com \
  -e POSTFIX_MYSQL_HOST=mysql \
  -e POSTFIX_MYSQL_USERNAME=postfix \
  -e POSTFIX_MYSQL_PASSWORD=secret \
  -e POSTFIX_MYSQL_DATABASE=mailserver \
  -e POSTFIX_TRANSPORT_LMTP_HOST=dovecot \
  -e POSTFIX_SASL_HOST=dovecot \
  -e POSTFIX_SASL_PORT=12345 \
  -e POSTFIX_MILTER_HOST=rspamd \
  -e POSTFIX_MILTER_PORT=11332 \
  -e POSTFIX_NOTIFY_EMAIL=postmaster@example.com \
  anthochamp/postfix
```

## Volumes

- `/var/spool/postfix/` — Mail queue and other Postfix state files.
- `/var/lib/tlsrpt/` — TLSRPT collectd database (for TLS reporting). Share with `container-tlsrpt-reporter` for report generation and delivery.

## MySQL Database Schema

Postfix requires specific MySQL tables for virtual domain and user management.

### domains

Stores virtual mail domains that Postfix will accept mail for:

```sql
CREATE TABLE domains (
  name varchar(255) NOT NULL,
  PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Required columns:**

- `name`: Domain name (e.g., `example.com`)

### users

Stores virtual mail users and their settings:

```sql
CREATE TABLE users (
  local varchar(64) NOT NULL,
  domain varchar(255) NOT NULL,
  email varchar(320) NOT NULL,
  sendonly tinyint(1) NOT NULL DEFAULT 0,
  enabled tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (local, domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Required columns:**

- `local`: Local part of email address (before @)
- `domain`: Domain name
- `email`: Full email address (local@domain)
- `sendonly`: If `1`, user can only send (receives rejected)
- `enabled`: If `1`, user is active

### aliases

Stores email aliases and forwarding rules:

```sql
CREATE TABLE aliases (
  source_local varchar(64) NOT NULL,
  source_domain varchar(255) NOT NULL,
  destination varchar(320) NOT NULL,
  enabled tinyint(1) NOT NULL DEFAULT 1,
  is_regex tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (source_local, source_domain, destination)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Required columns:**

- `source_local`: Local part of source email
- `source_domain`: Domain of source address
- `destination`: Full destination email address
- `enabled`: If `1`, alias is active
- `is_regex`: If `1`, `source_local` is treated as regex pattern

**Note:** You can use views or more complex table structures as long as they provide the required columns listed above.

## Configuration

Sensitive values may be loaded from files by appending `__FILE` to any supported environment variable name. This is commonly used with Docker secrets (e.g., `POSTFIX_MYSQL_PASSWORD__FILE=/run/secrets/mysql_password`).

### Database

#### POSTFIX_MYSQL_HOST

**Default**: *empty*

MySQL server hostname or IP address for virtual domain and user lookups.

#### POSTFIX_MYSQL_USERNAME

**Default**: *empty*

MySQL username for database authentication.

#### POSTFIX_MYSQL_PASSWORD

**Default**: *empty*

MySQL password for database authentication.

#### POSTFIX_MYSQL_DATABASE

**Default**: *empty*

MySQL database name containing virtual domain and user tables.

#### POSTFIX_MYSQL_TABLE_DOMAINS

**Default**: `domains`

Name of the MySQL table/view containing virtual domains.

#### POSTFIX_MYSQL_TABLE_USERS

**Default**: `users`

Name of the MySQL table/view containing virtual users.

#### POSTFIX_MYSQL_TABLE_ALIASES

**Default**: `aliases`

Name of the MySQL table/view containing email aliases.

### General

#### POSTFIX_HOSTNAME

**Default**: *empty*

Fully qualified domain name of the mail server (e.g., `smtp.yourdomain.tld`). Maps to Postfix [`myhostname`](https://www.postfix.org/postconf.5.html#myhostname).

#### POSTFIX_NOTIFY_CLASSES

**Default**: `resource, software`

Postfix notification classes for alerts sent to `POSTFIX_NOTIFY_EMAIL`. Maps to Postfix [`notify_classes`](https://www.postfix.org/postconf.5.html#notify_classes).

#### POSTFIX_NOTIFY_EMAIL

**Default**: *empty*

Email address to receive system notifications (e.g., `postmaster@yourdomain.tld`). Maps to Postfix [`2bounce_notice_recipient`](https://www.postfix.org/postconf.5.html#2bounce_notice_recipient) and related options.

#### POSTFIX_MESSAGE_SIZE_LIMIT

**Default**: `10MiB`

Maximum message size limit. Maps to Postfix [`message_size_limit`](https://www.postfix.org/postconf.5.html#message_size_limit).

### LMTP delivery

#### POSTFIX_TRANSPORT_LMTP_HOST

**Default**: *empty*

LMTP server hostname for mail delivery (e.g., Dovecot).

#### POSTFIX_TRANSPORT_LMTP_PORT

**Default**: `24`

LMTP server port.

#### POSTFIX_TRANSPORT_LMTP_TLS

**Default**: `0`

Enable TLS for LMTP connections. Set to `1` to enable.

#### POSTFIX_TRANSPORT_LMTP_TLS_SKIP_VERIFY

**Default**: `0`

Skip TLS certificate verification for LMTP. Set to `1` to skip (not recommended for production).

#### POSTFIX_TRANSPORT_LMTP_TLS_CA_FILE

**Default**: *empty*

Path to CA certificate file for LMTP TLS verification.

#### POSTFIX_TRANSPORT_LMTP_TLS_CERT_FILE

**Default**: *empty*

Path to client certificate file for LMTP TLS authentication.

#### POSTFIX_TRANSPORT_LMTP_TLS_CERT_KEY_FILE

**Default**: *empty*

Path to client certificate key file for LMTP TLS authentication.

### SASL authentication

#### POSTFIX_SASL_TYPE

**Default**: `dovecot`

SASL authentication mechanism type.

#### POSTFIX_SASL_HOST

**Default**: *empty*

SASL authentication server hostname (e.g., Dovecot).

#### POSTFIX_SASL_PORT

**Default**: *empty*

SASL authentication server port.

#### POSTFIX_SASL_TLS

**Default**: `0`

Enable TLS for SASL connections. Set to `1` to enable.

#### POSTFIX_SASL_TLS_SKIP_VERIFY

**Default**: `0`

Skip TLS certificate verification for SASL. Set to `1` to skip (not recommended for production).

#### POSTFIX_SASL_TLS_CA_FILE

**Default**: *empty*

Path to CA certificate file for SASL TLS verification.

#### POSTFIX_SASL_TLS_CERT_FILE

**Default**: *empty*

Path to client certificate file for SASL TLS authentication.

#### POSTFIX_SASL_TLS_CERT_KEY_FILE

**Default**: *empty*

Path to client certificate key file for SASL TLS authentication.

### Recipient policy service

#### POSTFIX_RCPT_POLICY_SERVICE_HOST

**Default**: *empty*

Recipient policy service hostname for mail filtering.

#### POSTFIX_RCPT_POLICY_SERVICE_PORT

**Default**: *empty*

Recipient policy service port.

#### POSTFIX_RCPT_POLICY_SERVICE_TLS

**Default**: `0`

Enable TLS for policy service connections. Set to `1` to enable.

#### POSTFIX_RCPT_POLICY_SERVICE_TLS_SKIP_VERIFY

**Default**: `0`

Skip TLS certificate verification for policy service. Set to `1` to skip (not recommended for production).

#### POSTFIX_RCPT_POLICY_SERVICE_TLS_CA_FILE

**Default**: *empty*

Path to CA certificate file for policy service TLS verification.

#### POSTFIX_RCPT_POLICY_SERVICE_TLS_CERT_FILE

**Default**: *empty*

Path to client certificate file for policy service TLS authentication.

#### POSTFIX_RCPT_POLICY_SERVICE_TLS_CERT_KEY_FILE

**Default**: *empty*

Path to client certificate key file for policy service TLS authentication.

### Milter

#### POSTFIX_MILTER_HOST

**Default**: *empty*

Mail filter (milter) service hostname (e.g., rspamd).

#### POSTFIX_MILTER_PORT

**Default**: `11332`

Mail filter service port.

#### POSTFIX_MILTER_TLS

**Default**: `0`

Enable TLS for milter connections. Set to `1` to enable.

#### POSTFIX_MILTER_TLS_SKIP_VERIFY

**Default**: `0`

Skip TLS certificate verification for milter. Set to `1` to skip (not recommended for production).

#### POSTFIX_MILTER_TLS_CA_FILE

**Default**: *empty*

Path to CA certificate file for milter TLS verification.

#### POSTFIX_MILTER_TLS_CERT_FILE

**Default**: *empty*

Path to client certificate file for milter TLS authentication.

#### POSTFIX_MILTER_TLS_CERT_KEY_FILE

**Default**: *empty*

Path to client certificate key file for milter TLS authentication.

#### POSTFIX_MILTER_DEFAULT_ACTION

**Default**: `tempfail`

Default action when milter service is unavailable. Maps to Postfix [`milter_default_action`](https://www.postfix.org/postconf.5.html#milter_default_action).

### TLS policy service (DANE/MTA-STS)

#### POSTFIX_TLS_POLICY_SERVICE_HOST

**Default**: *empty*

TLS policy service hostname for DANE/MTA-STS validation. When configured, enables [DANE](https://www.rfc-editor.org/rfc/rfc6698) and [MTA-STS](https://www.rfc-editor.org/rfc/rfc8461) policy enforcement for outbound SMTP, and activates [TLSRPT](https://www.rfc-editor.org/rfc/rfc8460) reporting via `tlsrpt-collectd`.

**Recommended service**: [postfix-tlspol](https://github.com/Zuplu/postfix-tlspol/) — provides both DANE and MTA-STS in a single RFC 8461 compliant service.

#### POSTFIX_TLS_POLICY_SERVICE_PORT

**Default**: `8642`

TLS policy service port.

#### POSTFIX_TLS_POLICY_SERVICE_TLS

**Default**: `0`

Enable TLS for TLS policy service connections. Set to `1` to enable.

#### POSTFIX_TLS_POLICY_SERVICE_TLS_SKIP_VERIFY

**Default**: `0`

Skip TLS certificate verification for TLS policy service. Set to `1` to skip (not recommended for production).

#### POSTFIX_TLS_POLICY_SERVICE_TLS_CA_FILE

**Default**: *empty*

Path to CA certificate file for TLS policy service TLS verification.

#### POSTFIX_TLS_POLICY_SERVICE_TLS_CERT_FILE

**Default**: *empty*

Path to client certificate file for TLS policy service TLS authentication.

#### POSTFIX_TLS_POLICY_SERVICE_TLS_CERT_KEY_FILE

**Default**: *empty*

Path to client certificate key file for TLS policy service TLS authentication.

### Sender canonical map (SRS forward)

#### POSTFIX_SENDER_CANONICAL_MAP_HOST

**Default**: *empty*

Sender canonical map service hostname (e.g., postsrsd for SRS).

#### POSTFIX_SENDER_CANONICAL_MAP_PORT

**Default**: `11380`

Sender canonical map service port.

#### POSTFIX_SENDER_CANONICAL_MAP_TABLE

**Default**: `forward`

Sender canonical map table name.

#### POSTFIX_SENDER_CANONICAL_MAP_TLS

**Default**: `0`

Enable TLS for sender canonical map connections. Set to `1` to enable.

#### POSTFIX_SENDER_CANONICAL_MAP_TLS_SKIP_VERIFY

**Default**: `0`

Skip TLS certificate verification for sender canonical map. Set to `1` to skip (not recommended for production).

#### POSTFIX_SENDER_CANONICAL_MAP_TLS_CA_FILE

**Default**: *empty*

Path to CA certificate file for sender canonical map TLS verification.

#### POSTFIX_SENDER_CANONICAL_MAP_TLS_CERT_FILE

**Default**: *empty*

Path to client certificate file for sender canonical map TLS authentication.

#### POSTFIX_SENDER_CANONICAL_MAP_TLS_CERT_KEY_FILE

**Default**: *empty*

Path to client certificate key file for sender canonical map TLS authentication.

### Recipient canonical map (SRS reverse)

#### POSTFIX_RECIPIENT_CANONICAL_MAP_HOST

**Default**: *empty*

Recipient canonical map service hostname (e.g., postsrsd for SRS).

#### POSTFIX_RECIPIENT_CANONICAL_MAP_PORT

**Default**: `11380`

Recipient canonical map service port.

#### POSTFIX_RECIPIENT_CANONICAL_MAP_TABLE

**Default**: `reverse`

Recipient canonical map table name.

#### POSTFIX_RECIPIENT_CANONICAL_MAP_TLS

**Default**: `0`

Enable TLS for recipient canonical map connections. Set to `1` to enable.

#### POSTFIX_RECIPIENT_CANONICAL_MAP_TLS_SKIP_VERIFY

**Default**: `0`

Skip TLS certificate verification for recipient canonical map. Set to `1` to skip (not recommended for production).

#### POSTFIX_RECIPIENT_CANONICAL_MAP_TLS_CA_FILE

**Default**: *empty*

Path to CA certificate file for recipient canonical map TLS verification.

#### POSTFIX_RECIPIENT_CANONICAL_MAP_TLS_CERT_FILE

**Default**: *empty*

Path to client certificate file for recipient canonical map TLS authentication.

#### POSTFIX_RECIPIENT_CANONICAL_MAP_TLS_CERT_KEY_FILE

**Default**: *empty*

Path to client certificate key file for recipient canonical map TLS authentication.

### TLSRPT

#### POSTFIX_TLSRPT_LOG_LEVEL

**Default**: `warn`

Log level for `tlsrpt-collectd` (the SMTP TLS connection data collector). Values: `debug`, `info`, `warn`, `error`, `critical`.

**Note**: Share the `/var/lib/tlsrpt` volume with `container-tlsrpt-reporter` to enable TLSRPT report generation and delivery.

## References

- [Postfix documentation](https://www.postfix.org/documentation.html)
- [Postfix configuration parameters](https://www.postfix.org/postconf.5.html)
- [RFC 6698 — DANE](https://www.rfc-editor.org/rfc/rfc6698)
- [RFC 8461 — MTA-STS](https://www.rfc-editor.org/rfc/rfc8461)
- [RFC 8460 — SMTP TLS Reporting](https://www.rfc-editor.org/rfc/rfc8460)
