import {
    Injectable,
    InternalServerErrorException,
    Logger,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { Env } from '../config/env.validation';
import { renderPasswordResetEmail } from './templates/password-reset-email.template';
import { renderVerificationEmail } from './templates/verification-email.template';

const APP_NAME = 'E-Commerce App';
const VERIFICATION_TOKEN_TTL_HOURS = 24;
const RESET_TOKEN_TTL_MINUTES = 15;

@Injectable()
export class EmailService implements OnModuleInit {
    private readonly logger = new Logger(EmailService.name);
    private readonly transporter: Transporter;
    private readonly fromEmail: string;
    private readonly frontendUrl: string;

    constructor(private readonly config: ConfigService<Env, true>) {
        this.fromEmail = this.config.get('EMAIL_FROM', { infer: true });
        this.frontendUrl = this.config.get('FRONTEND_URL', { infer: true });

        this.transporter = nodemailer.createTransport({
            host: this.config.get('EMAIL_HOST', { infer: true }),
            port: this.config.get('EMAIL_PORT', { infer: true }),
            secure: this.config.get('EMAIL_SECURE', { infer: true }),
            auth: {
                user: this.config.get('EMAIL_USER', { infer: true }),
                pass: this.config.get('EMAIL_PASS', { infer: true }),
            },
        });
    }

    /**
     * Verifies the SMTP connection on startup so misconfigurations surface
     * immediately instead of failing silently on the first email send.
     */
    async onModuleInit(): Promise<void> {
        try {
            await this.transporter.verify();
            this.logger.log('✅ SMTP connection verified successfully');
        } catch (error) {
            this.logger.error('❌ SMTP connection verification failed', error);
        }
    }

    async sendVerificationEmail(
        to: string,
        name: string,
        token: string,
    ): Promise<void> {
        const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

        const html = renderVerificationEmail({
            name,
            verificationUrl,
            appName: APP_NAME,
            expiresInHours: VERIFICATION_TOKEN_TTL_HOURS,
        });

        await this.send({
            to,
            subject: `Verify your email for ${APP_NAME}`,
            html,
        });
    }

    async sendPasswordResetEmail(
        to: string,
        name: string,
        token: string,
    ): Promise<void> {
        const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

        const html = renderPasswordResetEmail({
            name,
            resetUrl,
            appName: APP_NAME,
            expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
        });

        await this.send({
            to,
            subject: `Reset your password for ${APP_NAME}`,
            html,
        });
    }

    private async send(options: {
        to: string;
        subject: string;
        html: string;
    }): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: `"${APP_NAME}" <${this.fromEmail}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });

            this.logger.log(`📧 Email sent → ${options.to} (${options.subject})`);
        } catch (error) {
            this.logger.error(`Failed to send email → ${options.to}`, error);
            throw new InternalServerErrorException('Failed to send email');
        }
    }
}