# Dojo intro x Moon Bag Vibes

# How to Play

- Connect Wallet
- Gift Moon Rocks to get the (fake) currency to play the game
- Click Start Game
- Pull Orbs!

Extras:
- Visit the Shop to buy more Orbs if you survive past level 1
- Gamble to get to the end of a level or Quit Early to cash out the Points back into Moon Rocks

## Setup

To work with Dojo, a docker image with all the binaries is available on the [Dojo repository](https://github.com/dojoengine/dojo/pkgs/container/dojo).

```bash
docker pull ghcr.io/dojoengine/dojo:v1.5.0

# You will then want to use host network for development and mount the contracts directory.
```

Or you can use `dojoup` script to install the latest binaries for your OS:
```
curl -L https://install.dojoengine.org | bash
source ~/.bashrc
dojoup install
```

Or you can use `asdf`:

```bash
asdf plugin add dojo https://github.com/dojoengine/asdf-dojo
asdf install dojo 1.5.0
asdf set -u dojo 1.5.0
```

Don't forget to have also Scarb installed, using `asdf` being the recommended way to go:

```bash
asdf plugin add scarb
asdf install scarb 2.10.1
asdf set -u scarb 2.10.1
```

To run Katana, in some cases, you may need to use `brew` to install the following:

```bash
brew install llvm@19 --quiet
```

## Contracts

To work on the contracts, change directory to `contracts` and do:

```bash
# Build the contracts.
sozo build
```

```
# Declare and deploys the contract on the configured network
sozo migrate
```

## Client

A very simple vite project without any framework, configured to use `https` locally to use [Cartridge controller](https://docs.cartridge.gg/controller/overview) wallet.

Heads to the `client` directory and do:

```bash
pnpm install
pnpm run dev
```

## Working with Dojo toolchain

Katana is a starknet sequencer that is optimized for performance and low latency, but can also be used as a local development node.

Torii is the automatic indexer for Dojo, it will index the state of the contracts and make it available to the client.

```bash
# Start Katana
katana --config contracts/katana.toml

# Start Torii
torii --config contracts/torii_dev.toml
```
