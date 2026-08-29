# PassVault Security Architecture

## Encryption Standards
- **Cipher**: AES-256-GCM
- **Key Derivation**: PBKDF2 with SHA-256 (100,000 iterations)
- **Zero-Knowledge**: Master password is never transmitted or stored on server.