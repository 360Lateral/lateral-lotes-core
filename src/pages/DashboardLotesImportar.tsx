import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import PlantillaLotesExporter from "@/components/PlantillaLotesExporter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface ParsedRow {
  nombre_lote: string;
  direccion: string | null;
  ciudad: string | null;
  departamento: string | null;
  matricula_inmobiliaria: string | null;
  lat: number | null;
  lng: number | null;
  area_total_m2: number | null;
  barrio: string | null;
  estrato: number | null;
  tipo_lote: string | null;
  nombre_propietario: string | null;
  notas: string | null;
  valid: boolean;
  action: "nuevo" | "actualizar";
  existingId?: string;
}

const ALIASES: [RegExp, string][] = [
  [/^nombre.*(lote)?|^lote$/i, "nombre_lote"],
  [/^direcci[oó]n|^address/i, "direccion"],
  [/^ciudad|^municipio|^city/i, "ciudad"],
  [/^departamento/i, "departamento"],
  [/^matr[ií]cula|^matricula_inmobiliaria/i, "matricula_inmobiliaria"],
  [/^latitud|^lat$/i, "lat"],
  [/^longitud|^lng$|^lon$/i, "lng"],
  [/^[aá]rea|^area_total|^m2|^metros/i, "area_total_m2"],
  [/^barrio|^neighborhood/i, "barrio"],
  [/^estrato/i, "estrato"],
  [/^tipo.*(lote|predio)|^tipo_lote/i, "tipo_lote"],
  [/^propietario|^nombre.propietario/i, "nombre_propietario"],
  [/^notas|^observaciones|^comentarios/i, "notas"],
  [/^ubicaci[oó]n|^google.?maps|^link|^url/i, "_location_url"],
];

function matchHeader(header: string): string | null {
  const h = header.trim();
  for (const [regex, field] of ALIASES) {
    if (regex.test(h)) return field;
  }
  return null;
}

function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  if (!url || typeof url !== "string") return null;
  const m1 = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m1) return { lat: parseFloat(m1[1]), lng: parseFloat(m1[2]) };
  const m2 = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m2) return { lat: parseFloat(m2[1]), lng: parseFloat(m2[2]) };
  const m3 = url.match(/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m3) return { lat: parseFloat(m3[1]), lng: parseFloat(m3[2]) };
  return null;
}

function toNum(v: any): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v.replace(/,/g, ".").replace(/[^\d.\-]/g, "")) : Number(v);
  return isNaN(n) ? null : n;
}

function toInt(v: any): number | null {
  const n = toNum(v);
  return n != null ? Math.round(n) : null;
}

const NUM_FIELDS = new Set(["lat", "lng", "area_total_m2"]);
const INT_FIELDS = new Set(["estrato"]);

