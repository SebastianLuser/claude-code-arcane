"""
Specs for import_history.py.

The fixtures are realistically shaped CSVs, not ideal ones: a notice preamble on
top, the fee as a separate row, European number format, hours as hh:mm,
semicolon separator. Each exists because that is what a real export brings.

Run from the root: python -m unittest discover -s tests -p "test_*.py"
"""

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "skills" / "freelance-pipeline" / "scripts"))

import import_history as ih  # noqa: E402


# Upwork transaction history style: preamble, fee as a ROW, negatives in
# parentheses, and two columns competing for "amount".
UPWORK_CSV = '''Transaction history report
Generated on 2026-08-06

Date,Type,Ref ID,Description,Team,Amount,Amount in local currency,Currency
2026-07-05,Hourly,REF1,"Sprint 21 - backend",Acme Inc,"$1,240.00","$1,240.00",USD
2026-07-05,"Service Fee",REF1,"Freelancer Service Fee",Acme Inc,($124.00),($124.00),USD
2026-07-19,Fixed Price,REF2,"Milestone 1",Globex,"$800.00","$800.00",USD
2026-07-31,Withdrawal,REF3,"Withdrawal to bank",,($1900.00),($1900.00),USD
'''

# A hand-kept spreadsheet whose headers come from the Spanish pack (the script
# must read them): decimal comma, thousands dot, hh:mm hours, semicolon
# separator. The hours header only contains its alias: a substring match.
ES = json.loads((REPO_ROOT / "skills" / "freelance-pipeline" / "scripts" / "columns.es.json")
                .read_text(encoding="utf-8"))["fields"]
OWN_HEADERS = [ES["date"][0].title(), ES["client"][0].title(), ES["contract"][0].title(),
               ES["amount"][0].title(), ES["hours"][0].title() + " worked",
               ES["currency"][0].title()]
OWN_CSV = ";".join(OWN_HEADERS) + '''
05/07/2026;Acme;Backend sprint;1.240,00;31:00;USD
19/07/2026;Globex;Shopify store;800,50;12:30;USD
02/08/2026;Initech;Landing;450,00;6:00;USD
'''


