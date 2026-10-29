.PHONY: install lint test e2e run

install:
	npm ci

lint:
	npm run lint && npm run format:check

test:
	npm run test:coverage

e2e:
	npm run test:e2e

run:
	npm run dev -w apps/web
