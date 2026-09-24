/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL =
  'https://xtcicjrpznawnwvjdqhe.supabase.co/storage/v1/object/public/email-assets/logo.png'
const SITE_URL = 'https://urbanix360.com'

interface Props { nombre?: string; ubicacion?: string; area?: string }

const Email = ({ nombre = '', ubicacion = '', area = '' }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Recibimos tu solicitud de Diagnóstico 360°</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt="360Lateral" height="40" style={{ display: 'block' }} />
        </Section>
        <Heading style={h1}>Recibimos tu solicitud</Heading>
        <Text style={text}>Hola{nombre ? ` ${nombre}` : ''},</Text>
        <Text style={text}>
          Gracias por solicitar tu Diagnóstico 360°. Nuestro equipo revisará la información de tu lote
          y en menos de 24 horas recibirás tu reporte en este correo.
        </Text>
        {(ubicacion || area) && (
          <Section style={infoBox}>
            <Text style={infoLabel}>Tu lote</Text>
            <Text style={infoValue}>{[ubicacion, area].filter(Boolean).join(' · ')}</Text>
          </Section>
        )}
        <Section style={{ textAlign: 'center', marginTop: 24 }}>
          <Button style={button} href={SITE_URL}>Visitar 360Lateral</Button>
        </Section>
        <Text style={footer}>¿Preguntas? Escríbenos a facturacionterra@360lateral.com</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Recibimos tu solicitud de Diagnóstico 360°',
  displayName: 'Diagnóstico · confirmación al solicitante',
  previewData: { nombre: 'Ana', ubicacion: 'Rionegro, Antioquia', area: '1.200 m²' },
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
