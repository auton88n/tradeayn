import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Img,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface PasswordResetEmailProps {
  confirmationUrl: string;
  userEmail: string;
}

export const PasswordResetEmail = ({
  confirmationUrl,
  userEmail,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your AYN password - secure link inside</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header with gradient background */}
        <Section style={headerSection}>
          <div style={headerContent}>
            <Heading style={headerTitle}>Reset Your Password</Heading>
            <Text style={headerSubtitle}>AYN - AI Business Consultant</Text>
          </div>
        </Section>

        {/* Main content */}
        <Section style={contentSection}>
          <Text style={greeting}>Hello,</Text>
          
          <Text style={bodyText}>
            You requested to reset your password for your AYN account.
          </Text>
          
          <Text style={bodyText}>
            Click the button below to create a new password:
          </Text>

          <Section style={buttonSection}>
            <Button
              href={confirmationUrl}
              style={resetButton}
            >
              Reset Password
            </Button>
          </Section>

          <Text style={expiryText}>
            This link expires in 24 hours for security.
          </Text>

          <Text style={bodyText}>
            If you didn't request this reset, you can ignore this email.
          </Text>

          <Text style={bodyText}>
            Questions? Contact us at{' '}
            <Link href="mailto:support@aynn.io" style={supportLink}>
              support@aynn.io
            </Link>
          </Text>

          <Text style={signature}>
            Best regards,<br />
            The AYN Team
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footerSection}>
          <Text style={footerText}>
            © 2024 AYN - AI Business Consultant. All rights reserved.
          </Text>
          <Text style={footerText}>
            This email was sent to {userEmail}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

// Styles
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
}

const headerSection = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '40px 32px',
  textAlign: 'center' as const,
}

const headerContent = {
  color: '#ffffff',
}

const headerTitle = {
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 8px 0',
  color: '#ffffff',
}

const headerSubtitle = {
  fontSize: '16px',
  fontWeight: '400',
  margin: '0',
  opacity: '0.9',
  color: '#ffffff',
}

const contentSection = {
  padding: '40px 32px',
}

const greeting = {
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 24px 0',
  color: '#1a202c',
}

const bodyText = {
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
  color: '#4a5568',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const resetButton = {
  backgroundColor: '#3182ce',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  border: 'none',
  cursor: 'pointer',
}

const expiryText = {
  fontSize: '14px',
  color: '#e53e3e',
  margin: '20px 0',
  textAlign: 'center' as const,
  fontWeight: '500',
}

const supportLink = {
  color: '#3182ce',
  textDecoration: 'underline',
}

const signature = {
  fontSize: '16px',
  margin: '32px 0 0 0',
  color: '#1a202c',
  fontWeight: '500',
}

const footerSection = {
  backgroundColor: '#f7fafc',
  padding: '24px 32px',
  borderTop: '1px solid #e2e8f0',
}

const footerText = {
  fontSize: '12px',
  color: '#718096',
  textAlign: 'center' as const,
  margin: '4px 0',
}