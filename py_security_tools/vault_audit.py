#!/usr/bin/env python3
"""
PassVault Database Security Auditor (Python 3.10+)
Inspects SQLite vault database for health stats, audit trails, and entry counts.
"""

import os
import sqlite3
import sys
import argparse
from typing import Dict, List, Any

class VaultAuditor:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def audit(self) -> Dict[str, Any]:
        if not os.path.exists(self.db_path):
            return {
                'success': False,
                'error': f'Database file not found at {self.db_path}'
            }

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Count Users
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]

        # Count Vault Items
        cursor.execute("SELECT COUNT(*), category FROM vault_items GROUP BY category")
        categories_breakdown = {row[1]: row[0] for row in cursor.fetchall()}

        cursor.execute("SELECT COUNT(*) FROM vault_items")
        total_vault_items = cursor.fetchone()[0]

        # Count Secure Notes
        cursor.execute("SELECT COUNT(*) FROM secure_notes")
        total_notes = cursor.fetchone()[0]

        # Count Audit Logs
        cursor.execute("SELECT COUNT(*), event_type FROM audit_logs GROUP BY event_type")
        audit_events = {row[1]: row[0] for row in cursor.fetchall()}

        cursor.execute("SELECT COUNT(*) FROM audit_logs")
        total_audit_logs = cursor.fetchone()[0]

        conn.close()

        return {
            'success': True,
            'user_count': user_count,
            'total_vault_items': total_vault_items,
            'total_notes': total_notes,
            'categories_breakdown': categories_breakdown,
            'total_audit_logs': total_audit_logs,
            'audit_events': audit_events
        }

def print_audit_report(res: Dict[str, Any]):
    if not res.get('success'):
        print(f"[ERROR] {res.get('error')}")
        sys.exit(1)

    print("\n" + "="*55)
    print(" PassVault SQLite Database Security Audit Report")
    print("="*55)
    print(f" Database Status:        ONLINE")
    print(f" Registered Users:       {res['user_count']}")
    print(f" Total Vault Passwords:  {res['total_vault_items']}")
    print(f" Total Secure Notes:     {res['total_notes']}")
    print(f" Total Audit Log Events: {res['total_audit_logs']}")
    print("-" * 55)
    print(" Category Breakdown:")
    for cat, count in res['categories_breakdown'].items():
        print(f"   - {cat or 'General'}: {count} items")
    print("-" * 55)
    print(" Audit Event Log Distribution:")
    for evt, count in res['audit_events'].items():
        print(f"   - {evt}: {count} events")
    print("="*55 + "\n")

def main():
    default_db = os.path.join(os.path.dirname(__file__), '../passvault.db')
    parser = argparse.ArgumentParser(description="PassVault SQLite Database Auditor")
    parser.add_argument("--db", default=default_db, help="Path to passvault.db file")
    args = parser.parse_args()

    auditor = VaultAuditor(args.db)
    report = auditor.audit()
    print_audit_report(report)

if __name__ == "__main__":
    main()