const DashboardLotesImportar = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ created: number; updated: number; errors: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setResult(null);

    // Fetch existing lotes for matching
    const { data: existingLotes } = await supabase
      .from("lotes")
      .select("id, nombre_lote")
      .order("nombre_lote");

    const existingMap = new Map<string, string>();
    (existingLotes ?? []).forEach((l) => {
      existingMap.set(l.nombre_lote.trim().toLowerCase(), l.id);
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });

      // Try "Lotes" sheet first, fallback to first sheet
      const sheetName = wb.SheetNames.includes("Lotes") ? "Lotes" : wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const json: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (!json.length) {
        toast.error("El archivo está vacío");
        return;
      }

      const headers = Object.keys(json[0]);
      const mapping: Record<string, string> = {};
      let locationUrlCol: string | null = null;

      for (const h of headers) {
        const match = matchHeader(h);
        if (match === "_location_url") {
          locationUrlCol = h;
        } else if (match) {
          mapping[h] = match;
        }
      }

      const parsed: ParsedRow[] = json.map((row) => {
        const r: any = {
          nombre_lote: "",
          direccion: null,
          ciudad: null,
          departamento: null,
          matricula_inmobiliaria: null,
          lat: null,
          lng: null,
          area_total_m2: null,
          barrio: null,
          estrato: null,
          tipo_lote: null,
          nombre_propietario: null,
          notas: null,
        };

        for (const [col, field] of Object.entries(mapping)) {
          const val = row[col];
          if (NUM_FIELDS.has(field)) {
            r[field] = toNum(val);
          } else if (INT_FIELDS.has(field)) {
            r[field] = toInt(val);
          } else {
            r[field] = val ? String(val).trim() : null;
          }
        }

        // Extract coords from URL column
        if (locationUrlCol && row[locationUrlCol]) {
          const coords = extractCoordsFromUrl(String(row[locationUrlCol]));
          if (coords) {
            if (!r.lat) r.lat = coords.lat;
            if (!r.lng) r.lng = coords.lng;
          }
        }

        // Also try extracting coords from any field that looks like a URL
        if (!r.lat || !r.lng) {
          for (const val of Object.values(row)) {
            if (typeof val === "string" && val.includes("google")) {
              const coords = extractCoordsFromUrl(val);
              if (coords) {
                if (!r.lat) r.lat = coords.lat;
                if (!r.lng) r.lng = coords.lng;
                break;
              }
            }
          }
        }

        const nameKey = (r.nombre_lote ?? "").trim().toLowerCase();
        const existingId = existingMap.get(nameKey);

        r.valid = !!r.nombre_lote && r.nombre_lote.length > 0;
        r.action = existingId ? "actualizar" : "nuevo";
        r.existingId = existingId;

        return r as ParsedRow;
      });

      setRows(parsed);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleImport = async () => {
    const valid = rows.filter((r) => r.valid);
    if (!valid.length) return;

    setImporting(true);
    setProgress(0);
    let created = 0;
    let updated = 0;
    let errors = 0;
    const batchSize = 20;

    const toInsert = valid.filter((r) => r.action === "nuevo");
    const toUpdate = valid.filter((r) => r.action === "actualizar");

    const buildPayload = (r: ParsedRow) => ({
      nombre_lote: r.nombre_lote,
      direccion: r.direccion,
      ciudad: r.ciudad,
      departamento: r.departamento,
      matricula_inmobiliaria: r.matricula_inmobiliaria,
      lat: r.lat,
      lng: r.lng,
      area_total_m2: r.area_total_m2,
      barrio: r.barrio,
      estrato: r.estrato,
      tipo_lote: r.tipo_lote,
      nombre_propietario: r.nombre_propietario,
      notas: r.notas,
    });

    const total = valid.length;
    let processed = 0;

    // Insert new lots in batches
    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize).map(buildPayload);
      const { error, data } = await supabase.from("lotes").insert(batch).select("id");
      if (error) {
        errors += batch.length;
      } else {
        created += data.length;
      }
      processed += batch.length;
      setProgress(Math.round((processed / total) * 100));
    }

    // Update existing lots one by one
    for (const r of toUpdate) {
      const { error } = await supabase
        .from("lotes")
        .update(buildPayload(r))
        .eq("id", r.existingId!);
      if (error) {
        errors++;
      } else {
        updated++;
      }
      processed++;
      setProgress(Math.round((processed / total) * 100));
    }

    setImporting(false);
    setResult({ created, updated, errors });
    if (created > 0) toast.success(`${created} lotes creados`);
    if (updated > 0) toast.success(`${updated} lotes actualizados`);
    if (errors > 0) toast.error(`${errors} lotes con error`);
  };

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.length - validCount;
  const newCount = rows.filter((r) => r.valid && r.action === "nuevo").length;
  const updateCount = rows.filter((r) => r.valid && r.action === "actualizar").length;

  return (
    <DashboardLayout>
      <div className="mb-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/lotes")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Volver
        </Button>
        <h1 className="font-body text-xl font-bold text-foreground">Importar Lotes desde Excel</h1>
      </div>

      {/* Upload zone */}
      {rows.length === 0 && (
        <Card>
          <CardContent className="p-8">
            {/* Download template button */}
            <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">¿Necesitas la plantilla?</p>
                <p className="text-xs text-muted-foreground">
                  Descarga un Excel con los lotes actuales para editar y reimportar.
                </p>
              </div>
              <PlantillaLotesExporter />
            </div>

            <div
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-lg font-medium text-foreground">
                Arrastra tu archivo Excel aquí
              </p>
              <p className="mb-4 text-sm text-muted-foreground">
                Formatos aceptados: .xlsx, .xls, .csv
              </p>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Seleccionar archivo
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                }}
              />
            </div>

            <div className="mt-6 rounded-md bg-muted p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">Columnas soportadas:</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {["Nombre del lote", "Dirección", "Ciudad / Municipio", "Departamento", "Matrícula", "Área m²", "Estrato", "Tipo de lote", "Barrio", "Latitud", "Longitud", "Link Google Maps", "Nombre propietario", "Notas"].map((c) => (
                  <Badge key={c} variant="secondary">{c}</Badge>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Si el nombre del lote coincide con uno existente, se actualizará en lugar de crear uno nuevo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {rows.length > 0 && !result && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-body">
                <FileSpreadsheet className="mr-2 inline h-4 w-4" />
                {fileName} — {rows.length} filas detectadas
              </CardTitle>
              <div className="flex items-center gap-2">
                {newCount > 0 && <Badge variant="default" className="bg-green-600">{newCount} nuevos</Badge>}
                {updateCount > 0 && <Badge variant="secondary">{updateCount} a actualizar</Badge>}
                {invalidCount > 0 && <Badge variant="destructive">{invalidCount} sin nombre</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-3 py-2 font-semibold text-foreground w-8">#</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Acción</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Nombre</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Dirección</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Ciudad</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Depto</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Área m²</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Estrato</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Barrio</th>
                  <th className="px-3 py-2 font-semibold text-foreground w-8"></th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((r, i) => (
                  <tr key={i} className={`border-b border-border last:border-0 ${!r.valid ? "bg-destructive/5" : "hover:bg-muted/50"}`}>
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2">
                      {r.valid ? (
                        r.action === "actualizar" ? (
                          <Badge variant="secondary" className="text-xs">Actualizar</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600 text-xs">Nuevo</Badge>
                        )
                      ) : (
                        <Badge variant="destructive" className="text-xs">Inválido</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium text-foreground">{r.nombre_lote || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.direccion || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.ciudad || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.departamento || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.area_total_m2?.toLocaleString("es-CO") || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.estrato ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.barrio || "—"}</td>
                    <td className="px-3 py-2">
                      {r.valid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 100 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">Mostrando 100 de {rows.length} filas.</p>
            )}
          </CardContent>

          <div className="flex items-center justify-between border-t border-border p-4">
            <Button variant="outline" onClick={() => { setRows([]); setFileName(""); }}>
              Cambiar archivo
            </Button>
            <div className="flex items-center gap-3">
              {importing && (
                <div className="w-48">
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              <Button
                onClick={handleImport}
                disabled={importing || validCount === 0}
              >
                {importing
                  ? `Importando… ${progress}%`
                  : `Importar ${validCount} lotes (${newCount} nuevos, ${updateCount} actualizar)`}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <p className="text-lg font-semibold text-foreground">Importación completada</p>
            <div className="flex gap-4">
              {result.created > 0 && <Badge variant="default" className="bg-green-600 text-sm">{result.created} creados</Badge>}
              {result.updated > 0 && <Badge variant="secondary" className="text-sm">{result.updated} actualizados</Badge>}
              {result.errors > 0 && <Badge variant="destructive" className="text-sm">{result.errors} errores</Badge>}
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => { setRows([]); setFileName(""); setResult(null); }}>
                Importar otro archivo
              </Button>
              <Button onClick={() => navigate("/dashboard/lotes")}>
                Ver lotes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default DashboardLotesImportar;
