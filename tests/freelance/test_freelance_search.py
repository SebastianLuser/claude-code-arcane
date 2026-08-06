"""
Especificaciones de freelance_search.py sobre payloads fijos.

Nada de red: CI no puede depender de que GetOnBrd, Himalayas o HN esten arriba,
y un test que falla porque se cayo un tercero se ignora a la semana. Los payloads
de abajo son recortes reales de las respuestas que se verificaron a mano.

Correr desde la raiz: python -m unittest discover -s tests -p "test_*.py"
"""

import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "skills" / "freelance-scan" / "scripts"))

import freelance_search as fs  # noqa: E402


# Recorte real de /api/v0/search/jobs?expand[]=company&expand[]=tags&expand[]=modality
GETONBRD_PAGE = {
    "data": [
        {
            "id": "abc-freelance-job",
            "attributes": {
                "title": "Unity Developer",
                "company": {"data": {"id": "acme", "type": "company",
                                     "attributes": {"name": "Acme"}}},
                "tags": {"data": [
                    {"id": "unity", "type": "tag", "attributes": {"name": "Unity"}},
                    {"id": "csharp", "type": "tag", "attributes": {"name": "C#"}},
                ]},
                # Con expand[] el id llega como string. Filtrar por id se rompe aca.
                "modality": {"data": {"id": "3", "type": "modality",
                                      "attributes": {"name": "Freelance",
                                                     "locale_key": "freelance"}}},
                "published_at": "2026-08-01",
                "remote_modality": "fully_remote",
                "min_salary": 3000, "max_salary": 5000,
                "description_headline": "Buscamos alguien para un proyecto corto",
                "location_cities": [],
            },
        },
        {
            "id": "def-fulltime-job",
            "attributes": {
                "title": "Senior Backend Developer",
                "company": {"data": {"id": "globex", "type": "company",
                                     "attributes": {"name": "Globex"}}},
                "tags": {"data": []},
                "modality": {"data": {"id": "1", "type": "modality",
                                      "attributes": {"name": "Full time",
                                                     "locale_key": "full_time"}}},
                "published_at": "2026-08-02",
                "location_cities": ["Buenos Aires"],
            },
        },
    ],
    "meta": {"page": 1, "per_page": 50, "total_pages": 1},
}

HIMALAYAS_PAGE = {
    "totalCount": 2,
    "jobs": [
        {"guid": "h1", "title": "Contract Unity Developer", "companyName": "Initech",
         "applicationLink": "https://himalayas.app/jobs/h1", "employmentType": "Contractor",
         "pubDate": "2026-08-01", "locationRestrictions": ["Worldwide"],
         "minSalary": 40, "maxSalary": 60, "categories": ["Engineering"],
         "excerpt": "Short engagement"},
        {"guid": "h2", "title": "Full Time Designer", "companyName": "Initech",
         "applicationLink": "https://himalayas.app/jobs/h2", "employmentType": "Full Time",
         "pubDate": "2026-08-01", "locationRestrictions": [], "categories": []},
    ],
}


class FakeFetcher:
    """Reemplaza fetch_json y registra las URLs pedidas."""

    def __init__(self, *payloads):
        self.payloads = list(payloads)
        self.urls = []

    def __call__(self, url):
        self.urls.append(url)
        return self.payloads.pop(0) if self.payloads else {"data": [], "jobs": []}


