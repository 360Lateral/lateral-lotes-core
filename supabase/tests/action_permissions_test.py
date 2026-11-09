"""Integration tests: temporary permission overrides, direct API calls, exact restoration.

Run after `lovable auth-session --json --self`:
  python3 supabase/tests/action_permissions_test.py
"""
import json
import os
from pathlib import Path
import subprocess
import unittest
import uuid
import requests


class ActionPermissionsTest(unittest.TestCase):
    @classmethod
    def sql(cls, query):
        return subprocess.check_output(
            ["psql", os.environ["SUPABASE_DB_URL"], "-X", "-At", "-v", "ON_ERROR_STOP=1", "-c", query],
            text=True, stderr=subprocess.PIPE,
        ).strip()

    @classmethod
    def setUpClass(cls):
        minted = json.loads(Path.home().joinpath(".cache/lovable-auth/session.json").read_text())
        cls.uid = str(uuid.UUID(minted["session"]["user"]["id"]))
        env = {}
        for line in Path(".env").read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                key, value = line.split("=", 1)
                env[key] = value.strip().strip('"').strip("'")
        cls.url = env["VITE_SUPABASE_URL"]
        cls.headers = {"apikey": env["VITE_SUPABASE_PUBLISHABLE_KEY"],
                       "Authorization": "Bearer " + minted["session"]["access_token"],
                       "Content-Type": "application/json"}
        cls.permissions = ["publicar_activo", "contratar_diagnostico", "subir_documentos",
                           "escribir_asesor", "gestionar_comisionistas", "sala_negociacion"]
        names = ",".join("'" + p + "'" for p in cls.permissions)
        cls.original = json.loads(cls.sql(
            f"SELECT COALESCE(json_agg(p), '[]'::json) FROM public.permisos_usuario p "
            f"WHERE user_id='{cls.uid}' AND permiso IN ({names})"))
        cls.fixture = json.loads(cls.sql("SELECT json_build_object(" 
            "'lot',(SELECT id FROM public.lotes LIMIT 1),"
            "'eng',(SELECT id FROM public.engagements_lote LIMIT 1),"
            "'neg',(SELECT id FROM public.negociaciones LIMIT 1))"))
        values = ",".join(f"('{cls.uid}','{p}',false)" for p in cls.permissions)
        cls.sql("INSERT INTO public.permisos_usuario (user_id,permiso,habilitado) VALUES " + values +
                " ON CONFLICT (user_id,permiso) DO UPDATE SET habilitado=false")

    @classmethod
    def tearDownClass(cls):
        names = ",".join("'" + p + "'" for p in cls.permissions)
        cls.sql(f"DELETE FROM public.permisos_usuario WHERE user_id='{cls.uid}' AND permiso IN ({names})")
        for row in cls.original:
            payload = json.dumps(row).replace("'", "''")
            cls.sql("INSERT INTO public.permisos_usuario SELECT * FROM json_populate_record(" 
                    f"NULL::public.permisos_usuario, '{payload}'::json)")

    def denied(self, path, body):
        response = requests.post(self.url + path, headers=self.headers, json=body, timeout=30)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json().get("code"), "42501")

    def permission_is_false(self, permission):
        response = requests.post(self.url + "/rest/v1/rpc/tiene_permiso", headers=self.headers,
                                 json={"_user_id": self.uid, "_permiso": permission}, timeout=30)
        self.assertEqual(response.status_code, 200)
        self.assertIs(response.json(), False)

    def test_publicar_activo(self):
        self.permission_is_false("publicar_activo")
        self.denied("/rest/v1/lotes", {"nombre_lote": "Permission rejection test", "owner_id": self.uid})

    def test_contratar_diagnostico(self):
        self.permission_is_false("contratar_diagnostico")
        self.denied("/rest/v1/rpc/solicitar_diagnostico", {"p_lote_id": self.fixture["lot"], "p_plan_id": str(uuid.uuid4())})
        self.denied("/rest/v1/rpc/activar_engagement_gratuito", {"p_engagement_id": self.fixture["eng"]})
        response = requests.post(self.url + "/functions/v1/crear-pago-wompi", headers=self.headers,
                                 json={"tipo": "diagnostico", "engagement_id": self.fixture["eng"]}, timeout=30)
        self.assertEqual(response.status_code, 403)

    def test_subir_documentos(self):
        self.permission_is_false("subir_documentos")
        self.denied("/rest/v1/documentos_subidos_engagement", {
            "engagement_id": self.fixture["eng"], "subido_por": self.uid,
            "archivo_path": "permission-test.pdf", "archivo_nombre": "permission-test.pdf"})
        response = requests.post(self.url + f"/storage/v1/object/docs-cliente/{self.uid}/permission-test.pdf",
                                 headers={**self.headers, "Content-Type": "application/pdf"}, data=b"%PDF-1.4", timeout=30)
        self.assertIn(response.status_code, (400, 403))
        self.assertEqual(str(response.json().get("statusCode")), "403")

    def test_escribir_asesor(self):
        self.permission_is_false("escribir_asesor")
        self.denied("/rest/v1/mensajes_asesor_engagement", {
            "engagement_id": self.fixture["eng"], "remitente_id": self.uid, "mensaje": "Permission rejection test"})

    def test_gestionar_comisionistas(self):
        self.permission_is_false("gestionar_comisionistas")
        self.denied("/rest/v1/rpc/revocar_autorizacion_comisionista", {"p_autorizacion_id": str(uuid.uuid4())})
        self.denied("/rest/v1/autorizaciones_comisionista", {
            "lote_id": self.fixture["lot"], "propietario_id": self.uid, "comisionista_id": self.uid,
            "comision_pct": 3, "documento_url": "permission-test.pdf"})

    def test_sala_negociacion(self):
        self.permission_is_false("sala_negociacion")
        response = requests.get(self.url + "/rest/v1/negociaciones?select=id", headers=self.headers, timeout=30)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])
        self.denied("/rest/v1/mensajes", {"negociacion_id": self.fixture["neg"],
                                        "sender_id": self.uid, "contenido": "Permission rejection test"})
        self.denied("/rest/v1/rpc/cerrar_venta", {"p_negociacion_id": self.fixture["neg"], "p_precio_venta_final": 1})


if __name__ == "__main__":
    unittest.main(verbosity=2)