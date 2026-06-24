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
  nivel?: string
  periodoMeses?: number
  fechaVencimiento?: string
  marketplaceUrl?: string
}

const Email = ({
  nombreDesarrollador = 'Desarrollador',
  nivel = 'Profesional',
  periodoMeses = 1,
  fechaVencimiento = '',
  marketplaceUrl = `${SITE_URL}/lotes`,
}: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu suscripción {nivel} está activa</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt="360Lateral" height="40" style={{ display: 'block' }} />
        </Section>
        <Heading style={h1}>Tu suscripción está activa</Heading>
        <Text style={text}>Hola {nombreDesarrollador},</Text>
        <Text style={text}>
          Plan <strong>{nivel}</strong> activo por {periodoMeses}{' '}
          {periodoMeses === 1 ? 'mes' : 'meses'}
          {fechaVencimiento && <> · vigente hasta <strong>{fechaVencimiento}</strong></>}.
        </Text>
        <Text style={text}>
          Ya tienes acceso completo al marketplace de lotes con análisis pre-cargados.
        </Text>
        <Section style={{ textAlign: 'center', marginTop: 24 }}>
          <Button style={button} href={marketplaceUrl}>Explorar marketplace</Button>
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
    `Tu suscripción ${d?.nivel ?? ''} está activa`.trim(),
  displayName: 'Suscripción activada (desarrollador)',
  previewData: {
    nombreDesarrollador: 'Carlos',
    nivel: 'Profesional',
    periodoMeses: 12,
    fechaVencimiento: '24/06/2027',
    marketplaceUrl: `${SITE_URL}/lotes`,
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