class TestGetOnBrd(unittest.TestCase):
    def setUp(self):
        self.original = fs.fetch_json

    def tearDown(self):
        fs.fetch_json = self.original

    def test_keeps_only_freelance_modality(self):
        fs.fetch_json = FakeFetcher(GETONBRD_PAGE)
        results, truncated, scanned, _ = fs.getonbrd_search("developer", pages=1)

        self.assertEqual(len(results), 1, "el full-time no deberia pasar el filtro")
        self.assertEqual(results[0]["id"], "abc-freelance-job")
        self.assertEqual(results[0]["modality"], "freelance")
        self.assertFalse(truncated)
        self.assertEqual(scanned, 2, "scanned cuenta lo leido, no lo que quedo")

    def test_resolves_expanded_company_and_tags(self):
        # Sin expand[] estos campos son {"data":{"id":...}} y no hay nombre.
        fs.fetch_json = FakeFetcher(GETONBRD_PAGE)
        results, _, _, _ = fs.getonbrd_search("developer", pages=1)

        self.assertEqual(results[0]["company"], "Acme")
        self.assertEqual(results[0]["tags"], ["Unity", "C#"])

    def test_requests_the_expand_params(self):
        fetcher = FakeFetcher(GETONBRD_PAGE)
        fs.fetch_json = fetcher
        fs.getonbrd_search("developer", pages=1)

        url = fetcher.urls[0]
        for field in ("company", "tags", "modality"):
            self.assertIn("expand%5B%5D=" + field, url,
                          "sin expand[]={0} no hay nombre que mostrar".format(field))

    def test_stops_at_total_pages(self):
        fetcher = FakeFetcher(GETONBRD_PAGE, GETONBRD_PAGE)
        fs.fetch_json = fetcher
        fs.getonbrd_search("developer", pages=5)

        self.assertEqual(len(fetcher.urls), 1, "total_pages=1 y pidio una sola pagina")

    def test_marks_truncated_when_pages_run_out(self):
        page = dict(GETONBRD_PAGE, meta={"total_pages": 9})
        fs.fetch_json = FakeFetcher(page)
        _, truncated, _, _ = fs.getonbrd_search("developer", pages=1)

        self.assertTrue(truncated, "hay 9 paginas y se leyo 1: el usuario tiene que saberlo")


class TestHimalayas(unittest.TestCase):
    def setUp(self):
        self.original = fs.fetch_json

    def tearDown(self):
        fs.fetch_json = self.original

    def test_keeps_only_contractor(self):
        # El server acepta employmentType y lo ignora, asi que filtramos aca.
        fs.fetch_json = FakeFetcher(HIMALAYAS_PAGE)
        results, _, scanned, _ = fs.himalayas_search("", pages=1)

        self.assertEqual([r["id"] for r in results], ["h1"])
        self.assertEqual(scanned, 2)

    def test_query_filters_client_side(self):
        fs.fetch_json = FakeFetcher(HIMALAYAS_PAGE)
        results, _, _, _ = fs.himalayas_search("unity", pages=1)
        self.assertEqual(len(results), 1)

        fs.fetch_json = FakeFetcher(HIMALAYAS_PAGE)
        results, _, _, _ = fs.himalayas_search("kubernetes", pages=1)
        self.assertEqual(results, [])


