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
  nombreDesarrollador?: string
  nombreLote?: string
  diasAcceso?: number
  fechaExpiracion?: string
  loteUrl?: string
}

const Email = ({
  nombreDesarrollador = 'Desarrollador',
  nombreLote = 'el lote',
  diasAcceso = 30,
  fechaExpiracion = '',
  loteUrl = SITE_URL,
}: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Acceso desbloqueado al lote {nombreLote}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt="360Lateral" height="40" style={{ display: 'block' }} />
        </Section>
        <Heading style={h1}>Acceso al lote activado</Heading>
        <Text style={text}>Hola {nombreDesarrollador},</Text>
        <Text style={text}>
          Tienes acceso completo a <strong>{nombreLote}</strong> por{' '}
          <strong>{diasAcceso} días</strong>
          {fechaExpiracion && <> · vence el <strong>{fechaExpiracion}</strong></>}.
        </Text>
        <Text style={text}>
          Al desbloquear aceptaste el Acuerdo de No Elusión: cualquier negocio sobre este
          activo se tramita exclusivamente a través de 360Lateral.
        </Text>
        <Section style={{ textAlign: 'center', marginTop: 24 }}>
          <Button style={button} href={loteUrl}>Ver el lote</Button>
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
    `Acceso activado · ${d?.nombreLote ?? 'lote'}`,
  displayName: 'Acceso PPV activado (desarrollador)',
  previewData: {
    nombreDesarrollador: 'Carlos',
    nombreLote: 'Lote Las Palmas',
    diasAcceso: 30,
    fechaExpiracion: '24/07/2026',
    loteUrl: SITE_URL,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const logoSection = { marginBottom: '24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a2744', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#1a2744', lineHeight: '22px', margin: '0 0 14px' }
const button = {
  backgroundColor: '#F49D15', color: '#ffffff', padding: '12px 28px',
  borderRadius: '6px', fontSize: '15px', fontWeight: 'bold' as const,
  textDecoration: 'none', display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#6b7280', marginTop: '28px', textAlign: 'center' as const }
