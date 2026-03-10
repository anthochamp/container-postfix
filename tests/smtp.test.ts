import { TcpClient } from "@ac-essentials/misc-util";
import { expect, suite, test } from "vitest";
import { initSuite } from "./common";

// Conducts an SMTP EHLO handshake and returns all 250 extension lines.
async function smtpEhlo(host: string, port: number): Promise<string[]> {
	const client = TcpClient.from();
	await client.connect(port, host);

	return new Promise<string[]>((resolve, reject) => {
		const lines: string[] = [];
		let buffer = "";
		let greeted = false;
		let done = false;

		const finish = (fn: () => void) => {
			if (!done) {
				done = true;
				fn();
			}
		};

		client.socket.on("data", (chunk) => {
			buffer += chunk.toString();

			let newlineIdx: number;
			while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
				const line = buffer.slice(0, newlineIdx).replace(/\r$/, "");
				buffer = buffer.slice(newlineIdx + 1);

				if (!greeted && line.startsWith("220")) {
					greeted = true;
					void client.write("EHLO test.example.local\r\n");
				} else if (greeted) {
					lines.push(line);
					if (line.startsWith("250 ")) {
						void client.write("QUIT\r\n");
						void client.end();
						finish(() => resolve(lines));
						return;
					}
					if (!line.startsWith("250")) {
						void client.end();
						finish(() => reject(new Error(`Unexpected SMTP line: ${line}`)));
						return;
					}
				}
			}
		});

		client.socket.on("error", (err) => finish(() => reject(err)));
		client.socket.on("close", () =>
			finish(() =>
				reject(new Error("Connection closed before EHLO completed")),
			),
		);
	});
}

suite.sequential("smtp", () => {
	const { startContainer } = initSuite();

	test("advertises the default message size limit in EHLO", async () => {
		const { smtpPort } = await startContainer();

		const lines = await smtpEhlo("127.0.0.1", smtpPort);
		const sizeLine = lines.find((l) => /^250[-\s]SIZE\b/.test(l));

		expect(sizeLine).toBeDefined();
		expect(sizeLine).toMatch(/SIZE 10485760/);
	});

	test("advertises a custom message size limit set via POSTFIX_MESSAGE_SIZE_LIMIT", async () => {
		const { smtpPort } = await startContainer({
			env: { POSTFIX_MESSAGE_SIZE_LIMIT: "5242880" },
		});

		const lines = await smtpEhlo("127.0.0.1", smtpPort);
		const sizeLine = lines.find((l) => /^250[-\s]SIZE\b/.test(l));

		expect(sizeLine).toBeDefined();
		expect(sizeLine).toMatch(/SIZE 5242880/);
	});
});
