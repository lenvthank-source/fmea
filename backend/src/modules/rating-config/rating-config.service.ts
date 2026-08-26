import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const DEFAULT_SEVERITY: Array<{ value: number; label: string; criteria: string; color: string }> = [
  { value: 10, label: 'Hazardous without warning', criteria: 'Failure affects safe operation or violates regulation without warning. Severity 10 is highest.', color: '#dc2626' },
  { value: 9, label: 'Hazardous with warning', criteria: 'Failure affects safe operation with warning. Regulatory impact.', color: '#dc2626' },
  { value: 8, label: 'Very High', criteria: 'Vehicle/item inoperable, loss of primary function. Customer dissatisfied.', color: '#ea580c' },
  { value: 7, label: 'High', criteria: 'Reduced performance, customer dissatisfied, function degraded.', color: '#ea580c' },
  { value: 6, label: 'Moderate', criteria: 'Comfort/convenience degraded, customer experiences discomfort.', color: '#ca8a04' },
  { value: 5, label: 'Low', criteria: 'Moderate effect, customer notices, minor inconvenience.', color: '#ca8a04' },
  { value: 4, label: 'Very Low', criteria: 'Minor effect, customer may not notice, slight annoyance.', color: '#65a30d' },
  { value: 3, label: 'Minor', criteria: 'Very minor, customer unlikely to notice.', color: '#65a30d' },
  { value: 2, label: 'Very Minor', criteria: 'No effect on performance, cosmetic only.', color: '#16a34a' },
  { value: 1, label: 'None', criteria: 'No effect.', color: '#16a34a' },
];

const DEFAULT_OCCURRENCE: Array<{ value: number; label: string; criteria: string; color: string }> = [
  { value: 10, label: 'Extremely High', criteria: 'Failure inevitable, ≥1 in 2. Cpk <0.33', color: '#dc2626' },
  { value: 9, label: 'Very High', criteria: '1 in 3. Cpk 0.33', color: '#dc2626' },
  { value: 8, label: 'High', criteria: '1 in 8. Cpk 0.51', color: '#ea580c' },
  { value: 7, label: 'High', criteria: '1 in 20. Cpk 0.67', color: '#ea580c' },
  { value: 6, label: 'Moderate', criteria: '1 in 80. Cpk 0.83', color: '#ca8a04' },
  { value: 5, label: 'Moderate', criteria: '1 in 400. Cpk 1.00', color: '#ca8a04' },
  { value: 4, label: 'Low', criteria: '1 in 2000. Cpk 1.17', color: '#65a30d' },
  { value: 3, label: 'Low', criteria: '1 in 15k. Cpk 1.33', color: '#65a30d' },
  { value: 2, label: 'Very Low', criteria: '1 in 150k. Cpk 1.50', color: '#16a34a' },
  { value: 1, label: 'Remote', criteria: '1 in 1.5M. Cpk 1.67', color: '#16a34a' },
];

const DEFAULT_DETECTION: Array<{ value: number; label: string; criteria: string; color: string }> = [
  { value: 10, label: 'Almost Impossible', criteria: 'No known control can detect failure.', color: '#dc2626' },
  { value: 9, label: 'Very Remote', criteria: 'Very remote chance to detect.', color: '#dc2626' },
  { value: 8, label: 'Remote', criteria: 'Remote chance.', color: '#ea580c' },
  { value: 7, label: 'Very Low', criteria: 'Very low chance.', color: '#ea580c' },
  { value: 6, label: 'Low', criteria: 'Low chance.', color: '#ca8a04' },
  { value: 5, label: 'Moderate', criteria: 'Moderate chance.', color: '#ca8a04' },
  { value: 4, label: 'Moderately High', criteria: 'Moderately high chance.', color: '#65a30d' },
  { value: 3, label: 'High', criteria: 'High chance.', color: '#65a30d' },
  { value: 2, label: 'Very High', criteria: 'Very high chance.', color: '#16a34a' },
  { value: 1, label: 'Almost Certain', criteria: 'Control will almost certainly detect.', color: '#16a34a' },
];

@Injectable()
export class RatingConfigService {
  constructor(private prisma: PrismaService) {}

  private async ensureSeeded() {
    const counts = await Promise.all([
      this.prisma.severityScale.count(),
      this.prisma.occurrenceScale.count(),
      this.prisma.detectionScale.count(),
    ]);
    if (counts[0] === 0) {
      await this.prisma.severityScale.createMany({ data: DEFAULT_SEVERITY, skipDuplicates: true });
    }
    if (counts[1] === 0) {
      await this.prisma.occurrenceScale.createMany({ data: DEFAULT_OCCURRENCE, skipDuplicates: true });
    }
    if (counts[2] === 0) {
      await this.prisma.detectionScale.createMany({ data: DEFAULT_DETECTION, skipDuplicates: true });
    }
  }

  async findAll() {
    await this.ensureSeeded();
    const [severity, occurrence, detection] = await Promise.all([
      this.prisma.severityScale.findMany({ orderBy: { value: 'desc' } }),
      this.prisma.occurrenceScale.findMany({ orderBy: { value: 'desc' } }),
      this.prisma.detectionScale.findMany({ orderBy: { value: 'desc' } }),
    ]);
    // Fallback to defaults if still empty (e.g., migration not run)
    return {
      severity: severity.length ? severity : DEFAULT_SEVERITY,
      occurrence: occurrence.length ? occurrence : DEFAULT_OCCURRENCE,
      detection: detection.length ? detection : DEFAULT_DETECTION,
    };
  }

  async update(scale: string, value: number, dto: { label?: string; criteria?: string; color?: string }) {
    const v = Number(value);
    if (isNaN(v) || v < 1 || v > 10) throw new BadRequestException('Value must be 1..10');
    const s = scale.toLowerCase();
    if (!['severity', 'occurrence', 'detection'].includes(s)) throw new BadRequestException('Scale must be severity|occurrence|detection');

    const data: any = {};
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.criteria !== undefined) data.criteria = dto.criteria;
    if (dto.color !== undefined) data.color = dto.color;

    if (s === 'severity') {
      await this.ensureSeeded();
      return this.prisma.severityScale.upsert({ where: { value: v }, update: data, create: { value: v, label: dto.label || `Level ${v}`, criteria: dto.criteria || '', color: dto.color || '#64748b' } });
    }
    if (s === 'occurrence') {
      await this.ensureSeeded();
      return this.prisma.occurrenceScale.upsert({ where: { value: v }, update: data, create: { value: v, label: dto.label || `Level ${v}`, criteria: dto.criteria || '', color: dto.color || '#64748b' } });
    }
    await this.ensureSeeded();
    return this.prisma.detectionScale.upsert({ where: { value: v }, update: data, create: { value: v, label: dto.label || `Level ${v}`, criteria: dto.criteria || '', color: dto.color || '#64748b' } });
  }
}
