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

    def test_commas_separate_terms(self):
        # Una lista con comas es la forma natural de escribirla. Separando solo
        # por espacios se buscaba el string literal "typescript,backend", que no
        # aparece en ningun aviso: cero resultados que se leen como "no hay
        # trabajo" en vez de "no busque nada".
        terms, applied = fs.expand_query("typescript,go")
        self.assertIn("typescript", terms)
        self.assertIn("go", terms)
        self.assertIn("golang", terms, "y los sinonimos siguen aplicando")
        self.assertIn("go", applied)

    def test_mixed_commas_and_spaces(self):
        terms, _ = fs.expand_query("typescript, backend  frontend")
        for expected in ("typescript", "backend", "frontend"):
            self.assertIn(expected, terms)

    def test_no_empty_terms_from_trailing_separators(self):
        # Un termino vacio matchea todo y convierte el filtro de relevancia en
        # un colador.
        terms, _ = fs.expand_query("typescript,,go, ")
        self.assertNotIn("", terms)

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


class TestUrlTriage(unittest.TestCase):
    """
    WebSearch es el unico camino a los marketplaces sin credencial, pero la
    mitad de lo que devuelve son landings de "Hire X developers", tablas de
    tarifas y gigs. Las URLs de abajo son las que devolvio de verdad.
    """

    def test_upwork_posting_shapes(self):
        for url in (
            "https://www.upwork.com/job/Golang-Developer_~0157b3a527d0809956/",
            "https://www.upwork.com/freelance-jobs/apply/Senior-Backend_~016ee6131b64a1238f/",
        ):
            self.assertEqual(fs.classify_url(url), ("upwork", "posting"), url)

    def test_upwork_landings(self):
        # /services/ es el Project Catalog: son gigs que vende un freelancer,
        # no ofertas de un cliente. Meterlos en la cola invierte el sentido.
        for url in (
            "https://www.upwork.com/hire/golang-developers/cost/",
            "https://www.upwork.com/services/product/a-golang-developer-1728313002997911552",
            "https://www.upwork.com/freelance-jobs/us/golang/",
            "https://www.upwork.com/nx/search/jobs/?q=golang",
        ):
            self.assertEqual(fs.classify_url(url), ("upwork", "landing"), url)

    def test_workana_posting_and_landing(self):
        self.assertEqual(
            fs.classify_url("https://www.workana.com/es/job/crear-tienda-shopify-ecommerce"),
            ("workana", "posting"),
        )
        self.assertEqual(
            fs.classify_url("https://www.workana.com/job/front-end-shopify-developer"),
            ("workana", "posting"),
        )
        for url in (
            "https://www.workana.com/en/jobs?skills=typescript",
            "https://www.workana.com/en/hire/shopify",
            "https://www.workana.com/es/skill/node-js",
        ):
            self.assertEqual(fs.classify_url(url)[1], "landing", url)

    def test_other_platforms_landings(self):
        for url in (
            "https://www.freelancer.com/jobs/golang",
            "https://www.peopleperhour.com/freelance-golang-jobs",
            "https://www.guru.com/m/find/freelance-jobs/back-end-developer/",
        ):
            self.assertEqual(fs.classify_url(url)[1], "landing", url)

    def test_unknown_domain_is_not_guessed(self):
        platform, verdict = fs.classify_url("https://news.ycombinator.com/item?id=1")
        self.assertIsNone(platform)
        self.assertEqual(verdict, "unknown")

    def test_query_string_does_not_decide(self):
        # Los parametros cambian por campania y por sesion; si entraran en la
        # decision, la misma oferta se clasificaria distinto segun de donde vino.
        with_params = "https://www.workana.com/es/job/crear-tienda?ref=email&utm_source=x"
        self.assertEqual(fs.classify_url(with_params)[1], "posting")

    def test_triage_splits_and_dedupes(self):
        rows = fs.triage_urls([
            "https://www.upwork.com/job/A_~01aa/",
            "https://www.upwork.com/job/A_~01aa/",   # repetida
            "https://www.upwork.com/hire/golang-developers/",
            "https://example.com/whatever",
            "",
        ])
        self.assertEqual(len(rows["postings"]), 1, "la repetida no se cuenta dos veces")
        self.assertEqual(len(rows["descartados_landing"]), 1)
        self.assertEqual(len(rows["fuera_de_plataformas_conocidas"]), 1)
        self.assertEqual(rows["total_recibidas"], 3, "las vacias no cuentan")
        self.assertEqual(rows["postings_por_plataforma"], {"upwork": 1})

    def test_triage_always_warns_about_dates(self):
        # El indice no filtra por fecha y una de las ofertas reales que devolvio
        # era de 2021. Callarlo haria perder tiempo en ofertas muertas.
        rows = fs.triage_urls(["https://www.upwork.com/job/A_~01aa/"])
        self.assertIn("fecha", rows["advertencia"].lower())


