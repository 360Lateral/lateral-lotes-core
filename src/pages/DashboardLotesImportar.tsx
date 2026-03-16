import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
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
  matricula_inmobiliaria: string | null;
  lat: number | null;
  lng: number | null;
  area_total_m2: number | null;
  barrio: string | null;
  valid: boolean;
}

const HEADER_MAP: Record<string, keyof Omit<ParsedRow, "valid">> = {};
const ALIASES: [RegExp, keyof Omit<ParsedRow, "valid">][] = [
  [/^nombre.*(lote)?|^lote$/i, "nombre_lote"],
  [/^direcci[oó]n|^address/i, "direccion"],
  [/^ciudad|^municipio|^city/i, "ciudad"],
  [/^matr[ií]cula|^matricula_inmobiliaria/i, "matricula_inmobiliaria"],
  [/^latitud|^lat$/i, "lat"],
  [/^longitud|^lng$|^lon$/i, "lng"],
  [/^[aá]rea|^area_total|^m2|^metros/i, "area_total_m2"],
  [/^barrio|^neighborhood/i, "barrio"],
  [/^ubicaci[oó]n|^google.?maps|^link|^url/i, "_location_url" as any],
];

function matchHeader(header: string): keyof Omit<ParsedRow, "valid"> | "_location_url" | null {
  const h = header.trim();
  for (const [regex, field] of ALIASES) {
    if (regex.test(h)) return field as any;
  }
  return null;
}

function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  if (!url || typeof url !== "string") return null;
  // @XX.XXXX,YY.YYYY or /@lat,lng
  const m1 = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m1) return { lat: parseFloat(m1[1]), lng: parseFloat(m1[2]) };
  // q=lat,lng
  const m2 = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m2) return { lat: parseFloat(m2[1]), lng: parseFloat(m2[2]) };
  // place/lat,lng
  const m3 = url.match(/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (m3) return { lat: parseFloat(m3[1]), lng: parseFloat(m3[2]) };
  return null;
}

function toNum(v: any): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v.replace(/,/g, ".").replace(/[^\d.\-]/g, "")) : Number(v);
  return isNaN(n) ? null : n;
}

const DashboardLotesImportar = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ ok: number; errors: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (!json.length) {
        toast.error("El archivo está vacío");
        return;
      }

      // Map headers
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
          matricula_inmobiliaria: null,
          lat: null,
          lng: null,
          area_total_m2: null,
          barrio: null,
        };

        for (const [col, field] of Object.entries(mapping)) {
          const val = row[col];
          if (field === "lat" || field === "lng" || field === "area_total_m2") {
            r[field] = toNum(val);
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

        r.valid = !!r.nombre_lote && r.nombre_lote.length > 0;
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
    let ok = 0;
    let errors = 0;
    const batchSize = 20;

    for (let i = 0; i < valid.length; i += batchSize) {
      const batch = valid.slice(i, i + batchSize).map(({ valid: _, ...r }) => ({
        nombre_lote: r.nombre_lote,
        direccion: r.direccion,
        ciudad: r.ciudad,
        matricula_inmobiliaria: r.matricula_inmobiliaria,
        lat: r.lat,
        lng: r.lng,
        area_total_m2: r.area_total_m2,
        barrio: r.barrio,
      }));

      const { error, data } = await supabase.from("lotes").insert(batch).select("id");
      if (error) {
        errors += batch.length;
      } else {
        ok += data.length;
      }
      setProgress(Math.round(((i + batch.length) / valid.length) * 100));
    }

    setImporting(false);
    setResult({ ok, errors });
    if (ok > 0) toast.success(`${ok} lotes importados correctamente`);
    if (errors > 0) toast.error(`${errors} lotes con error`);
  };

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.length - validCount;

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
                {["Nombre del lote", "Dirección", "Ciudad / Municipio", "Matrícula", "Área m²", "Latitud", "Longitud", "Barrio", "Link Google Maps"].map((c) => (
                  <Badge key={c} variant="secondary">{c}</Badge>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Si incluyes un link de Google Maps, las coordenadas se extraerán automáticamente.
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
                <Badge variant="default" className="bg-green-600">{validCount} válidas</Badge>
                {invalidCount > 0 && <Badge variant="destructive">{invalidCount} sin nombre</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-3 py-2 font-semibold text-foreground w-8">#</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Nombre</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Dirección</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Ciudad</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Matrícula</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Área m²</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Lat</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Lng</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Barrio</th>
                  <th className="px-3 py-2 font-semibold text-foreground w-8"></th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((r, i) => (
                  <tr key={i} className={`border-b border-border last:border-0 ${!r.valid ? "bg-destructive/5" : "hover:bg-muted/50"}`}>
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-medium text-foreground">{r.nombre_lote || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.direccion || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.ciudad || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.matricula_inmobiliaria || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.area_total_m2?.toLocaleString("es-CO") || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.lat?.toFixed(5) || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.lng?.toFixed(5) || "—"}</td>
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
                {importing ? `Importando… ${progress}%` : `Importar ${validCount} lotes`}
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
              <Badge variant="default" className="bg-green-600 text-sm">{result.ok} importados</Badge>
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
