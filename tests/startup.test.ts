import { dockerContainerRun } from "@ac-kit/cmd-docker";
import { expect, describe, it } from "vitest";

import { initSuite } from "./common";

describe("startup", () => {
	const { containerImageName } = initSuite();

	it("fails when SASL host is set but SASL port is missing", async () => {
		await expect(
			dockerContainerRun(containerImageName, {
				rm: true,
				env: { POSTFIX_SASL_HOST: "127.0.0.1" },
			}),
		).rejects.toThrow();
	});

	it("fails when LMTP TLS is enabled but port is missing", async () => {
		await expect(
			dockerContainerRun(containerImageName, {
				rm: true,
				env: {
					POSTFIX_TRANSPORT_LMTP_HOST: "127.0.0.1",
					POSTFIX_TRANSPORT_LMTP_TLS: "1",
				},
			}),
		).rejects.toThrow();
	});

	it("fails when rcpt-policy host is set but port is missing", async () => {
		await expect(
			dockerContainerRun(containerImageName, {
				rm: true,
				env: { POSTFIX_RCPT_POLICY_SERVICE_HOST: "127.0.0.1" },
			}),
		).rejects.toThrow();
	});

	it("fails when milter TLS is enabled but port is missing", async () => {
		await expect(
			dockerContainerRun(containerImageName, {
				rm: true,
				env: {
					POSTFIX_MILTER_HOST: "127.0.0.1",
					POSTFIX_MILTER_TLS: "1",
				},
			}),
		).rejects.toThrow();
	});

	it("fails when sender-canonical-map TLS is enabled but port is missing", async () => {
		await expect(
			dockerContainerRun(containerImageName, {
				rm: true,
				env: {
					POSTFIX_SENDER_CANONICAL_MAP_HOST: "127.0.0.1",
					POSTFIX_SENDER_CANONICAL_MAP_TLS: "1",
				},
			}),
		).rejects.toThrow();
	});

	it("fails when recipient-canonical-map TLS is enabled but port is missing", async () => {
		await expect(
			dockerContainerRun(containerImageName, {
				rm: true,
				env: {
					POSTFIX_RECIPIENT_CANONICAL_MAP_HOST: "127.0.0.1",
					POSTFIX_RECIPIENT_CANONICAL_MAP_TLS: "1",
				},
			}),
		).rejects.toThrow();
	});

	it("fails when TLS policy service TLS is enabled but port is missing", async () => {
		await expect(
			dockerContainerRun(containerImageName, {
				rm: true,
				env: {
					POSTFIX_TLS_POLICY_SERVICE_HOST: "127.0.0.1",
					POSTFIX_TLS_POLICY_SERVICE_TLS: "1",
				},
			}),
		).rejects.toThrow();
	});
});
