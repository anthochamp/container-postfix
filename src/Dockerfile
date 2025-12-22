FROM alpine:3.23.2@sha256:865b95f46d98cf867a156fe4a135ad3fe50d2056aa3f25ed31662dff6da4eb62

# hadolint ignore=DL3018
RUN apk add --update --no-cache jinja2-cli supervisor stunnel \
	postfix postfix-mysql postfix-pcre

COPY --chmod=644 /rootfs/config /etc/postfix/
COPY --chmod=644 /rootfs/supervisord.conf /etc
COPY --chmod=644 /rootfs/syslog.conf /etc

RUN set -ex; \
	mkdir -p /run/stunnel; \
	chown stunnel:stunnel /run/stunnel
COPY --chmod=644 /rootfs/stunnel.conf.j2 /etc/stunnel

# smtp (25), submissions/smtps (465), submission (587)
EXPOSE 25 465 587

VOLUME ["/etc/ssl/postfix", "/var/spool/postfix"]

COPY --chmod=755 /rootfs/docker-entrypoint.sh /

ENTRYPOINT ["./docker-entrypoint.sh"]

CMD [ "supervisord", "-c", "/etc/supervisord.conf" ]

HEALTHCHECK \
	CMD postfix status || exit 1
