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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

const LOGO_URL = 'https://xtcicjrpznawnwvjdqhe.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Confirma tu correo para empezar en {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt={siteName} height="40" style={logo} />
        </Section>
        <Heading style={h1}>¡Bienvenido a {siteName}!</Heading>
        <Text style={text}>
          Gracias por unirte a{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Solo falta un paso: confirma tu correo (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) para activar tu cuenta.
        </Text>
        <Section style={{ textAlign: 'center' }}>
          <Button style={button} href={confirmationUrl}>
            Confirmar mi correo
          </Button>
        </Section>
        <Text style={footer}>
          Si no creaste esta cuenta, puedes ignorar este mensaje con tranquilidad.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const logoSection = { marginBottom: '24px' }
const logo = { display: 'block' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#1a2744',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#3f4a5e',
  lineHeight: '1.6',
  margin: '0 0 22px',
}
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