class TestRelevance(unittest.TestCase):
    """
    GetOnBrd ordena por relevancia, no filtra: `query=unity` devuelve 21 paginas
    donde el fondo no tiene nada que ver. Sin este chequeo, paginar en
    profundidad y quedarse con lo freelance devolvia SAP, COBOL y un recruiter
    para una busqueda de Unity.
    """

    def setUp(self):
        self.original = fs.fetch_json

    def tearDown(self):
        fs.fetch_json = self.original

    def test_any_term_is_enough(self):
        # "unity developer": los que dicen Unity entran aunque no digan developer.
        self.assertTrue(fs.matches_query("unity developer", "Unity Gameplay Programmer"))

    def test_drops_what_has_nothing_to_do(self):
        self.assertFalse(fs.matches_query("unity", "Desarrollador COBOL Mainframe", "SQL, Linux"))

    def test_empty_query_keeps_everything(self):
        self.assertTrue(fs.matches_query("", "cualquier cosa"))

    def test_two_letter_terms_are_real_searches_here(self):
        # go, ux, ai, qa son busquedas legitimas en este dominio.
        self.assertTrue(fs.matches_query("ux", "UX Design Lead"))
        self.assertTrue(fs.matches_query("go", "Go Backend Engineer"))
        self.assertFalse(fs.matches_query("ux", "Backend Engineer"))

    def test_word_boundary_not_substring(self):
        # Por substring, "ux" matchea dentro de Linux y "go" dentro de Django.
        # Ese falso positivo es peor que perder un match parcial.
        self.assertFalse(fs.matches_query("ux", "Linux Sysadmin"))
        self.assertFalse(fs.matches_query("go", "Django Developer"))

    def test_terms_with_symbols_fall_back_to_substring(self):
        # \b no funciona contra # ni . , asi que c# y .net van por substring.
        self.assertTrue(fs.matches_query("c#", "Unity Developer", "C#, .NET"))
        self.assertTrue(fs.matches_query("node.js", "Backend", "Node.js, TypeScript"))

    def test_known_cost_of_word_boundaries(self):
        # Contrapartida aceptada y documentada: buscar "script" ya no encuentra
        # "JavaScript". Si esto cambia alguna vez, que sea una decision, no un
        # accidente.
        self.assertFalse(fs.matches_query("script", "JavaScript Developer"))

    def test_getonbrd_counts_irrelevant_separately(self):
        # El freelance descartado por irrelevante se cuenta aparte del full-time:
        # es el numero que le dice al usuario que su query no existe en la fuente.
        fs.fetch_json = FakeFetcher(GETONBRD_PAGE)
        results, _, scanned, irrelevant = fs.getonbrd_search("kubernetes", pages=1)

        self.assertEqual(results, [], "el job freelance es de Unity, no de kubernetes")
        self.assertEqual(irrelevant, 1)
        self.assertEqual(scanned, 2)

    def test_relevance_runs_after_the_modality_filter(self):
        # Si corriera antes, `irrelevant` contaria full-time descartado y el
        # numero dejaria de significar "tu query no existe aca".
        fs.fetch_json = FakeFetcher(GETONBRD_PAGE)
        results, _, _, irrelevant = fs.getonbrd_search("unity", pages=1)

        self.assertEqual(len(results), 1)
        self.assertEqual(irrelevant, 0, "el full-time no debe contarse como irrelevante")


class TestSynonymExpansion(unittest.TestCase):
    """
    Medido sobre el pool real: buscar "ecommerce" devolvia 0 con un
    "Desarrollador Web Shopify" adentro, y "go" devolvia 0 con un "Golang
    Back-end Developer" adentro. Nadie titula una oferta con la categoria.
    """

    def test_category_expands_to_technologies(self):
        terms, applied = fs.expand_query("ecommerce")
        self.assertEqual(terms[0], "ecommerce", "el termino del usuario va primero")
        self.assertIn("shopify", terms)
        self.assertEqual(applied["ecommerce"][0], "shopify")

    def test_go_finds_golang(self):
        terms, _ = fs.expand_query("go")
        self.assertIn("golang", terms)

    def test_unknown_term_is_left_alone(self):
        terms, applied = fs.expand_query("murex")
        self.assertEqual(terms, ["murex"])
        self.assertEqual(applied, {})

    def test_caps_the_number_of_extra_terms(self):
        # Cada termino extra es una request mas: sin tope, "backend frontend web"
        # dispararia veinte.
        terms, _ = fs.expand_query("backend frontend web mobile data")
        extra = len(terms) - 5
        self.assertLessEqual(extra, fs.MAX_EXPANDED_TERMS)

    def test_does_not_duplicate_a_term_already_typed(self):
        terms, _ = fs.expand_query("frontend react")
        self.assertEqual(terms.count("react"), 1)

    def test_multiword_synonyms_survive_matching(self):
        # "react native" tiene un espacio: partirlo en palabras lo rompe, asi que
        # matches_terms recibe la lista ya armada y no vuelve a splitear.
        terms, _ = fs.expand_query("mobile")
        self.assertIn("react native", terms)
        self.assertTrue(fs.matches_terms(terms, "React Native Developer"))

    def test_expansion_is_one_directional(self):
        # Expandir shopify -> ecommerce le inflaria los resultados a quien ya
        # busca preciso. Solo se baja de categoria a tecnologia.
        terms, applied = fs.expand_query("shopify")
        self.assertEqual(terms, ["shopify"])
        self.assertEqual(applied, {})


