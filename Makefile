.PHONY: all install dev start seed test test-js test-py py-audit docker-build docker-run clean

all: install test

install:
	npm install

dev:
	node server/index.js

start:
	node server/index.js

seed:
	npm run seed

test: test-js test-py

test-js:
	npm run test:js

test-py:
	python -m unittest discover -s tests -p "*.py"

py-audit:
	python py_security_tools/vault_audit.py

docker-build:
	docker build -t passvault:latest .

docker-run:
	docker-compose up -d

clean:
	rm -rf node_modules passvault.db
