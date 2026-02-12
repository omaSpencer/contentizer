# Contentizer – egyszerű parancsok
# Használat: make dev | make build | make install | stb.

.PHONY: install dev build clean lint check-rust rustup-default

# .env betöltése, ha létezik (pl. CONTENTIZER_API_KEY)
-include .env
export

# Alapértelmezett: help
help:
	@echo "Parancsok:"
	@echo "  make install   - npm install"
	@echo "  make dev       - Tauri dev szerver (.env-ból tölti az API kulcsot)"
	@echo "  make build     - Tauri production build"
	@echo "  make clean     - node_modules, dist, Rust target törlése"
	@echo "  make lint      - ESLint"
	@echo "  make check-rust - Cargo telepítve van-e (ha make dev hibázik)"
	@echo "  make rustup-default - Rustup: alapértelmezett toolchain (stable) beállítása"

install:
	npm install

# Rust PATH (rustup): ha a terminál nem töltötte be ~/.cargo/env
CARGO_ENV := $(HOME)/.cargo/env
RUN_WITH_RUST = [ -f "$(CARGO_ENV)" ] && . "$(CARGO_ENV)"; 

# Fejlesztés: .env betöltése, majd tauri dev
dev:
	@$(RUN_WITH_RUST) command -v cargo >/dev/null 2>&1 || { echo "Hiba: Cargo nincs a PATH-on. Telepítsd: brew install rust"; exit 1; }
	@$(RUN_WITH_RUST) if [ -f .env ]; then set -a && . ./.env && set +a; fi; npm run tauri dev

build:
	@$(RUN_WITH_RUST) command -v cargo >/dev/null 2>&1 || { echo "Hiba: Cargo nincs a PATH-on. Telepítsd: brew install rust"; exit 1; }; npm run build && cd src-tauri && cargo build --release

clean:
	rm -rf node_modules dist
	rm -rf src-tauri/target

lint:
	npm run lint

check-rust:
	@$(RUN_WITH_RUST) command -v cargo >/dev/null 2>&1 && echo "Cargo: OK ($$(cargo --version))" || echo "Cargo: NINCS telepítve. Telepítsd: brew install rust"

# Ha a cargo a rustup shim és „no default toolchain” a hiba: ezzel beállítod a stable-t
rustup-default:
	@"$(HOME)/.cargo/bin/rustup" default stable
