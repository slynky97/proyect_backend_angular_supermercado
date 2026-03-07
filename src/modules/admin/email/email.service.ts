import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { Nota } from '../nota/entities/nota.entity';

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

    async sendNewSaleAlert(nota: Nota) {
        const subject = `💰 Nueva Venta Realizada #${nota.id}`;
        const total = Number(nota.total_calculado);
        const itemsCount = nota.movimientos ? nota.movimientos.length : 0;
        const sellerName = nota.user ? nota.user.name : 'N/A';

        const html = `
      <h1>Nueva Venta</h1>
      <p>Se ha registrado una nueva venta exitosa.</p>
      <ul>
        <li><strong>ID Venta:</strong> #${nota.id}</li>
        <li><strong>Total:</strong> Bs. ${total.toFixed(2)}</li>
        <li><strong>Items:</strong> ${itemsCount}</li>
        <li><strong>Vendedor:</strong> ${sellerName}</li>
      </ul>
    `;
        if (process.env.SMTP_USER) {
            try {
                const pdfBuffer = await this.generateReceiptPdf(nota);
                return this.transporter.sendMail({
                    from: `"Supermercado Garcia" <${process.env.SMTP_USER}>`,
                    to: process.env.SMTP_USER,
                    subject,
                    html,
                    attachments: [
                        {
                            filename: `Recibo_Venta_${nota.id}.pdf`,
                            content: pdfBuffer,
                            contentType: 'application/pdf'
                        }
                    ]
                });
            } catch (error) {
                console.error('Error generating PDF or sending email:', error);
            }
        }
    }

    private generateReceiptPdf(nota: Nota): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).text('Supermercado Garcia', { align: 'center' });
            doc.fontSize(12).text('Recibo de Venta', { align: 'center' });
            doc.moveDown();

            // Info
            doc.fontSize(10);
            doc.text(`Fecha: ${new Date(nota.fecha).toLocaleString()}`, { align: 'left' });
            doc.text(`Nota ID: #${nota.id}`, { align: 'left' });
            doc.text(`Cliente: ${nota.cliente ? nota.cliente.razon_social : 'Venta General'}`, { align: 'left' });
            doc.text(`Vendedor: ${nota.user ? nota.user.name : 'N/A'}`, { align: 'left' });
            doc.moveDown();

            // Table Header
            const startY = doc.y;
            doc.text('Producto', 50, startY, { width: 250 });
            doc.text('Cant.', 300, startY, { width: 50, align: 'right' });
            doc.text('P.Unit', 350, startY, { width: 80, align: 'right' });
            doc.text('Total', 430, startY, { width: 80, align: 'right' });

            doc.moveTo(50, doc.y + 15).lineTo(510, doc.y + 15).stroke();
            doc.moveDown();
            doc.moveDown();

            // Items
            if (nota.movimientos) {
                nota.movimientos.forEach(mov => {
                    const y = doc.y;
                    const nombre = mov.producto ? mov.producto.nombre : 'Producto Desconocido';
                    const cantidad = mov.cantidad;
                    const precio = Number(mov.precio_unitario_venta || 0).toFixed(2);
                    const subtotal = Number(mov.total_calculado || 0).toFixed(2);

                    doc.text(nombre, 50, y, { width: 250 });
                    doc.text(cantidad.toString(), 300, y, { width: 50, align: 'right' });
                    doc.text(precio, 350, y, { width: 80, align: 'right' });
                    doc.text(subtotal, 430, y, { width: 80, align: 'right' });
                    doc.moveDown();
                });
            }

            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(510, doc.y).stroke();
            doc.moveDown();

            // Total
            doc.fontSize(14).text(`Total a Pagar: Bs. ${Number(nota.total_calculado).toFixed(2)}`, { align: 'right' });

            doc.end();
        });
    }
    async sendDailySummary(totalRevenue: number, totalSales: number, sales: Nota[]) {
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
            try {
                const pdfBuffer = await this.generateDailyReportPdf(totalRevenue, totalSales, sales);
                return this.transporter.sendMail({
                    from: `"Supermercado Garcia" <${process.env.SMTP_USER}>`,
                    to: process.env.SMTP_USER,
                    subject,
                    html,
                    attachments: [
                        {
                            filename: `Resumen_Diario_${new Date().toISOString().split('T')[0]}.pdf`,
                            content: pdfBuffer,
                            contentType: 'application/pdf'
                        }
                    ]
                });
            } catch (error) {
                console.error('Error generating Daily PDF or sending email:', error);
            }
        }
    }

    private generateDailyReportPdf(totalRevenue: number, totalSales: number, sales: Nota[]): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const generateHeader = () => {
                doc.fontSize(20).text('Supermercado Garcia', { align: 'center' });
                doc.fontSize(14).text('Resumen Diario de Ventas', { align: 'center' });
                doc.fontSize(10).text(`Fecha del Reporte: ${new Date().toLocaleDateString()}`, { align: 'center' });
                doc.moveDown();
            };

            generateHeader();

            // Summary Box
            const summaryY = doc.y;
            doc.rect(100, summaryY, 400, 80).stroke();
            doc.fontSize(12).text(`Total Ventas: ${totalSales}`, 120, summaryY + 20);
            doc.fontSize(14).fillColor('green').text(`Ingresos: Bs. ${totalRevenue.toFixed(2)}`, 120, summaryY + 45);
            doc.fillColor('black');
            doc.y = summaryY + 100;

            doc.fontSize(12).text('Detalle de Ventas', { underline: true });
            doc.moveDown();

            let y = doc.y;

            // Table Header
            const drawTableHeader = (yPos: number) => {
                doc.fontSize(9).font('Helvetica-Bold');
                doc.text('Producto', 50, yPos, { width: 200 });
                doc.text('Cant.', 250, yPos, { width: 40, align: 'right' });
                doc.text('P.Unit', 300, yPos, { width: 60, align: 'right' });
                doc.text('Total', 370, yPos, { width: 60, align: 'right' });
                doc.text('Vendedor', 440, yPos, { width: 100, align: 'left' });
                doc.moveTo(50, yPos + 12).lineTo(540, yPos + 12).stroke();
                doc.font('Helvetica');
                return yPos + 20;
            };

            y = drawTableHeader(y);

            sales.forEach((sale) => {
                if (doc.y > 700) {
                    doc.addPage();
                    generateHeader();
                    y = drawTableHeader(doc.y);
                }

                // Sale Header (ID and Time)
                doc.fontSize(8).fillColor('gray');
                doc.text(`Venta #${sale.id} - ${new Date(sale.fecha).toLocaleTimeString()}`, 50, y);
                doc.fillColor('black');
                y += 12;

                if (sale.movimientos) {
                    sale.movimientos.forEach(mov => {
                        if (doc.y > 720) {
                            doc.addPage();
                            generateHeader();
                            y = drawTableHeader(doc.y);
                            // Re-print sale header on new page if split? Maybe overkill, keep simple.
                        }

                        const productName = mov.producto ? mov.producto.nombre : 'Desconocido';
                        const quantity = mov.cantidad;
                        const price = Number(mov.precio_unitario_venta || 0).toFixed(2);
                        const total = Number(mov.total_calculado || 0).toFixed(2);
                        const seller = sale.user ? sale.user.name : 'N/A';

                        doc.fontSize(9);
                        doc.text(productName, 50, y, { width: 200 });
                        doc.text(quantity.toString(), 250, y, { width: 40, align: 'right' });
                        doc.text(price, 300, y, { width: 60, align: 'right' });
                        doc.text(total, 370, y, { width: 60, align: 'right' });
                        doc.text(seller, 440, y, { width: 100, align: 'left' });

                        y += 14;
                    });
                }
                y += 5; // Space between sales
            });

            doc.end();
        });
    }
}
