/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL =
  'https://xtcicjrpznawnwvjdqhe.supabase.co/storage/v1/object/public/email-assets/logo.png'
const SITE_URL = 'https://urbanix360.com'

interface Props {
  nombre?: string; email?: string; telefono?: string; ubicacion?: string; area?: string
  tipo?: string; objetivo?: string; mapaUrl?: string
}

const Fila = ({ l, v }: { l: string; v?: string }) =>
  v ? <Text style={text}><strong>{l}:</strong> {v}</Text> : null

const Email = (p: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Nueva solicitud de diagnóstico de {p.nombre || 'un cliente'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt="360Lateral" height="40" style={{ display: 'block' }} />
        </Section>
        <Heading style={h1}>Nueva solicitud de Diagnóstico 360°</Heading>
        <Section style={infoBox}>
          <Text style={infoLabel}>Responder antes de 24 horas</Text>
          <Text style={infoValue}>{p.nombre || 'Sin nombre'}</Text>
        </Section>
        <Fila l="Email" v={p.email} />
        <Fila l="Teléfono" v={p.telefono} />
        <Fila l="Ubicación" v={p.ubicacion} />
        <Fila l="Área" v={p.area} />
        <Fila l="Tipo de lote" v={p.tipo} />
        <Fila l="Objetivo" v={p.objetivo} />
        {p.mapaUrl && <Text style={text}><a href={p.mapaUrl}>Ver punto en Google Maps</a></Text>}
        <Section style={{ textAlign: 'center', marginTop: 24 }}>
          <Button style={button} href={`${SITE_URL}/dashboard`}>Abrir panel</Button>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Nuevo diagnóstico · ${d?.nombre ?? 'cliente'}`,
  displayName: 'Diagnóstico · aviso al equipo',
  to: 'facturacionterra@360lateral.com',
  previewData: { nombre: 'Ana Pérez', email: 'ana@correo.com', telefono: '3001234567', ubicacion: 'Rionegro, Antioquia', area: '1.200 m²', tipo: 'Rural', objetivo: 'Vender' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const logoSection = { marginBottom: '24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a2744', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#1a2744', lineHeight: '22px', margin: '0 0 14px' }
const smallText = { fontSize: '13px', color: '#6b7280', lineHeight: '20px', margin: '20px 0 0' }
const infoBox = {
  backgroundColor: '#fff7ed',
  borderLeft: '4px solid #F49D15',
  padding: '14px 18px',
  margin: '20px 0',
  borderRadius: '4px',
}
const infoLabel = { fontSize: '12px', color: '#92400e', margin: '0 0 4px', fontWeight: 'bold' as const }
const infoValue = { fontSize: '17px', color: '#1a2744', margin: 0, fontWeight: 'bold' as const }
const button = {
  backgroundColor: '#F49D15', color: '#ffffff', padding: '12px 28px',
  borderRadius: '6px', fontSize: '15px', fontWeight: 'bold' as const,
  textDecoration: 'none', display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#6b7280', marginTop: '28px', textAlign: 'center' as const }
