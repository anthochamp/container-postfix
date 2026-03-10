import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		env: { TESTCONTAINERS_RYUK_DISABLED: "true" },
		testTimeout: 60_000,
		hookTimeout: 300_000,
		isolate: true,
		fileParallelism: false,
		sequence: {
			concurrent: false,
		},
	},
});