class TestHackerNewsClassification(unittest.TestCase):
    def test_separates_offers_from_freelancers_advertising(self):
        self.assertEqual(fs.hn_classify("SEEKING FREELANCER | Remote | Rust"), fs.HN_HIRING)
        self.assertEqual(fs.hn_classify("SEEKING WORK | US | Remote | me@example.com"), fs.HN_AVAILABLE)

    def test_unknown_when_the_convention_is_not_followed(self):
        # 6 de 121 comentarios medidos no siguen la convencion. Adivinar de que
        # lado estan mete ofertas falsas en la cola, que es peor que omitirlas.
        self.assertEqual(fs.hn_classify("I'm a generalist with deep focus in games"), "unknown")

    def test_classification_is_case_insensitive(self):
        self.assertEqual(fs.hn_classify("Seeking Freelancer - backend work"), fs.HN_HIRING)


class TestRateExtraction(unittest.TestCase):
    def test_finds_hourly_ranges(self):
        rates = fs.extract_rates("My rate is $80-$120/hour depending on scope")
        self.assertTrue(rates)
        self.assertEqual(rates[0]["min"], 80)
        self.assertEqual(rates[0]["max"], 120)
        self.assertEqual(rates[0]["unit"], "hour")

    def test_normalizes_unit_abbreviations(self):
        self.assertEqual(fs.extract_rates("$95/hr")[0]["unit"], "hour")
        self.assertEqual(fs.extract_rates("$900/day")[0]["unit"], "day")

    def test_returns_nothing_rather_than_guessing(self):
        # "10 years of experience" no es una tarifa. Inventar un numero aca
        # contaminaria la mediana que despues usa /freelance-proposal.
        self.assertEqual(fs.extract_rates("I have 10 years of experience in Rust"), [])

    def test_summary_reports_sample_size(self):
        summary = fs.rate_summary([
            {"min": 50, "max": None, "unit": "hour"},
            {"min": 100, "max": None, "unit": "hour"},
            {"min": 150, "max": None, "unit": "hour"},
        ])
        self.assertEqual(summary["hour"]["n"], 3)
        self.assertEqual(summary["hour"]["median"], 100)
        self.assertEqual(summary["hour"]["min"], 50)
        self.assertEqual(summary["hour"]["max"], 150)


class TestHtmlStripping(unittest.TestCase):
    def test_unescapes_hn_entities(self):
        # HN devuelve HTML escapado: github&#x2F;user tiene que volver a github/user.
        self.assertIn("github.com/bansal", fs.strip_html("github.com&#x2F;bansal"))

    def test_paragraphs_become_newlines(self):
        self.assertEqual(fs.strip_html("<p>uno<p>dos"), "uno\ndos")


class TestSourceContract(unittest.TestCase):
    def test_hn_is_not_a_project_source(self):
        # Medido sobre 6 meses: 113 freelancers ofreciendose contra 2 ofertas.
        # Si alguien lo agrega a SOURCES, `search` empieza a devolver curriculums
        # de otros freelancers como si fueran trabajos.
        self.assertNotIn("hn", fs.SOURCES)

    def test_every_source_has_a_search_branch(self):
        self.assertEqual(set(fs.SOURCES), {"getonbrd", "himalayas"})

    def test_record_shape_is_stable(self):
        # El dedup de /freelance-scan cruza fuentes por estos campos.
        row = fs.record(source="x", id="1")
        for field in ("source", "id", "title", "company", "url", "modality",
                      "published_at", "location", "salary_min", "salary_max",
                      "tags", "excerpt"):
            self.assertIn(field, row)


if __name__ == "__main__":
    unittest.main()