class TestKeyedSources(unittest.TestCase):
    """
    Las fuentes con credencial no pueden venir prendidas, pero tampoco pueden
    desaparecer: el usuario tiene que enterarse de que existen y como activarlas.
    """

    def test_every_keyed_source_documents_how_to_get_the_key(self):
        for name, spec in fs.KEYED_SOURCES.items():
            self.assertTrue(spec["env"], name)
            self.assertTrue(spec["como_conseguirla"], name)
            self.assertTrue(spec["doc"].startswith("https://"), name)
            self.assertTrue(spec["lo_que_no_se_puede"], name)

    def test_keyed_sources_are_not_in_the_default_run(self):
        for name in fs.KEYED_SOURCES:
            self.assertNotIn(name, fs.SOURCES, name)

    def test_upwork_refuses_clearly_without_a_token(self):
        import os
        old = os.environ.pop("UPWORK_ACCESS_TOKEN", None)
        try:
            with self.assertRaises(fs.SourceError) as ctx:
                fs.upwork_search("golang", 1, terms=["golang"])
            self.assertIn("UPWORK_ACCESS_TOKEN", str(ctx.exception))
            self.assertIn("keys", str(ctx.exception))
        finally:
            if old is not None:
                os.environ["UPWORK_ACCESS_TOKEN"] = old


class TestUpworkParsing(unittest.TestCase):
    """
    La query no se pudo verificar contra la API real (hace falta una key
    aprobada), asi que lo que se fija aca es el parseo: que la respuesta se lea
    bien y que un cambio de schema falle diciendo por que.
    """

    NODE = {
        "id": "1234",
        "title": "Golang backend for a Shopify integration",
        "description": "<p>We need <b>Go</b> and Postgres.</p>",
        "ciphertext": "~01abcdef",
        "createdDateTime": "2026-08-05T10:00:00Z",
        "engagement": "30+ hrs/week",
        "amount": {"rawValue": "1500", "currency": "USD"},
        "hourlyBudgetMin": {"rawValue": "35"},
        "hourlyBudgetMax": {"rawValue": "60"},
        "client": {
            "totalHires": 12,
            "totalSpent": {"rawValue": "48000"},
            "verificationStatus": "VERIFIED",
            "location": {"country": "Germany"},
        },
        "skills": [{"name": "Go"}, {"name": "PostgreSQL"}],
    }

    def test_walks_nodes_regardless_of_nesting(self):
        shallow = {"data": {"search": {"edges": [{"node": self.NODE}]}}}
        deeper = {"data": {"a": {"b": {"search": {"edges": [{"node": self.NODE}]}}}}}
        for payload in (shallow, deeper):
            out = []
            fs._walk_nodes(payload, out)
            self.assertEqual(len(out), 1)
            self.assertEqual(out[0]["id"], "1234")

    def test_money_unwraps_raw_value(self):
        self.assertEqual(fs._money(self.NODE, "amount"), "1500")
        self.assertEqual(fs._money(self.NODE["client"], "totalSpent"), "48000")
        self.assertIsNone(fs._money(self.NODE, "noSuchField"))

    def test_money_survives_a_missing_branch(self):
        self.assertIsNone(fs._money({}, "client", "totalSpent"))
