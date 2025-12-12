import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendMail(to: string, subject: string, html: string) {
        try {
            const info = await this.transporter.sendMail({
                from: `"Supermercado Garcia" <${process.env.SMTP_USER}>`, // sender address
                to, // list of receivers
                subject, // Subject line
                html, // html body
            });
            console.log('Message sent: %s', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    async sendLowStockAlert(productName: string, currentStock: number) {
        const subject = `⚠️ Alerta de Stock Bajo: ${productName}`;
        const html = `
      <h1>Alerta de Inventario</h1>
      <p>El producto <strong>${productName}</strong> tiene un stock crítico.</p>
      <p><strong>Stock Actual:</strong> ${currentStock}</p>
      <p>Por favor, reabastecer lo antes posible.</p>
    `;
        // Send to the same user for now, or a configured admin email
        if (process.env.SMTP_USER) {
            return this.sendMail(process.env.SMTP_USER, subject, html);
        }
    }

    async sendNewSaleAlert(saleId: number, total: number, itemsCount: number) {
        const subject = `💰 Nueva Venta Realizada #${saleId}`;
        const html = `
      <h1>Nueva Venta</h1>
      <p>Se ha registrado una nueva venta exitosa.</p>
      <ul>
        <li><strong>ID Venta:</strong> #${saleId}</li>
        <li><strong>Total:</strong> Bs. ${total.toFixed(2)}</li>
        <li><strong>Items:</strong> ${itemsCount}</li>
      </ul>
    `;
        if (process.env.SMTP_USER) {
            return this.sendMail(process.env.SMTP_USER, subject, html);
        }
    }
    async sendDailySummary(totalRevenue: number, totalSales: number) {
        const subject = `📊 Resumen Diario de Ventas - ${new Date().toLocaleDateString()}`;
        const html = `
            <h1>Resumen del Día</h1>
            <p>Aquí tienes el resumen de ventas de ayer:</p>
            <ul>
                <li><strong>Total Vendido:</strong> Bs. ${totalRevenue.toFixed(2)}</li>
                <li><strong>Cantidad de Ventas:</strong> ${totalSales}</li>
            </ul>
        `;
        if (process.env.SMTP_USER) {
            return this.sendMail(process.env.SMTP_USER, subject, html);
        }
    }
}
