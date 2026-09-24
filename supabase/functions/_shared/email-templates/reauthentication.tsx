/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

const LOGO_URL = 'https://xtcicjrpznawnwvjdqhe.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu código de verificación de 360Lateral</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt="360Lateral" height="40" style={logo} />
        </Section>
        <Heading style={h1}>Confirma tu identidad</Heading>
        <Text style={text}>Usa este código para continuar:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          El código caduca en unos minutos. Si no fuiste tú, ignora este mensaje.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const logoSection = { marginBottom: '24px' }
const logo = { display: 'block' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a2744', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#3f4a5e', lineHeight: '1.6', margin: '0 0 16px' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#1a2744',
  letterSpacing: '4px',
  margin: '0 0 24px',
}
const footer = { fontSize: '12px', color: '#8a93a3', margin: '32px 0 0', lineHeight: '1.5' }
