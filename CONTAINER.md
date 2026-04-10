# Postfix Container

Container images based on [Postfix](http://www.postfix.org/), pre-configured for virtual mail hosting with MySQL, LMTP delivery, SASL authentication, milter filtering, SRS (canonical maps), DANE/MTA-STS (TLS policy), and TLSRPT.

Sources are available on [GitHub](https://github.com/anthochamp/container-postfix).

See [README.md](README.md) for full documentation.

## Image tags

- `x.y.z-postfixA.B.C`: Container image version `x.y.z` with Postfix `A.B.C`.
- `edge-postfixA.B.C`: Latest commit build with Postfix `A.B.C`.

**Tag aliases:**

- `x.y-postfixA.B.C`: Latest patch of `x.y` with Postfix `A.B.C`.
- `x-postfixA.B.C`: Latest minor+patch of `x` with Postfix `A.B.C`.
- `x.y.z-postfixA.B`: Version `x.y.z` with latest patch of Postfix `A.B` (only latest container version updated).
- `x.y-postfixA.B`: Latest patch of `x.y` with latest patch of Postfix `A.B`.
- `x-postfixA.B`: Latest minor+patch of `x` with latest patch of Postfix `A.B`.
- `x.y.z-postfixA`: Version `x.y.z` with latest minor+patch of Postfix `A` (only latest container version updated).
- `x.y-postfixA`: Latest patch of `x.y` with latest minor+patch of Postfix `A`.
- `x-postfixA`: Latest minor+patch of `x` with latest minor+patch of Postfix `A`.
- `x.y.z`: Version `x.y.z` with latest Postfix (only latest container version updated).
- `x.y`: Latest patch of `x.y` with latest Postfix.
- `x`: Latest minor+patch of `x` with latest Postfix.
- `postfixA.B.C`: Latest container with Postfix `A.B.C`.
- `postfixA.B`: Latest container with latest patch of Postfix `A.B`.
- `postfixA`: Latest container with latest minor+patch of Postfix `A`.
- `latest`: Latest `x.y.z-postfixA.B.C` tag.
- `edge-postfixA.B`: Latest commit build with latest patch of Postfix `A.B`.
- `edge-postfixA`: Latest commit build with latest minor+patch of Postfix `A`.
- `edge`: Latest `edge-postfixA.B.C` tag.
