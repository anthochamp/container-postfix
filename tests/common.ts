import * as path from "node:path";

import type { DockerContainerRunOptions } from "@ac-kit/cmd-docker";
import { encodeTextUtf8, getRandomEphemeralPort } from "@ac-kit/core";
import type { EnvVariables } from "@ac-kit/format-shell";
import { initDockerSuite } from "@ac-kit/integration-test-util";
import { TcpSocket } from "@ac-kit/node";
import type { StartedTestContainer } from "testcontainers";
import { GenericContainer, Wait } from "testcontainers";
import { afterAll, beforeAll, vi } from "vitest";

const srcPath = path.resolve(path.join(__dirname, "..", "src"));

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

async function isSmtpdReady(port: number): Promise<boolean> {
	const client = TcpSocket.from();
	try {
		await client.connect(port, { host: "127.0.0.1" });
		client.timeout = 1000;
		return await new Promise<boolean>((resolve) => {
			let received = "";
			let done = false;
			client.stream.on("data", (chunk) => {
				received += chunk.toString();
				if (!done && received.includes("220 ")) {
					done = true;
					void client.write(encodeTextUtf8("QUIT\r\n"));
					void client.end();
					resolve(true);
				}
			});
			client.subscribe("timeout", () => {
				if (!done) {
					done = true;
					void client.end();
					resolve(false);
				}
			});
			client.subscribe("error", () => {
				if (!done) {
					done = true;
					resolve(false);
				}
			});
			client.subscribe("close", () => {
				if (!done) {
					done = true;
					resolve(false);
				}
			});
		});
	} catch {
		return false;
	}
}

type ContainerRunOptions = Omit<
	DockerContainerRunOptions,
	"name" | "context" | "detach"
>;

export function initSuite() {
	let mariadb: StartedTestContainer;
	let dbPort: number;

	let pendingRunOptions: ContainerRunOptions = {};
	let pendingWaitReady: () => Promise<void> = async () => {};

	const { containerImageName } = initDockerSuite(srcPath, {
		containerNamePrefix: "test-postfix-",
		containerRunOptions: () => pendingRunOptions,
		onContainerStarted: () => pendingWaitReady(),
	});

	beforeAll(async () => {
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
	});

	afterAll(async () => {
		await mariadb.stop();
	});

	return {
		containerImageName,
		/** Registers the container's env for every test in this describe. */
		useContainer: (env?: EnvVariables) => {
			const smtpPort = getRandomEphemeralPort();

			beforeAll(() => {
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

				pendingRunOptions = {
					addHost: ["host.docker.internal:host-gateway"],
					publish: [`${smtpPort}:25`],
					env: { ...baseEnv, ...env },
				};
				pendingWaitReady = async () => {
					// Wait until smtpd is ready to greet — not just the port is open.
					await vi.waitUntil(() => isSmtpdReady(smtpPort), {
						timeout: 30_000,
						interval: 1000,
					});
				};
			});

			return { smtpPort };
		},
	};
}
