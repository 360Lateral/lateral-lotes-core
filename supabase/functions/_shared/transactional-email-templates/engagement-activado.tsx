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
  nombrePropietario?: string
  nombreLote?: string
  nombrePlan?: string
  slaDias?: number
  analisisIncluidos?: string[]
  loteUrl?: string
}

const Email = ({
  nombrePropietario = 'Cliente',
  nombreLote = 'tu lote',
  nombrePlan = 'tu plan',
  slaDias = 7,
  analisisIncluidos = [],
  loteUrl = SITE_URL,
}: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu análisis 360° del lote {nombreLote} ha iniciado</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt="360Lateral" height="40" style={{ display: 'block' }} />
        </Section>
        <Heading style={h1}>Tu análisis 360° ha iniciado</Heading>
        <Text style={text}>Hola {nombrePropietario},</Text>
        <Text style={text}>
          Hemos activado el plan <strong>{nombrePlan}</strong> para tu lote{' '}
          <strong>{nombreLote}</strong>. Nuestro equipo de expertos iniciará el trabajo y
          recibirás los resultados en <strong>{slaDias} días hábiles</strong>.
        </Text>
        {analisisIncluidos.length > 0 && (
          <Section style={card}>
            <Text style={cardTitle}>Análisis incluidos:</Text>
            {analisisIncluidos.map((a, i) => (
              <Text key={i} style={bullet}>• {a}</Text>
            ))}
          </Section>
        )}
        <Section style={{ textAlign: 'center', marginTop: 24 }}>
          <Button style={button} href={loteUrl}>Ver mi lote</Button>
        </Section>
        <Text style={footer}>
          ¿Preguntas? Escríbenos a facturacionterra@360lateral.com
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Análisis 360° iniciado · ${d?.nombreLote ?? 'tu lote'}`,
  displayName: 'Engagement activado (propietario)',
  previewData: {
    nombrePropietario: 'Ana',
    nombreLote: 'Lote Las Palmas',
    nombrePlan: 'Pro',
    slaDias: 7,
    analisisIncluidos: ['Normativa urbana', 'Jurídico', 'Financiero', 'Mercado', 'Arquitectónico'],
    loteUrl: SITE_URL,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const logoSection = { marginBottom: '24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a2744', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#1a2744', lineHeight: '22px', margin: '0 0 14px' }
const card = {
  backgroundColor: '#fff8ec', border: '1px solid #f3d8a8',
  borderRadius: '8px', padding: '16px 18px', margin: '18px 0',
}
const cardTitle = { fontSize: '13px', fontWeight: 'bold' as const, color: '#1a2744', margin: '0 0 8px' }
const bullet = { fontSize: '14px', color: '#1a2744', margin: '4px 0' }
const button = {
  backgroundColor: '#F49D15', color: '#ffffff', padding: '12px 28px',
  borderRadius: '6px', fontSize: '15px', fontWeight: 'bold' as const,
  textDecoration: 'none', display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#6b7280', marginTop: '28px', textAlign: 'center' as const }
