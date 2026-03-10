import { randomBytes } from "node:crypto";
import * as path from "node:path";
import {
	dockerBuildxBuild,
	dockerContainerRm,
	dockerContextShow,
	dockerContextUse,
	dockerImageRm,
} from "@ac-essentials/cli";
import {
	type EnvVariables,
	escapeCommandArg,
	execAsync,
	getRandomEphemeralPort,
	TcpClient,
} from "@ac-essentials/misc-util";
import type { StartedTestContainer } from "testcontainers";
import { GenericContainer, Wait } from "testcontainers";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

const srcPath = path.resolve(path.join(__dirname, "..", "src"));

export const docker = (cmd: string) =>
	execAsync(`docker --context default ${cmd}`, { encoding: "utf-8" });

const MYSQL_PORT = 3306;

const DB_NAME = "mail";
const DB_USER = "postfix";
const DB_PASSWORD = "postfix";

// Minimal DDL: tables must exist so postfix mysql lookup workers can connect.
// No rows needed — EHLO does not trigger any lookup.
const INIT_SQL = `
CREATE TABLE domains (
  name VARCHAR(255) NOT NULL PRIMARY KEY
);
CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  local VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  email VARCHAR(510) GENERATED ALWAYS AS (CONCAT(local, '@', domain)) STORED,
  sendonly TINYINT(1) NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1
);
CREATE TABLE aliases (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  source_local VARCHAR(255) NOT NULL,
  source_domain VARCHAR(255) NOT NULL,
  source VARCHAR(510) GENERATED ALWAYS AS (CONCAT(source_local, '@', source_domain)) STORED,
  destination VARCHAR(510) NOT NULL,
  is_regex TINYINT(1) NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1
);
`;

type StartContainerOptions = {
	env?: EnvVariables;
};

export function initSuite() {
	let initialContext: string;
	const containerName = `test-postfix-${randomBytes(8).toString("hex")}`;
	const containerImageName = `${containerName}-img`;
	let mariadb: StartedTestContainer;
	let dbPort: number;

	async function stopContainer() {
		try {
			await dockerContainerRm([containerName], { force: true });
		} catch (_) {}
	}

	beforeAll(async () => {
		initialContext = await dockerContextShow();
		await dockerContextUse("default");

		await stopContainer();

		try {
			await dockerImageRm([containerImageName], { force: true });
		} catch (_) {}

		mariadb = await new GenericContainer("mariadb:11")
			.withEnvironment({
				MARIADB_DATABASE: DB_NAME,
				MARIADB_USER: DB_USER,
				MARIADB_PASSWORD: DB_PASSWORD,
				MARIADB_ROOT_PASSWORD: "root",
				MARIADB_INITDB_SKIP_TZINFO: "1",
			})
			.withCopyContentToContainer([
				{ content: INIT_SQL, target: "/docker-entrypoint-initdb.d/schema.sql" },
			])
			.withExposedPorts(MYSQL_PORT)
			.withWaitStrategy(Wait.forListeningPorts())
			.start();

		dbPort = mariadb.getMappedPort(MYSQL_PORT);

		await dockerBuildxBuild(srcPath, { tags: [containerImageName] });
	});

	afterAll(async () => {
		try {
			await dockerImageRm([containerImageName], { force: true });
		} catch (_) {}
		try {
			await mariadb.stop();
		} catch (_) {}
		try {
			await dockerContextUse(initialContext);
		} catch (_) {}
	});

	afterEach(async () => {
		await stopContainer();
	});

	return {
		startContainer: async (options?: StartContainerOptions) => {
			const smtpPort = getRandomEphemeralPort();

			const baseEnv: EnvVariables = {
				POSTFIX_TRANSPORT_LMTP_HOST: "127.0.0.1",
				POSTFIX_SASL_HOST: "127.0.0.1",
				POSTFIX_SASL_PORT: "12345",
				POSTFIX_RCPT_POLICY_SERVICE_HOST: "127.0.0.1",
				POSTFIX_RCPT_POLICY_SERVICE_PORT: "9998",
				// Postfix mysql config `hosts` supports host:port format.
				POSTFIX_MYSQL_HOST: `host.docker.internal:${dbPort}`,
				POSTFIX_MYSQL_USERNAME: DB_USER,
				POSTFIX_MYSQL_PASSWORD: DB_PASSWORD,
				POSTFIX_MYSQL_DATABASE: DB_NAME,
			};

			const env = { ...baseEnv, ...options?.env };
			const envArgs = Object.entries(env)
				.map(([k, v]) => `-e ${escapeCommandArg(`${k}=${v}`)}`)
				.join(" ");

			await docker(
				`run -d --name ${containerName}` +
					" --add-host host.docker.internal:host-gateway" +
					` -p ${smtpPort}:25` +
					` ${envArgs}` +
					` ${containerImageName}`,
			);

			// Wait until smtpd is ready to greet — not just the port is open.
			await vi.waitUntil(
				async () => {
					const client = TcpClient.from();
					try {
						await client.connect(smtpPort, "127.0.0.1");
						client.socket.setTimeout(1000);
						return await new Promise<boolean>((resolve) => {
							let received = "";
							let done = false;
							client.socket.on("data", (chunk) => {
								received += chunk.toString();
								if (!done && received.includes("220 ")) {
									done = true;
									void client.write("QUIT\r\n");
									void client.end();
									resolve(true);
								}
							});
							client.socket.on("timeout", () => {
								if (!done) {
									done = true;
									void client.end();
									resolve(false);
								}
							});
							client.socket.on("error", () => {
								if (!done) {
									done = true;
									resolve(false);
								}
							});
							client.socket.on("close", () => {
								if (!done) {
									done = true;
									resolve(false);
								}
							});
						});
					} catch {
						return false;
					}
				},
				{ timeout: 30_000, interval: 1000 },
			);

			return { smtpPort };
		},
		containerImageName,
	};
}
