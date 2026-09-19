import { EmailService } from '../src/email/email.service';

/**
 * Mock implementation of EmailService for tests.
 * Prevents real SMTP calls and captures sent emails for assertions.
 */
export class MockEmailService {
    public sentVerificationEmails: Array<{
        to: string;
        name: string;
        token: string;
    }> = [];

    public sentPasswordResetEmails: Array<{
        to: string;
        name: string;
        token: string;
    }> = [];

    async sendVerificationEmail(
        to: string,
        name: string,
        token: string,
    ): Promise<void> {
        this.sentVerificationEmails.push({ to, name, token });
    }

    async sendPasswordResetEmail(
        to: string,
        name: string,
        token: string,
    ): Promise<void> {
        this.sentPasswordResetEmails.push({ to, name, token });
    }

    async onModuleInit(): Promise<void> {
        // no-op
    }
}