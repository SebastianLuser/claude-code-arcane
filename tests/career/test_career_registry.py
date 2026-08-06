"""
Especificaciones de career_registry.py sobre un workspace de fixture.

Escribe archivos reales en un tmpdir en vez de mockear el filesystem: el script
existe para leer notas que otra gente escribio a mano, asi que lo que hay que
probar es justamente el parseo de esos archivos.

Correr desde la raiz: python -m unittest discover -s tests -p "test_*.py"
"""

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "skills" / "career-registry" / "scripts"))

import career_registry as cr  # noqa: E402


NOTES = {
    "03-Aplicaciones/Acme - Backend.md": """---
tipo: aplicacion
empresa: Acme Inc
perfil: Backend
estado: aplicado
match_score: 78
fuente: linkedin
fecha_aplicacion: 2026-07-10
fecha_actualizacion: 2026-07-10
link_oferta: https://www.linkedin.com/jobs/view/4123456789?utm_source=share&trk=abc
---
""",
    "03-Aplicaciones/Globex - Shopify.md": """---
tipo: freelance
cliente: Globex
plataforma: upwork
estado: propuesta_enviada
match_score: 82
connects_gastados: 12
bid: 2400
fecha_envio: 2026-08-01
fecha_actualizacion: 2026-08-01
link_oferta: https://www.upwork.com/jobs/~01abc
---
""",
    # Acentos, sufijo legal, `score` legacy y estado vacio: los cuatro casos
    # molestos en una sola nota.
    "03-Aplicaciones/Tecnologia - vista.md": """---
tipo: freelance
cliente: Tecnología Latam SA
estado:
score: 44
---
""",
    "08-Contratos/Globex - Tienda.md": """---
tipo: contrato
cliente: Globex
estado: activo
monto_acordado: 2400
horas_estimadas: 40
horas_reales: 58
fecha_inicio: 2026-08-05
fecha_actualizacion: 2026-08-05
---
""",
}

SEEN = {"jobs": [
    {"url": "https://www.linkedin.com/jobs/view/4123456789", "status": "nota_creada",
     "nota": "03-Aplicaciones/Acme - Backend.md", "quick_score": 78},
    {"url": "https://example.com/fantasma", "status": "nota_creada",
     "nota": "03-Aplicaciones/Borrada.md"},
]}