class CsvCase(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def write(self, name, content):
        path = self.tmp / name
        path.write_text(content, encoding="utf-8")
        return str(path)

    def summary(self, name, content, overrides=None):
        path = self.write(name, content)
        headers, rows, _ = ih.read_csv(path)
        mapping, _, _ = ih.map_columns(headers, overrides or {})
        return ih.summarize(ih.normalize_rows(rows, mapping)), mapping


class TestMoneyParsing(unittest.TestCase):
    def test_us_format_with_thousands(self):
        self.assertEqual(ih.parse_money("$1,240.00"), 1240.0)

    def test_european_format(self):
        # 1.240,00 is one thousand two hundred forty, not one point twenty-four.
        self.assertEqual(ih.parse_money("1.240,00"), 1240.0)
        self.assertEqual(ih.parse_money("800,50"), 800.5)

    def test_thousands_comma_without_decimals(self):
        self.assertEqual(ih.parse_money("1,240"), 1240.0)

    def test_accounting_parentheses_are_negative(self):
        # Accounting convention: parentheses are the minus sign.
        self.assertEqual(ih.parse_money("($124.00)"), -124.0)

    def test_currency_suffix(self):
        self.assertEqual(ih.parse_money("120.00 USD"), 120.0)

    def test_empty_and_dash_are_none_not_zero(self):
        for blank in ("", "  ", "-", "--", "n/a", None):
            self.assertIsNone(ih.parse_money(blank), repr(blank))


class TestHoursParsing(unittest.TestCase):
    def test_decimal(self):
        self.assertEqual(ih.parse_hours("12.5"), 12.5)

    def test_hh_mm(self):
        self.assertEqual(ih.parse_hours("12:30"), 12.5)
        self.assertEqual(ih.parse_hours("31:00"), 31.0)

    def test_empty_is_none(self):
        self.assertIsNone(ih.parse_hours(""))


class TestColumnMapping(CsvCase):
    def test_skips_the_notice_preamble(self):
        path = self.write("u.csv", UPWORK_CSV)
        headers, rows, skipped = ih.read_csv(path)
        self.assertEqual(skipped, 3)
        self.assertIn("Date", headers)
        self.assertEqual(len(rows), 4)

    def test_detects_semicolon_delimiter(self):
        path = self.write("o.csv", OWN_CSV)
        headers, rows, _ = ih.read_csv(path)
        self.assertIn(OWN_HEADERS[3], headers)
        self.assertEqual(len(rows), 3)

    def test_reports_ambiguity_instead_of_choosing_silently(self):
        # "Amount" and "Amount in local currency" compete for the same field.
        # Picking wrong there changes every total, so it is reported.
        headers, _, _ = ih.read_csv(self.write("u.csv", UPWORK_CSV))
        mapping, _, ambiguous = ih.map_columns(headers)
        self.assertIn("amount", ambiguous)
        self.assertEqual(mapping["amount"], "Amount", "the first, simplest one wins")

    def test_lists_unmapped_columns(self):
        headers, _, _ = ih.read_csv(self.write("u.csv", UPWORK_CSV))
        _, unmapped, _ = ih.map_columns(headers)
        self.assertIn("Ref ID", unmapped)

    def test_override_wins_over_detection(self):
        headers, _, _ = ih.read_csv(self.write("u.csv", UPWORK_CSV))
        mapping, _, _ = ih.map_columns(headers, {"Amount in local currency": "amount"})
        self.assertEqual(mapping["amount"], "Amount in local currency")

    def test_exact_name_beats_an_earlier_partial_match(self):
        # "total" is an amount alias, so "Total Hours" partially matches amount.
        mapping, _, ambiguous = ih.map_columns(["Date", "Client", "Total Hours", "Amount"])
        self.assertEqual(mapping["amount"], "Amount")
        self.assertIn("amount", ambiguous)

    def test_fee_alias_does_not_get_eaten_by_amount(self):
        # "amount" is a substring of almost everything; without the right
        # FIELD_ALIASES order a fee column ended up in amount.
        mapping, _, _ = ih.map_columns(["Date", "Amount", "Service Fee"])
        self.assertEqual(mapping["fee"], "Service Fee")
        self.assertEqual(mapping["amount"], "Amount")


class TestFeeRows(CsvCase):
    def test_fee_as_a_row_is_not_counted_as_income(self):
        summary, _ = self.summary("u.csv", UPWORK_CSV)
        self.assertEqual(summary["income_transactions"], 2)
        self.assertEqual(summary["fee_rows"], 1)

    def test_gross_net_and_fees_add_up(self):
        # The bug this covers: without detecting fee rows, `gross` gave 1916
        # (which is the net) and `fees` gave None with a 124 fee in plain
        # sight. The total was right and the label lied.
        summary, _ = self.summary("u.csv", UPWORK_CSV)
        self.assertEqual(summary["gross"], 2040.0)
        self.assertEqual(summary["fees"], 124.0)
        self.assertEqual(summary["net"], 1916.0)

    def test_withdrawals_are_excluded(self):
        summary, _ = self.summary("u.csv", UPWORK_CSV)
        self.assertEqual(summary["excluded_by_type"], 1)


class TestSummary(CsvCase):
    def test_effective_rate_needs_hours(self):
        summary, _ = self.summary("o.csv", OWN_CSV)
        self.assertEqual(summary["hours_logged"], 49.5)
        self.assertEqual(summary["effective_hourly_rate"], round(2490.5 / 49.5, 2))

    def test_says_when_the_rate_cannot_be_computed(self):
        # The Upwork export has no hours. Estimating the rate without hours
        # would invent the most important number in the report.
        summary, _ = self.summary("u.csv", UPWORK_CSV)
        self.assertIsNone(summary["effective_hourly_rate"])
        self.assertFalse(summary["effective_rate_computable"])

    def test_client_concentration(self):
        summary, _ = self.summary("o.csv", OWN_CSV)
        self.assertEqual(summary["concentration"]["largest_client"], "Acme")
        self.assertEqual(summary["concentration"]["share_of_income_pct"], 49.8)

    def test_flags_insufficient_sample(self):
        summary, _ = self.summary("o.csv", OWN_CSV)
        self.assertFalse(summary["enough_sample"], "3 transactions are not a sample")

    def test_date_range(self):
        summary, _ = self.summary("o.csv", OWN_CSV)
        self.assertEqual(summary["date_range"], ["2026-07-05", "2026-08-02"])


class TestFailurePaths(CsvCase):
    def test_missing_amount_column_is_reported_not_guessed(self):
        csv_text = ",".join(OWN_HEADERS[:2] + ["Comment"]) + "\n2026-01-01,Acme,x\n"
        headers, _, _ = ih.read_csv(self.write("r.csv", csv_text))
        mapping, _, _ = ih.map_columns(headers)
        self.assertNotIn("amount", mapping)

    def test_empty_file_raises_a_clear_error(self):
        path = self.write("empty.csv", "")
        with self.assertRaises(ValueError):
            ih.read_csv(path)


if __name__ == "__main__":
    unittest.main()
