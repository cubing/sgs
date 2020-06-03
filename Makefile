.PHONY: test
test:
	npx ts-node --transpile-only ./src/test/benchmark.ts 2x2x2

