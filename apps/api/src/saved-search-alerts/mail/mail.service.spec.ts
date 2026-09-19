import { ConfigService } from '@nestjs/config';
import { SMTPServer } from 'smtp-server';
import { AddressInfo } from 'net';
import { MailService } from './mail.service';

/**
 * tasks.md 1.2: "verificar con un test (contra un servidor SMTP de prueba
 * tipo MailHog/Ethereal) que el envio funciona". En vez de depender de un
 * servicio externo (Ethereal necesita red; MailHog necesita Docker), se
 * levanta un servidor SMTP real y efimero en el propio proceso de test con
 * `smtp-server` (acepta cualquier mensaje sin autenticacion) y se comprueba
 * que Nodemailer efectivamente entrega el mensaje contra el.
 */
describe('MailService', () => {
  let server: SMTPServer;
  let port: number;
  let receivedMessages: Array<{ from: string; to: string[]; content: string }>;

  beforeAll(async () => {
    receivedMessages = [];
    server = new SMTPServer({
      disabledCommands: ['AUTH', 'STARTTLS'],
      onData(stream, session, callback) {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => {
          receivedMessages.push({
            from: session.envelope.mailFrom ? (session.envelope.mailFrom as { address: string }).address : '',
            to: session.envelope.rcptTo.map((r) => r.address),
            content: Buffer.concat(chunks).toString('utf-8'),
          });
          callback();
        });
      },
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = (server.server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  function buildMailService(): MailService {
    const values: Record<string, string> = {
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: String(port),
      SMTP_SECURE: 'false',
      SMTP_FROM: 'alertas@real-estate-platform.test',
    };
    const config = { get: (key: string, fallback?: unknown) => values[key] ?? fallback } as unknown as ConfigService;
    return new MailService(config);
  }

  it('envia un email correctamente contra un servidor SMTP real', async () => {
    receivedMessages = [];
    const mailService = buildMailService();

    const result = await mailService.sendMail({
      to: 'destinatario@example.com',
      subject: 'Asunto de prueba',
      text: 'Cuerpo en texto plano',
      html: '<p>Cuerpo en HTML</p>',
    });

    expect(result).toBe(true);
    expect(receivedMessages).toHaveLength(1);
    expect(receivedMessages[0].from).toBe('alertas@real-estate-platform.test');
    expect(receivedMessages[0].to).toEqual(['destinatario@example.com']);
    expect(receivedMessages[0].content).toContain('Asunto de prueba');
    expect(receivedMessages[0].content).toContain('Cuerpo en HTML');
  });

  it('no lanza y devuelve false si el servidor SMTP no es alcanzable', async () => {
    const values: Record<string, string> = {
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: '1', // puerto sin nada escuchando
      SMTP_SECURE: 'false',
      SMTP_FROM: 'alertas@real-estate-platform.test',
    };
    const config = { get: (key: string, fallback?: unknown) => values[key] ?? fallback } as unknown as ConfigService;
    const mailService = new MailService(config);

    const result = await mailService.sendMail({
      to: 'destinatario@example.com',
      subject: 'No deberia llegar',
      text: 'texto',
      html: '<p>html</p>',
    });

    expect(result).toBe(false);
  });
});
