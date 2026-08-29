#!/usr/bin/env python3
"""
PassVault Entropy & Pattern Analysis Tool (Python 3.10+)
Calculates mathematical entropy, pattern weaknesses, and crack time estimates.
"""

import math
import re
import sys
import argparse

class EntropyScanner:
    COMMON_PATTERNS = [
        r'12345', r'qwerty', r'password', r'admin', r'welcome', r'pass123', r'letmein'
    ]

    @staticmethod
    def calculate_entropy(password: str) -> float:
        """Calculate password entropy in bits: H = L * log2(R)"""
        if not password:
            return 0.0

        pool_size = 0
        if re.search(r'[a-z]', password):
            pool_size += 26
        if re.search(r'[A-Z]', password):
            pool_size += 26
        if re.search(r'[0-9]', password):
            pool_size += 10
        if re.search(r'[^a-zA-Z0-9]', password):
            pool_size += 32

        if pool_size == 0:
            return 0.0

        return round(len(password) * math.log2(pool_size), 2)

    @classmethod
    def analyze_vulnerabilities(cls, password: str) -> dict:
        """Analyze password vulnerabilities and return comprehensive security profile."""
        entropy = cls.calculate_entropy(password)
        length = len(password)
        warnings = []

        if length < 8:
            warnings.append("Length below 8 characters (critical vulnerability)")
        elif length < 12:
            warnings.append("Length below 12 characters (recommended 12+)")

        if not re.search(r'[A-Z]', password):
            warnings.append("Missing uppercase characters")
        if not re.search(r'[a-z]', password):
            warnings.append("Missing lowercase characters")
        if not re.search(r'[0-9]', password):
            warnings.append("Missing numbers")
        if not re.search(r'[^a-zA-Z0-9]', password):
            warnings.append("Missing special symbols")

        for pattern in cls.COMMON_PATTERNS:
            if re.search(pattern, password, re.IGNORECASE):
                warnings.append(f"Contains predictable common dictionary pattern: '{pattern}'")

        if re.search(r'(.)\1{2,}', password):
            warnings.append("Contains repeated identical characters")

        # Estimate crack time at 100 billion guesses/sec
        crack_seconds = (2 ** entropy) / (2 * 1e11) if entropy > 0 else 0

        score = min(100, int((entropy / 80.0) * 100))
        if length < 8:
            score = min(score, 20)

        return {
            'password_length': length,
            'entropy_bits': entropy,
            'security_score': score,
            'crack_time_seconds': crack_seconds,
            'crack_time_formatted': cls.format_time(crack_seconds),
            'warnings': warnings
        }

    @staticmethod
    def format_time(seconds: float) -> str:
        if seconds < 1:
            return "Instant (< 1 sec)"
        elif seconds < 60:
            return f"{int(seconds)} seconds"
        elif seconds < 3600:
            return f"{int(seconds // 60)} minutes"
        elif seconds < 86400:
            return f"{int(seconds // 3600)} hours"
        elif seconds < 31536000:
            return f"{int(seconds // 86400)} days"
        elif seconds < 315360000:
            return f"{int(seconds // 31536000)} years"
        else:
            return "100+ Years (Highly Secure)"

def main():
    parser = argparse.ArgumentParser(description="PassVault Entropy & Password Security Analyzer")
    parser.add_argument("password", nargs="?", help="Password string to analyze")
    args = parser.parse_args()

    pwd = args.password
    if not pwd:
        pwd = input("Enter password to analyze: ")

    result = EntropyScanner.analyze_vulnerabilities(pwd)

    print("\n" + "="*50)
    print(" PassVault Entropy Analysis Report")
    print("="*50)
    print(f" Length:              {result['password_length']} characters")
    print(f" Entropy Score:       {result['entropy_bits']} bits")
    print(f" Health Score:        {result['security_score']} / 100")
    print(f" Est. Time to Crack:  {result['crack_time_formatted']}")
    print("-" * 50)
    if result['warnings']:
        print(" Security Warnings:")
        for w in result['warnings']:
            print(f"   [!] {w}")
    else:
        print(" [✓] No vulnerabilities detected. Excellent security posture!")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
