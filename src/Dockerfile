FROM alpine:3.23.3@sha256:25109184c71bdad752c8312a8623239686a9a2071e8825f20acb8f2198c3f659 AS builder

SHELL ["/bin/ash", "-eo", "pipefail", "-c"]

# hadolint ignore=DL3018
RUN apk add --no-cache gcc musl-dev python3 python3-dev py3-pip

# renovate: datasource=github-releases depName=sys4/tlsrpt-reporter
ARG TLSRPT_REPORTER_VERSION=0.5.0

# Install tlsrpt-reporter in venv
RUN set -ex; \
	python3 -m venv /opt/tlsrpt-venv; \
	/opt/tlsrpt-venv/bin/pip install --no-cache-dir --upgrade pip; \
	/opt/tlsrpt-venv/bin/pip install --no-cache-dir \
	"https://github.com/sys4/tlsrpt-reporter/archive/refs/tags/v${TLSRPT_REPORTER_VERSION}.tar.gz"

FROM alpine:3.23.3@sha256:25109184c71bdad752c8312a8623239686a9a2071e8825f20acb8f2198c3f659

# hadolint ignore=DL3018
RUN apk add --update --no-cache jinja2-cli supervisor stunnel \
	postfix postfix-mysql postfix-pcre \
	python3

# Create tlsrpt user and directories
RUN set -ex; \
	addgroup -g 1100 -S tlsrpt; \
	adduser -u 1100 -S -D -H -G tlsrpt tlsrpt; \
	mkdir -p /var/lib/tlsrpt /run/tlsrpt; \
	chown tlsrpt:tlsrpt /var/lib/tlsrpt /run/tlsrpt

# Copy venv from builder
COPY --from=builder /opt/tlsrpt-venv /opt/tlsrpt-venv

COPY --chmod=644 \
	/rootfs/etc/postfix/main.cf.j2 \
	/rootfs/etc/postfix/master.cf \
	/rootfs/etc/postfix/mua_privacy_filters.map \
	/etc/postfix/
COPY --chmod=640 \
	/rootfs/etc/postfix/mysql-recipient-access.cf.j2 \
	/rootfs/etc/postfix/mysql-sender-login-maps.cf.j2 \
	/rootfs/etc/postfix/mysql-virtual-alias-maps.cf.j2 \
	/rootfs/etc/postfix/mysql-virtual-mailbox-domains.cf.j2 \
	/rootfs/etc/postfix/mysql-virtual-mailbox-maps.cf.j2 \
	/etc/postfix/
COPY --chmod=640 /rootfs/etc/stunnel/stunnel.conf.j2 /etc/stunnel/
COPY --chmod=644 /rootfs/etc/supervisord.conf /etc/supervisord.conf
COPY --chmod=644 /rootfs/etc/syslog.conf /etc/syslog.conf
COPY --chmod=640 /rootfs/etc/tlsrpt/collectd.cfg.j2 /etc/tlsrpt/collectd.cfg.j2
COPY --chmod=755 /rootfs/usr/local/bin/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN set -ex; \
	mkdir -p /run/stunnel; \
	chown stunnel:stunnel /run/stunnel

# smtp (25), submissions/smtps (465), submission (587)
EXPOSE 25 465 587

VOLUME ["/etc/ssl/postfix", "/var/spool/postfix", "/var/lib/tlsrpt"]

ENTRYPOINT ["docker-entrypoint.sh"]

CMD [ "supervisord", "-c", "/etc/supervisord.conf" ]

HEALTHCHECK \
	CMD postfix status || exit 1
