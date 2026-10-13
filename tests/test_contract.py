"""Regression checks for the Personal Travel Agent workflow.

Run: python -m unittest discover -s tests
"""
import unittest
from pathlib import Path

class RepositoryContractTests(unittest.TestCase):
    def test_server_has_required_steps(self):
        code = Path("server.py").read_text(encoding="utf-8")
        for step in ("choose_travelers", "choose_transport", "travel_schedule"):
            self.assertIn(step, code)

    def test_timetable_verification_gate(self):
        code = Path("server.py").read_text(encoding="utf-8")
        self.assertIn("service_day_verified", code)
        self.assertIn("timetable_source", code)
        self.assertIn("status='unverified'", code)

    def test_web_ui_four_columns(self):
        code = Path("index.html").read_text(encoding="utf-8")
        for column in ("Option", "Est. round-trip cost", "Est. time", "Convenience"):
            self.assertIn(column, code)

    def test_not_misrepresented_as_live(self):
        code = Path("index.html").read_text(encoding="utf-8")
        self.assertIn("Simulation only", code)

if __name__ == "__main__":
    unittest.main()
