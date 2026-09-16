import { SmtpClient } from "@ac-kit/net-smtp";
import { DuplexTransport } from "@ac-kit/net-transport-node";
import { TcpSocket } from "@ac-kit/node";
import { expect, describe, it } from "vitest";

import { initSuite } from "./common";

// Conducts an SMTP EHLO handshake and returns all 250 extension lines.
async function smtpEhlo(host: string, port: number): Promise<string[]> {
	const socket = TcpSocket.from();
	const client = new SmtpClient(new DuplexTransport(socket.stream), {
		defaultTimeoutMs: 5000,
	});
	const greeting = client.wait("push");
	await socket.connect(port, { host });
	await greeting;
	try {
		const response = await client.ehlo("test.example.local");
		return response.lines;
	} finally {
		if (!socket.closed && !socket.destroyed) {
			await client.quit();
		}
		if (!socket.closed && !socket.destroyed) {
			await socket.end();
		}
	}
}

describe("smtp", () => {
	const { useContainer } = initSuite();

	describe("default message size limit", () => {
		const { smtpPort } = useContainer();

		it("advertises the default message size limit in EHLO", async () => {
			const lines = await smtpEhlo("127.0.0.1", smtpPort);
			const sizeLine = lines.find((l) => /^SIZE\b/.test(l));

			expect(sizeLine).toBeDefined();
			expect(sizeLine).toMatch(/SIZE 10485760/);
		});
	});

	describe("POSTFIX_MESSAGE_SIZE_LIMIT=5242880", () => {
		const { smtpPort } = useContainer({
			POSTFIX_MESSAGE_SIZE_LIMIT: "5242880",
		});

		it("advertises the custom message size limit in EHLO", async () => {
			const lines = await smtpEhlo("127.0.0.1", smtpPort);
			const sizeLine = lines.find((l) => /^SIZE\b/.test(l));

			expect(sizeLine).toBeDefined();
			expect(sizeLine).toMatch(/SIZE 5242880/);
		});
	});
});
