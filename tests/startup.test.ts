import { expect, suite, test } from "vitest";
import { docker, initSuite } from "./common";

suite.sequential("startup", () => {
	const { containerImageName } = initSuite();

	test("fails when SASL host is set but SASL port is missing", async () => {
		await expect(
			docker(`run --rm -e POSTFIX_SASL_HOST=127.0.0.1 ${containerImageName}`),
		).rejects.toThrow();
	});

	test("fails when LMTP TLS is enabled but port is missing", async () => {
		await expect(
			docker(
				`run --rm -e POSTFIX_TRANSPORT_LMTP_HOST=127.0.0.1 -e POSTFIX_TRANSPORT_LMTP_TLS=1 ${containerImageName}`,
			),
		).rejects.toThrow();
	});

	test("fails when rcpt-policy host is set but port is missing", async () => {
		await expect(
			docker(
				`run --rm -e POSTFIX_RCPT_POLICY_SERVICE_HOST=127.0.0.1 ${containerImageName}`,
			),
		).rejects.toThrow();
	});

	test("fails when milter TLS is enabled but port is missing", async () => {
		await expect(
			docker(
				`run --rm -e POSTFIX_MILTER_HOST=127.0.0.1 -e POSTFIX_MILTER_TLS=1 ${containerImageName}`,
			),
		).rejects.toThrow();
	});

	test("fails when sender-canonical-map TLS is enabled but port is missing", async () => {
		await expect(
			docker(
				`run --rm -e POSTFIX_SENDER_CANONICAL_MAP_HOST=127.0.0.1 -e POSTFIX_SENDER_CANONICAL_MAP_TLS=1 ${containerImageName}`,
			),
		).rejects.toThrow();
	});

	test("fails when recipient-canonical-map TLS is enabled but port is missing", async () => {
		await expect(
			docker(
				`run --rm -e POSTFIX_RECIPIENT_CANONICAL_MAP_HOST=127.0.0.1 -e POSTFIX_RECIPIENT_CANONICAL_MAP_TLS=1 ${containerImageName}`,
			),
		).rejects.toThrow();
	});

	test("fails when TLS policy service TLS is enabled but port is missing", async () => {
		await expect(
			docker(
				`run --rm -e POSTFIX_TLS_POLICY_SERVICE_HOST=127.0.0.1 -e POSTFIX_TLS_POLICY_SERVICE_TLS=1 ${containerImageName}`,
			),
		).rejects.toThrow();
	});
});
