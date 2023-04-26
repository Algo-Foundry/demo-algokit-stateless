# Stateless Smart Contract Demo

This repository contains sample codes to compile a stateless smart contract into a contract account or delegated signature using Algokit.

## Setup instructions

### Install python packages via AlgoKit
run `algokit bootstrap poetry` within this folder

### Install JS packages
run `yarn install`

### Update environement variables
1. Copy `.env.example` to `.env`
2. Update Algorand Sandbox credentials in `.env` file
3. Update accounts in `.env` file

### Update receiver address
In `stateless_sc.py`, update receiver's address to `ACC2_ADDR`'s in the env file

### Initialize virtual environment
run `poetry shell`

### Compile contracts
run `python stateless_sc.py`

### Stateless smart contract to contract account
run `node scripts/contract_account.js`

### Stateless smart contract to delegated signature
run `node scripts/delegate.js`