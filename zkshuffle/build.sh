#!/bin/bash
set -e

build_directory="./build"

if [ ! -d "$build_directory" ]; then
    mkdir -p "$build_directory"
fi
circom ./circuits/suitest.circom --r1cs --wasm -o ./build
circom ./circuits/decrypt/decrypt.circom --r1cs --wasm -o ./build
circom ./circuits/shuffle_encrypt/shuffle_encrypt.circom --r1cs --wasm -o ./build
