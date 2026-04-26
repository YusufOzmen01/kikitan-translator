#!/usr/bin/env python3
"""
Sign files exactly like Tauri's updater does.
Implements minisign from scratch - no minisign Python library needed.

pip install cryptography PyNaCl
Usage: python sign.py <file> [-k <base64_key>] [-p <password>]
"""

import argparse
import base64
import getpass
import hashlib
import os
import struct
import sys
import time
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt


# --- Minisign secret key format ---
# base64 decoded secret key file (line 2) is:
#   sig_algo     2 bytes  "Ed"
#   kdf_algo     2 bytes  "Sc"
#   cksum_algo   2 bytes  "B2"
#   kdf_salt    32 bytes
#   kdf_opslimit 8 bytes  little-endian uint64
#   kdf_memlimit 8 bytes  little-endian uint64
#   keynum_sk  104 bytes  XOR'd with kdf output:
#                           key_id      8 bytes
#                           secret_key 32 bytes  (Ed25519 seed)
#                           public_key 32 bytes
#                           checksum   32 bytes  Blake2b-256

HEADER_SIZE = 2 + 2 + 2 + 32 + 8 + 8  # = 54
KEYNUM_SK_SIZE = 8 + 32 + 32 + 32      # = 104


def decode_tauri_key(b64_key: str) -> str:
    """Tauri wraps the minisign key in an extra layer of base64."""
    return base64.b64decode(b64_key.strip()).decode("utf-8")


def parse_and_decrypt_secret_key(key_str: str, password: str) -> tuple[bytes, bytes]:
    """
    Parse a minisign secret key file and decrypt it.
    Returns (key_id, ed25519_seed).
    """
    lines = key_str.strip().splitlines()
    # Line 0: untrusted comment, Line 1: base64 payload
    raw = base64.b64decode(lines[1])

    sig_algo  = raw[0:2]
    kdf_algo  = raw[2:4]
    kdf_salt  = raw[6:38]
    ops_limit = struct.unpack_from("<Q", raw, 38)[0]
    mem_limit = struct.unpack_from("<Q", raw, 46)[0]
    keynum_sk = bytearray(raw[54:54 + KEYNUM_SK_SIZE])

    assert sig_algo == b"Ed", "Unexpected signature algorithm"
    assert kdf_algo == b"Sc", "Unexpected KDF algorithm"

    # Derive key material from password using scrypt
    # minisign uses libsodium's scrypt, which maps to:
    #   N = mem_limit / (ops_limit / 32768 * 32)  (but we can use the raw params directly)
    # libsodium opslimit/memlimit -> scrypt N, r, p:
    #   r = 8 (always)
    #   N = 2^ceil(log2(mem_limit / (ops_limit / 32768 * 32)))
    # In practice for sensitive params: opslimit=33554432, memlimit=1073741824
    #   -> N=2^20, r=8, p=1  ... but let's compute properly
    n, r, p = libsodium_scrypt_params(ops_limit, mem_limit)

    kdf = Scrypt(salt=kdf_salt, length=KEYNUM_SK_SIZE, n=n, r=r, p=p)
    kdf_output = kdf.derive(password.encode("utf-8"))

    # XOR to decrypt
    decrypted = bytes(a ^ b for a, b in zip(keynum_sk, kdf_output))

    key_id    = decrypted[0:8]
    seed      = decrypted[8:40]   # Ed25519 private key seed
    public_key = decrypted[40:72]
    checksum  = decrypted[72:104]

    # Verify checksum: Blake2b-256(sig_algo || key_id || secret_key || public_key)
    expected = hashlib.blake2b(sig_algo + key_id + seed + public_key, digest_size=32).digest()
    if expected != checksum:
        raise ValueError("Wrong password or corrupted key (checksum mismatch)")

    return key_id, seed


def libsodium_scrypt_params(opslimit: int, memlimit: int) -> tuple[int, int, int]:
    """Convert libsodium opslimit/memlimit to scrypt N, r, p."""
    r = 8
    if opslimit < memlimit // 32:
        p = 1
        maxn = memlimit // (r * 128)
        n = 1
        while n * 2 <= maxn:
            n *= 2
    else:
        maxn = memlimit // (r * 128)
        n = 1
        while n * 2 <= maxn:
            n *= 2
        p = min(opslimit // (4 * r * n), 0x3fffffff)
    return n, r, p


def sign_file(key_id: bytes, seed: bytes, file_path: Path) -> tuple[Path, str]:
    """Sign a file exactly as Tauri does and write the .sig file."""
    private_key = Ed25519PrivateKey.from_private_bytes(seed)

    data = file_path.read_bytes()

    # Tauri/minisign uses prehashed mode: Blake2b-512 of the file
    prehash = hashlib.blake2b(data, digest_size=64).digest()

    timestamp = int(time.time())
    trusted_comment = f"timestamp:{timestamp}\tfile:{file_path.name}"
    untrusted_comment = "signature from tauri secret key"

    # Sign the prehash
    sig_bytes = private_key.sign(prehash)

    # Global signature: sign(sig_bytes + trusted_comment_bytes)
    global_sig = private_key.sign(sig_bytes + trusted_comment.encode())

    # Build the minisign signature file format:
    # untrusted comment: <text>
    # base64(sig_algo || key_id || signature)
    # trusted comment: <text>
    # base64(global_signature)
    sig_algo = b"ED"  # prehashed = "ED", legacy = "Ed"
    line2 = base64.b64encode(sig_algo + key_id + sig_bytes).decode()
    line4 = base64.b64encode(global_sig).decode()

    sig_text = (
        f"untrusted comment: {untrusted_comment}\n"
        f"{line2}\n"
        f"trusted comment: {trusted_comment}\n"
        f"{line4}\n"
    )

    # Tauri base64-encodes the whole signature text before writing
    encoded = base64.b64encode(sig_text.encode()).decode()

    sig_path = Path(str(file_path) + ".sig")
    sig_path.write_text(encoded)

    return sig_path, encoded


def main():
    parser = argparse.ArgumentParser(description="Sign files like Tauri updater")
    parser.add_argument("file", type=Path, help="File to sign")
    parser.add_argument("-k", "--key",
        default=os.environ.get("TAURI_SIGNING_PRIVATE_KEY"),
        help="Base64 private key (or set TAURI_SIGNING_PRIVATE_KEY)")
    parser.add_argument("-f", "--key-file", type=Path,
        help="Path to private key file")
    parser.add_argument("-p", "--password",
        default=os.environ.get("TAURI_SIGNING_PRIVATE_KEY_PASSWORD"),
        help="Key password (or set TAURI_SIGNING_PRIVATE_KEY_PASSWORD)")
    args = parser.parse_args()

    if args.key_file:
        raw_b64_key = args.key_file.read_text().strip()
    elif args.key:
        raw_b64_key = args.key.strip()
    else:
        print("Error: provide --key, --key-file, or set TAURI_SIGNING_PRIVATE_KEY")
        sys.exit(1)

    if not args.file.exists():
        print(f"Error: file not found: {args.file}")
        sys.exit(1)

    password = args.password
    if password is None:
        password = getpass.getpass("Private key password (leave empty for none): ")

    key_str = decode_tauri_key(raw_b64_key)
    key_id, seed = parse_and_decrypt_secret_key(key_str, password)

    sig_path, encoded = sign_file(key_id, seed, args.file)

    print(f"\nSigned successfully!")
    print(f"Signature file: {sig_path}")
    print(f"\nPublic signature (for your update server's signature field):")
    print(encoded)


if __name__ == "__main__":
    main()