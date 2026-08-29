#!/usr/bin/env python3
"""
PassVault Backup Encryptor & Decryptor CLI (Python 3.10+)
Encrypts and decrypts JSON backup files standalone.
"""

import os
import json
import base64
import argparse
from hashlib import pbkdf2_hmac

class BackupEncryptor:
    @staticmethod
    def derive_key(passphrase: str, salt: bytes) -> bytes:
        """Derive 256-bit AES key using PBKDF2 with HMAC-SHA256"""
        return pbkdf2_hmac('sha256', passphrase.encode('utf-8'), salt, 100000, 32)

    @classmethod
    def encrypt_json(cls, json_data: dict, passphrase: str) -> dict:
        """Encrypt JSON dict structure into secure encrypted envelope"""
        salt = os.urandom(16)
        key = cls.derive_key(passphrase, salt)
        
        raw_bytes = json.dumps(json_data).encode('utf-8')
        
        # Simple XOR stream cipher with SHA256 key block extension for standalone portability
        extended_key = b""
        counter = 0
        while len(extended_key) < len(raw_bytes):
            from hashlib import sha256
            extended_key += sha256(key + counter.to_bytes(4, 'big')).digest()
            counter += 1
            
        encrypted_bytes = bytes(a ^ b for a, b in zip(raw_bytes, extended_key))

        return {
            'format': 'passvault_encrypted_backup_v1',
            'salt_hex': salt.hex(),
            'payload_b64': base64.b64encode(encrypted_bytes).decode('utf-8')
        }

    @classmethod
    def decrypt_json(cls, encrypted_envelope: dict, passphrase: str) -> dict:
        """Decrypt encrypted envelope back into JSON dict structure"""
        if encrypted_envelope.get('format') != 'passvault_encrypted_backup_v1':
            raise ValueError("Unsupported or invalid backup format envelope")

        salt = bytes.fromhex(encrypted_envelope['salt_hex'])
        key = cls.derive_key(passphrase, salt)
        encrypted_bytes = base64.b64decode(encrypted_envelope['payload_b64'])

        extended_key = b""
        counter = 0
        while len(extended_key) < len(encrypted_bytes):
            from hashlib import sha256
            extended_key += sha256(key + counter.to_bytes(4, 'big')).digest()
            counter += 1

        decrypted_bytes = bytes(a ^ b for a, b in zip(encrypted_bytes, extended_key))
        return json.loads(decrypted_bytes.decode('utf-8'))

def main():
    parser = argparse.ArgumentParser(description="PassVault Backup Encryptor & Decryptor Utility")
    parser.add_argument("mode", choices=["encrypt", "decrypt"], help="Operation mode")
    parser.add_argument("--file", required=True, help="Input file path")
    parser.add_argument("--out", required=True, help="Output file path")
    parser.add_argument("--password", required=True, help="Master passphrase")

    args = parser.parse_args()

    with open(args.file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if args.mode == "encrypt":
        result = BackupEncryptor.encrypt_json(data, args.password)
        print(f"[✓] Backup successfully encrypted with master passphrase.")
    else:
        result = BackupEncryptor.decrypt_json(data, args.password)
        print(f"[✓] Backup successfully decrypted.")

    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)

    print(f"Output saved to: {args.out}")

if __name__ == "__main__":
    main()
