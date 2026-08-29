#!/usr/bin/env python3
"""
Python Automated Security Utilities Test Suite
"""

import os
import sys
import unittest

# Add py_security_tools to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../py_security_tools')))

from entropy_scanner import EntropyScanner
from backup_encryptor import BackupEncryptor

class TestPythonSecurityTools(unittest.TestCase):

    def test_entropy_calculation(self):
        # Empty password
        self.assertEqual(EntropyScanner.calculate_entropy(""), 0.0)

        # Simple lowercase password
        entropy_low = EntropyScanner.calculate_entropy("abcdefgh")
        self.assertGreater(entropy_low, 30.0)

        # Strong complex password
        entropy_strong = EntropyScanner.calculate_entropy("P@ssv4ult_Secure_2026!")
        self.assertGreater(entropy_strong, 100.0)

    def test_vulnerability_warnings(self):
        result = EntropyScanner.analyze_vulnerabilities("12345")
        self.assertLess(result['security_score'], 50)
        self.assertTrue(any("predictable" in w for w in result['warnings']))

    def test_backup_encryption_decryption(self):
        sample_backup = {
          "app": "PassVault",
          "vault_items": [{"title": "Gmail", "username": "test@gmail.com"}]
        }
        passphrase = "MasterSecretPassphrase2026"

        encrypted = BackupEncryptor.encrypt_json(sample_backup, passphrase)
        self.assertEqual(encrypted['format'], 'passvault_encrypted_backup_v1')
        self.assertIn('payload_b64', encrypted)

        decrypted = BackupEncryptor.decrypt_json(encrypted, passphrase)
        self.assertEqual(decrypted['app'], "PassVault")
        self.assertEqual(len(decrypted['vault_items']), 1)

if __name__ == '__main__':
    unittest.main()
