/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

const LOGO_URL = 'https://xtcicjrpznawnwvjdqhe.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu acceso al portal de clientes de {siteName} está listo</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt={siteName} height="40" style={logo} />
        </Section>
        <Heading style={h1}>Tu acceso al portal está listo</Heading>
        <Text style={text}>
          Hola,
        </Text>
        <Text style={text}>
          Te invitamos a unirte a{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>{' '}
          como cliente. Desde tu portal privado podrás hacer seguimiento en
          tiempo real al diagnóstico de tu lote, revisar avances del análisis
          urbanístico y comunicarte directamente con nuestro equipo.
        </Text>
        <Text style={text}>
          Activa tu cuenta para comenzar:
        </Text>
        <Section style={{ textAlign: 'center' }}>
          <Button style={button} href={confirmationUrl}>
            Activar mi cuenta
          </Button>
        </Section>
        <Text style={footer}>
          Si no esperabas esta invitación, puedes ignorar este mensaje con
          tranquilidad. — Equipo 360Lateral
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const logoSection = { marginBottom: '24px' }
const logo = { display: 'block' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a2744', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#3f4a5e', lineHeight: '1.6', margin: '0 0 22px' }
const link = { color: '#1a2744', textDecoration: 'underline' }
const button = {
  backgroundColor: '#F49D15',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#8a93a3', margin: '32px 0 0', lineHeight: '1.5' }
