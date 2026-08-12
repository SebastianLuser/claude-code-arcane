"""
Especificaciones de import_history.py.

Los fixtures son CSVs de forma realista, no ideal: preambulo de aviso arriba,
comision como fila aparte, formato europeo, horas en hh:mm, separador punto y
coma. Cada uno existe porque es lo que un export real trae.

Correr desde la raiz: python -m unittest discover -s tests -p "test_*.py"
"""

import shutil
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "skills" / "freelance-pipeline" / "scripts"))

import import_history as ih  # noqa: E402


# Estilo transaction history de Upwork: preambulo, comision como FILA, negativos
# entre parentesis, y dos columnas que compiten por "monto".
UPWORK_CSV = '''Transaction history report
Generated on 2026-08-06

Date,Type,Ref ID,Description,Team,Amount,Amount in local currency,Currency
2026-07-05,Hourly,REF1,"Sprint 21 - backend",Acme Inc,"$1,240.00","$1,240.00",USD
2026-07-05,"Service Fee",REF1,"Freelancer Service Fee",Acme Inc,($124.00),($124.00),USD
2026-07-19,Fixed Price,REF2,"Milestone 1",Globex,"$800.00","$800.00",USD
2026-07-31,Withdrawal,REF3,"Withdrawal to bank",,($1900.00),($1900.00),USD
'''

# Planilla propia: espanol, decimal con coma, miles con punto, horas hh:mm,
# separador punto y coma.
OWN_CSV = '''Fecha;Cliente;Proyecto;Importe;Horas trabajadas;Moneda
05/07/2026;Acme;Backend sprint;1.240,00;31:00;USD
19/07/2026;Globex;Tienda Shopify;800,50;12:30;USD
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
        # 1.240,00 son mil doscientos cuarenta, no uno con veinticuatro.
        self.assertEqual(ih.parse_money("1.240,00"), 1240.0)
        self.assertEqual(ih.parse_money("800,50"), 800.5)

    def test_thousands_comma_without_decimals(self):
        self.assertEqual(ih.parse_money("1,240"), 1240.0)

    def test_accounting_parentheses_are_negative(self):
        # Convencion contable: los parentesis son el signo menos.
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
        self.assertIn("Importe", headers)
        self.assertEqual(len(rows), 3)

    def test_reports_ambiguity_instead_of_choosing_silently(self):
        # "Amount" y "Amount in local currency" compiten por el mismo campo.
        # Elegir mal ahi cambia todos los totales, asi que se avisa.
        headers, _, _ = ih.read_csv(self.write("u.csv", UPWORK_CSV))
        mapping, _, ambiguous = ih.map_columns(headers)
        self.assertIn("monto", ambiguous)
        self.assertEqual(mapping["monto"], "Amount", "gana la primera, la mas simple")

    def test_lists_unmapped_columns(self):
        headers, _, _ = ih.read_csv(self.write("u.csv", UPWORK_CSV))
        _, unmapped, _ = ih.map_columns(headers)
        self.assertIn("Ref ID", unmapped)

    def test_override_wins_over_detection(self):
        headers, _, _ = ih.read_csv(self.write("u.csv", UPWORK_CSV))
        mapping, _, _ = ih.map_columns(headers, {"Amount in local currency": "monto"})
        self.assertEqual(mapping["monto"], "Amount in local currency")

    def test_fee_alias_does_not_get_eaten_by_amount(self):
        # "amount" hace substring con casi todo; sin el orden correcto de
        # FIELD_ALIASES una columna de fee terminaba en monto.
        mapping, _, _ = ih.map_columns(["Date", "Amount", "Service Fee"])
        self.assertEqual(mapping["fee"], "Service Fee")
        self.assertEqual(mapping["monto"], "Amount")


class TestFeeRows(CsvCase):
    def test_fee_as_a_row_is_not_counted_as_income(self):
        summary, _ = self.summary("u.csv", UPWORK_CSV)
        self.assertEqual(summary["movimientos_de_ingreso"], 2)
        self.assertEqual(summary["filas_de_comision"], 1)

    def test_gross_net_and_fees_add_up(self):
        # El bug que esto cubre: sin detectar filas de comision, `bruto` daba
        # 1916 (que es el neto) y `comisiones` daba None con un fee de 124 a la
        # vista. El total era correcto y la etiqueta mentia.
        summary, _ = self.summary("u.csv", UPWORK_CSV)
        self.assertEqual(summary["bruto"], 2040.0)
        self.assertEqual(summary["comisiones"], 124.0)
        self.assertEqual(summary["neto"], 1916.0)

    def test_withdrawals_are_excluded(self):
        summary, _ = self.summary("u.csv", UPWORK_CSV)
        self.assertEqual(summary["excluidos_por_tipo"], 1)


class TestSummary(CsvCase):
    def test_effective_rate_needs_hours(self):
        summary, _ = self.summary("o.csv", OWN_CSV)
        self.assertEqual(summary["horas_registradas"], 49.5)
        self.assertEqual(summary["tarifa_efectiva_por_hora"], round(2490.5 / 49.5, 2))

    def test_says_when_the_rate_cannot_be_computed(self):
        # El export de Upwork no trae horas. Estimar la tarifa sin horas seria
        # inventar el numero mas importante del reporte.
        summary, _ = self.summary("u.csv", UPWORK_CSV)
        self.assertIsNone(summary["tarifa_efectiva_por_hora"])
        self.assertFalse(summary["tarifa_efectiva_calculable"])

    def test_client_concentration(self):
        summary, _ = self.summary("o.csv", OWN_CSV)
        self.assertEqual(summary["concentracion"]["cliente_mas_grande"], "Acme")
        self.assertEqual(summary["concentracion"]["porcentaje_del_ingreso"], 49.8)

    def test_flags_insufficient_sample(self):
        summary, _ = self.summary("o.csv", OWN_CSV)
        self.assertFalse(summary["muestra_suficiente"], "3 movimientos no son una muestra")

    def test_date_range(self):
        summary, _ = self.summary("o.csv", OWN_CSV)
        self.assertEqual(summary["rango_de_fechas"], ["2026-07-05", "2026-08-02"])


class TestFailurePaths(CsvCase):
    def test_missing_amount_column_is_reported_not_guessed(self):
        headers, _, _ = ih.read_csv(self.write("r.csv", "Fecha,Cliente,Comentario\n2026-01-01,Acme,x\n"))
        mapping, _, _ = ih.map_columns(headers)
        self.assertNotIn("monto", mapping)

    def test_empty_file_raises_a_clear_error(self):
        path = self.write("vacio.csv", "")
        with self.assertRaises(ValueError):
            ih.read_csv(path)


if __name__ == "__main__":
    unittest.main()