class WorkspaceCase(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        for rel, body in NOTES.items():
            target = self.tmp / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(body, encoding="utf-8")
        seen = self.tmp / "tools" / "job_scraper" / "seen_jobs.json"
        seen.parent.mkdir(parents=True, exist_ok=True)
        seen.write_text(json.dumps(SEEN), encoding="utf-8")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def rows(self):
        rows, _ = cr.load_notes(self.tmp)
        return rows


class TestNormalization(unittest.TestCase):
    def test_legal_suffix_does_not_distinguish_a_company(self):
        self.assertEqual(cr.slug("Acme Inc"), cr.slug("acme"))
        self.assertEqual(cr.slug("Globex SA"), cr.slug("globex"))

    def test_abbreviated_legal_suffix_with_dots(self):
        # "S.A." partido en tokens da "s" y "a", que no estan en la lista de
        # sufijos. Los puntos tienen que colapsar antes de tokenizar.
        self.assertEqual(cr.slug("Globex S.A."), cr.slug("globex"))
        self.assertEqual(cr.slug("Acme S.R.L."), cr.slug("acme"))

    def test_accents_do_not_distinguish_a_company(self):
        self.assertEqual(cr.slug("Tecnología Latam"), cr.slug("tecnologia latam"))

    def test_url_canonicalization_ignores_tracking(self):
        a = cr.canonical_url("https://www.linkedin.com/jobs/view/123?utm_source=share&trk=x")
        b = cr.canonical_url("https://www.linkedin.com/jobs/view/123?trackingId=otro")
        self.assertEqual(a, b)
        self.assertEqual(a, "https://www.linkedin.com/jobs/view/123")

    def test_empty_number_is_none_not_zero(self):
        # Un campo de template vacio no es un cero: si fuera 0, un contrato sin
        # horas cargadas apareceria como "40 horas de mas".
        self.assertIsNone(cr.number(""))
        self.assertIsNone(cr.number(None))
        self.assertEqual(cr.number("58"), 58.0)
        self.assertEqual(cr.number("2,5"), 2.5)


class TestFrontmatter(unittest.TestCase):
    def test_reads_flat_keys(self):
        fields = cr.parse_frontmatter("---\ntipo: freelance\nbid: 2400\n---\ncuerpo")
        self.assertEqual(fields["tipo"], "freelance")
        self.assertEqual(fields["bid"], "2400")

    def test_block_list_does_not_swallow_a_scalar(self):
        # El bug que ya se pago una vez en vault_audit: la lista en bloque
        # sobreescribia el valor escalar ya leido.
        fields = cr.parse_frontmatter("---\nperfil: Backend\ntags:\n  - a\n  - b\n---")
        self.assertEqual(fields["perfil"], "Backend")
        self.assertEqual(fields["tags"], ["a", "b"])

    def test_no_frontmatter_returns_empty(self):
        self.assertEqual(cr.parse_frontmatter("# solo un titulo"), {})
        self.assertEqual(cr.parse_frontmatter("---\nsin cierre"), {})


class TestLoadNotes(WorkspaceCase):
    def test_reads_both_folders_and_all_tipos(self):
        tipos = sorted(r["tipo"] for r in self.rows())
        self.assertEqual(tipos, ["aplicacion", "contrato", "freelance", "freelance"])

    def test_empresa_and_cliente_land_in_one_column(self):
        # Empleo usa `empresa`, freelance usa `cliente`. El registro los unifica
        # o el CSV sale con media columna vacia.
        by_title = {r["titulo"]: r for r in self.rows()}
        self.assertEqual(by_title["Acme - Backend"]["contraparte"], "Acme Inc")
        self.assertEqual(by_title["Globex - Shopify"]["contraparte"], "Globex")

    def test_legacy_score_field_is_read(self):
        row = next(r for r in self.rows() if r["titulo"].startswith("Tecnologia"))
        self.assertEqual(row["match_score"], "44")

    def test_open_state_depends_on_tipo(self):
        by_title = {r["titulo"]: r for r in self.rows()}
        # `aplicado` es abierto en empleo; `activo` es abierto en contratos.
        self.assertEqual(by_title["Acme - Backend"]["abierto"], "si")
        self.assertEqual(by_title["Globex - Tienda"]["abierto"], "si")
        # Sin estado no puede contar como abierta.
        self.assertEqual(by_title["Tecnologia - vista"]["abierto"], "no")

    def test_ignores_index_files(self):
        (self.tmp / "03-Aplicaciones" / "_index.md").write_text("---\ntipo: x\n---", encoding="utf-8")
        self.assertEqual(len(self.rows()), 4)


class TestCheck(WorkspaceCase):
    def test_finds_by_company_ignoring_legal_suffix(self):
        hits = cr.match_rows(self.rows(), "acme")
        self.assertEqual(len(hits), 1)
        self.assertEqual(hits[0]["coincide_por"], "misma contraparte")

    def test_finds_by_url_with_different_tracking(self):
        hits = cr.match_rows(self.rows(),
                             "https://www.linkedin.com/jobs/view/4123456789?utm_source=otro")
        self.assertEqual(hits[0]["coincide_por"], "misma URL de la oferta")

    def test_finds_by_company_with_accents(self):
        hits = cr.match_rows(self.rows(), "tecnologia latam")
        self.assertEqual(len(hits), 1)

    def test_unknown_returns_nothing(self):
        self.assertEqual(cr.match_rows(self.rows(), "Initech"), [])

    def test_sent_and_merely_seen_are_different_answers(self):
        # La distincion que hace util al comando: "ya lo viste" invita a
        # revisarlo, "ya te postulaste" dice que no repitas.
        sent = [h for h in cr.match_rows(self.rows(), "acme") if h["estado"] in cr.SENT_STATES]
        seen_only = [h for h in cr.match_rows(self.rows(), "tecnologia latam")
                     if h["estado"] in cr.SENT_STATES]
        self.assertTrue(sent)
        self.assertFalse(seen_only)


class TestAuditSignals(WorkspaceCase):
    def test_flags_hours_over_estimate(self):
        rows = self.rows()
        drift = [r for r in rows if (r.get("horas_reales") or 0) > (r.get("horas_estimadas") or 0)
                 and r.get("horas_estimadas")]
        self.assertEqual(len(drift), 1)
        self.assertEqual(drift[0]["horas_reales"] - drift[0]["horas_estimadas"], 18)

    def test_flags_missing_estado(self):
        missing = [r["nota"] for r in self.rows() if not r["estado"]]
        self.assertEqual(len(missing), 1)

    def test_detects_broken_dedup_pointer(self):
        seen = cr.load_seen_jobs(self.tmp)
        existing = {r["nota"] for r in self.rows()}
        broken = [e for e in seen["jobs"]
                  if e.get("nota") and not any(e["nota"] in n or n in e["nota"] for n in existing)]
        self.assertEqual(len(broken), 1)
        self.assertEqual(broken[0]["nota"], "03-Aplicaciones/Borrada.md")

    def test_missing_seen_jobs_is_not_an_error(self):
        # Alguien puede instalar +freelance sin haber corrido nunca un scan.
        (self.tmp / "tools" / "job_scraper" / "seen_jobs.json").unlink()
        self.assertIsNone(cr.load_seen_jobs(self.tmp))


class TestCsvContract(unittest.TestCase):
    def test_columns_cover_both_profiles(self):
        for column in ("tipo", "contraparte", "estado", "match_score",
                       "costo_postulacion", "dias_sin_movimiento", "nota"):
            self.assertIn(column, cr.CSV_COLUMNS)

    def test_sent_states_cover_both_vocabularies(self):
        self.assertIn("aplicado", cr.SENT_STATES)        # empleo
        self.assertIn("propuesta_enviada", cr.SENT_STATES)  # freelance


if __name__ == "__main__":
    unittest.main()
