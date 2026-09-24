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
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

const LOGO_URL = 'https://xtcicjrpznawnwvjdqhe.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Restablece tu contraseña de {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} alt={siteName} height="40" style={logo} />
        </Section>
        <Heading style={h1}>Restablece tu contraseña</Heading>
        <Text style={text}>
          Recibimos una solicitud para cambiar la contraseña de tu cuenta en {siteName}.
          Haz clic en el botón para elegir una nueva.
        </Text>
        <Section style={{ textAlign: 'center' }}>
          <Button style={button} href={confirmationUrl}>
            Crear nueva contraseña
          </Button>
        </Section>
        <Text style={footer}>
          Si no solicitaste este cambio, puedes ignorar este mensaje. Tu contraseña actual seguirá funcionando.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const logoSection = { marginBottom: '24px' }
const logo = { display: 'block' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a2744', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#3f4a5e', lineHeight: '1.6', margin: '0 0 22px' }
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
