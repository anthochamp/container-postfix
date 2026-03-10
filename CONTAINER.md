# Postfix Container

Container images based on [Postfix](http://www.postfix.org/), pre-configured for virtual mail hosting with MySQL, LMTP delivery, SASL authentication, milter filtering, SRS (canonical maps), DANE/MTA-STS (TLS policy), and TLSRPT.

Sources are available on [GitHub](https://github.com/anthochamp/container-postfix).

See [README.md](README.md) for full documentation.

## Image tags

- `x.y.z-postfixA.B.C`: Container image version `x.y.z` with Postfix `A.B.C`.
- `edge-postfixA.B.C`: Latest commit build with Postfix `A.B.C`.

**Tag aliases:**

- `x.y-postfixA.B.C`: Latest patch of `x.y` (major.minor) with Postfix `A.B.C`.
- `x-postfixA.B.C`: Latest minor+patch of `x` (major) with Postfix `A.B.C`.
- `x.y.z`: Version `x.y.z` with latest Postfix (only latest container version updated).
- `x.y`: Latest patch of `x.y` (major.minor) with latest Postfix (only latest container major.minor updated).
- `x`: Latest minor+patch of `x` (major) with latest Postfix (only latest container major updated).
- `postfixA.B`: Latest container with latest patch of Postfix `A.B` (major.minor).
- `postfixA`: Latest container with latest minor+patch of Postfix `A` (major).
- `latest`: Latest `x.y.z-postfixA.B.C` tag.
- `edge-postfixA.B`: Latest commit build with latest patch of Postfix `A.B` (major.minor).
- `edge-postfixA`: Latest commit build with latest minor+patch of Postfix `A` (major).
- `edge`: Latest `edge-postfixA.B.C` tag.
