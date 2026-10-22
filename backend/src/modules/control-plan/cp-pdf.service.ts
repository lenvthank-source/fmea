import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { CpDocumentV2, CpOperationV2 } from './control-plan-document';

export interface RenderPdfOptions {
  scope?: 'full' | 'selected';
  selectedOperationIds?: string[];
  approvedStamp?: {
    approvedAt: Date | string;
    approverName: string;
    packageId: string;
  };
}

@Injectable()
export class CpPdfService {
  /**
   * Generates a PDF buffer for a Control Plan V2 document.
   */
  async renderControlPlanPdf(
    doc: CpDocumentV2,
    options: RenderPdfOptions = {},
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const pdf = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margin: 25,
          bufferPages: true,
          info: {
            Title: `Control Plan - ${doc.header.controlPlanNumber || 'Document'}`,
            Author: 'FMEApex Quality Platform',
          },
        });

        const buffers: Buffer[] = [];
        pdf.on('data', (chunk) => buffers.push(chunk));
        pdf.on('end', () => {
          const totalPages = pdf.bufferedPageRange().count;
          for (let i = 0; i < totalPages; i++) {
            pdf.switchToPage(i);
            // Footer
            pdf.fontSize(7).fillColor('#666666');
            pdf.text(
              `FMEApex Quality Platform — Control Plan ${doc.header.controlPlanNumber || ''} — Page ${i + 1} of ${totalPages}`,
              25,
              pdf.page.height - 20,
              { align: 'center', width: pdf.page.width - 50 },
            );
          }
          pdf.flushPages();
          resolve(Buffer.concat(buffers));
        });
        pdf.on('error', (err) => reject(err));

        // Filter operations based on scope
        const operations: CpOperationV2[] =
          options.scope === 'selected' && options.selectedOperationIds?.length
            ? doc.operations.filter((op) =>
                options.selectedOperationIds!.includes(op.id),
              )
            : doc.operations;

        this.renderHeader(pdf, doc, options.approvedStamp);
        this.renderTable(pdf, operations);

        pdf.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private renderHeader(
    pdf: typeof PDFDocument,
    doc: CpDocumentV2,
    stamp?: RenderPdfOptions['approvedStamp'],
  ) {
    const pageWidth = pdf.page.width - 50;
    const startY = 25;

    // Outer header box
    pdf
      .rect(25, startY, pageWidth, 65)
      .lineWidth(1)
      .strokeColor('#2c3e50')
      .stroke();

    // Title
    pdf
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1a252f')
      .text('CONTROL PLAN', 30, startY + 6);

    pdf
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#555555')
      .text(
        `Phase: ${doc.config.phase.toUpperCase()}${doc.config.safeLaunch.enabled ? ' (Safe Launch Active)' : ''}`,
        30,
        startY + 23,
      );

    // Grid metadata
    const col1X = 180;
    const col2X = 380;
    const col3X = 580;

    pdf.fontSize(7).font('Helvetica-Bold').fillColor('#333333');
    pdf.text('CP Number:', col1X, startY + 6);
    pdf.text('Part Number:', col1X, startY + 18);
    pdf.text('Part Name:', col1X, startY + 30);
    pdf.text('Org / Plant:', col1X, startY + 42);

    pdf.font('Helvetica').fillColor('#111111');
    pdf.text(doc.header.controlPlanNumber || '—', col1X + 55, startY + 6);
    pdf.text(doc.header.orgPartNumber || '—', col1X + 55, startY + 18);
    pdf.text(doc.header.partName || '—', col1X + 55, startY + 30);
    pdf.text(
      `${doc.header.organisationName || ''} / ${doc.header.organisationPlant || ''}`,
      col1X + 55,
      startY + 42,
    );

    pdf.font('Helvetica-Bold').fillColor('#333333');
    pdf.text('Customer:', col2X, startY + 6);
    pdf.text('Cust Part #:', col2X, startY + 18);
    pdf.text('Dwg Rev / Date:', col2X, startY + 30);
    pdf.text('Key Contact:', col2X, startY + 42);

    pdf.font('Helvetica').fillColor('#111111');
    pdf.text(doc.header.customer || '—', col2X + 65, startY + 6);
    pdf.text(doc.header.customerPartNumber || '—', col2X + 65, startY + 18);
    pdf.text(
      `${doc.header.dwgNumber || ''} ${doc.header.dwgRevNoAndDate || ''}`.trim() || '—',
      col2X + 65,
      startY + 30,
    );
    pdf.text(doc.header.keyContact || '—', col2X + 65, startY + 42);

    pdf.font('Helvetica-Bold').fillColor('#333333');
    pdf.text('Origination Date:', col3X, startY + 6);
    pdf.text('Latest Rev Date:', col3X, startY + 18);
    pdf.text('Change Level:', col3X, startY + 30);

    pdf.font('Helvetica').fillColor('#111111');
    pdf.text(doc.header.originationDate || '—', col3X + 75, startY + 6);
    pdf.text(doc.header.latestChangeLevel || '—', col3X + 75, startY + 18);
    pdf.text(doc.header.engineeringChangeLevel || '—', col3X + 75, startY + 30);

    if (stamp) {
      pdf
        .rect(col3X + 60, startY + 38, 140, 22)
        .fillColor('#e8f5e9')
        .fillAndStroke('#2e7d32', '#2e7d32');
      pdf
        .fontSize(7)
        .font('Helvetica-Bold')
        .fillColor('#1b5e20')
        .text('APPROVED ARTIFACT', col3X + 65, startY + 41);
      pdf
        .fontSize(6)
        .font('Helvetica')
        .text(
          `${stamp.approverName} • ${new Date(stamp.approvedAt).toLocaleDateString()}`,
          col3X + 65,
          startY + 50,
        );
    }

    pdf.y = startY + 75;
  }

  private renderTable(pdf: typeof PDFDocument, operations: CpOperationV2[]) {
    const pageWidth = pdf.page.width - 50;
    const colWidths = [55, 95, 80, 45, 90, 85, 80, 80, 90, 82];
    const headers = [
      'Op #',
      'Operation Name / Equipment',
      'Characteristic',
      'Class',
      'Specification / Tol',
      'Eval / Measurement',
      'Sample / Freq',
      'Control Method',
      'Reaction Plan',
      'Owner',
    ];

    const drawTableHeader = (y: number) => {
      pdf.rect(25, y, pageWidth, 18).fillColor('#f0f3f6').fill();
      pdf.rect(25, y, pageWidth, 18).lineWidth(0.5).strokeColor('#888888').stroke();

      let currentX = 25;
      pdf.fontSize(6.5).font('Helvetica-Bold').fillColor('#111111');
      for (let i = 0; i < headers.length; i++) {
        pdf.text(headers[i], currentX + 2, y + 5, {
          width: colWidths[i] - 4,
          align: 'left',
        });
        currentX += colWidths[i];
      }
    };

    let currentY = pdf.y;
    drawTableHeader(currentY);
    currentY += 18;

    for (const op of operations) {
      const opEquipment = (op.resources || []).map((r) => r.text).join(', ');

      for (const char of op.characteristics || []) {
        for (const ctrl of char.controls || []) {
          // Check for page break
          if (currentY > pdf.page.height - 45) {
            pdf.addPage();
            currentY = 25;
            drawTableHeader(currentY);
            currentY += 18;
          }

          const rowHeight = 22;
          pdf
            .rect(25, currentY, pageWidth, rowHeight)
            .lineWidth(0.3)
            .strokeColor('#d0d5dd')
            .stroke();

          let currentX = 25;
          pdf.fontSize(6.5).font('Helvetica').fillColor('#222222');

          // Op #
          pdf.text(op.number || '—', currentX + 2, currentY + 4, {
            width: colWidths[0] - 4,
          });
          currentX += colWidths[0];

          // Op Name & Equipment
          const opDisplay = `${op.name || ''}\n${opEquipment ? `[${opEquipment}]` : ''}`.trim();
          pdf.text(opDisplay || '—', currentX + 2, currentY + 3, {
            width: colWidths[1] - 4,
          });
          currentX += colWidths[1];

          // Characteristic
          pdf.text(char.description || '—', currentX + 2, currentY + 4, {
            width: colWidths[2] - 4,
          });
          currentX += colWidths[2];

          // Class
          pdf.text(char.classification || '—', currentX + 2, currentY + 4, {
            width: colWidths[3] - 4,
          });
          currentX += colWidths[3];

          // Spec / Tolerance
          const specText = `${char.criteria.specification || ''} ${char.criteria.tolerance || ''}`.trim();
          pdf.text(specText || '—', currentX + 2, currentY + 4, {
            width: colWidths[4] - 4,
          });
          currentX += colWidths[4];

          // Evaluation Method
          pdf.text(ctrl.evaluationMethod || '—', currentX + 2, currentY + 4, {
            width: colWidths[5] - 4,
          });
          currentX += colWidths[5];

          // Execution Rule / Sample
          let sampleText = ctrl.executionRule.summary || '—';
          if (ctrl.executionRule.mode === 'count') {
            sampleText = `${ctrl.executionRule.sampleSize} / ${ctrl.executionRule.frequency}`;
          }
          pdf.text(sampleText, currentX + 2, currentY + 4, {
            width: colWidths[6] - 4,
          });
          currentX += colWidths[6];

          // Control Method
          pdf.text(ctrl.method || '—', currentX + 2, currentY + 4, {
            width: colWidths[7] - 4,
          });
          currentX += colWidths[7];

          // Reaction Plan
          pdf.text(ctrl.reaction.plan || '—', currentX + 2, currentY + 4, {
            width: colWidths[8] - 4,
          });
          currentX += colWidths[8];

          // Owner
          pdf.text(ctrl.responsibility || '—', currentX + 2, currentY + 4, {
            width: colWidths[9] - 4,
          });

          currentY += rowHeight;
        }
      }
    }
  }
}
