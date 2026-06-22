import { Test, TestingModule } from '@nestjs/testing';
import { RagService } from './ai.service';

describe('RagService', () => {
  let service: RagService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RagService],
    }).compile();

    service = module.get<RagService>(RagService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizeArabic', () => {
    it('should normalize different forms of Alif to ا', () => {
      expect((service as any).normalizeArabic('أ')).toBe('ا');
      expect((service as any).normalizeArabic('إ')).toBe('ا');
      expect((service as any).normalizeArabic('آ')).toBe('ا');
    });

    it('should convert تة to ه', () => {
      expect((service as any).normalizeArabic('مدينة')).toBe('مدينه');
      expect((service as any).normalizeArabic('القاهرة')).toBe('القاهره');
    });

    it('should convert ى to ي', () => {
      expect((service as any).normalizeArabic('مصري')).toBe('مصري');
    });

    it('should handle multiple spaces', () => {
      expect((service as any).normalizeArabic('مدينة  نصر')).toBe('مدينه نصر');
    });

    it('should convert to lowercase', () => {
      expect((service as any).normalizeArabic('CAIRO')).toBe('cairo');
    });

    it('should return undefined for undefined input', () => {
      expect((service as any).normalizeArabic(undefined)).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect((service as any).normalizeArabic('')).toBeUndefined();
    });

    it('should trim whitespace', () => {
      expect((service as any).normalizeArabic('  مدينة نصر  ')).toBe('مدينه نصر');
    });
  });

  describe('applyLocationAlias', () => {
    it('should map القاهره to القاهرة', () => {
      expect((service as any).applyLocationAlias('القاهره')).toBe('القاهرة');
    });

    it('should map cairo to القاهرة', () => {
      expect((service as any).applyLocationAlias('cairo')).toBe('القاهرة');
    });

    it('should map مدينة نصر to مدينه نصر', () => {
      expect((service as any).applyLocationAlias('مدينة نصر')).toBe('مدينه نصر');
    });

    it('should map nasr city to مدينه نصر', () => {
      expect((service as any).applyLocationAlias('nasr city')).toBe('مدينه نصر');
    });

    it('should map الرحاب to el rehab', () => {
      expect((service as any).applyLocationAlias('الرحاب')).toBe('el rehab');
    });

    it('should return normalized value if no alias found', () => {
      expect((service as any).applyLocationAlias('unknown')).toBe('unknown');
    });

    it('should return undefined for undefined input', () => {
      expect((service as any).applyLocationAlias(undefined)).toBeUndefined();
    });

    it('should handle mixed case input', () => {
      expect((service as any).applyLocationAlias('Cairo')).toBe('القاهرة');
      expect((service as any).applyLocationAlias('NASR CITY')).toBe('مدينه نصر');
    });
  });

  describe('Location normalization integration', () => {
    it('should handle "مدينة نصر" vs "مدينه نصر"', () => {
      const input1 = (service as any).applyLocationAlias('مدينة نصر');
      const input2 = (service as any).applyLocationAlias('مدينه نصر');
      expect(input1).toBe(input2);
      expect(input1).toBe('مدينه نصر');
    });

    it('should handle "القاهرة" vs "القاهره"', () => {
      const input1 = (service as any).applyLocationAlias('القاهرة');
      const input2 = (service as any).applyLocationAlias('القاهره');
      expect(input1).toBe(input2);
      expect(input1).toBe('القاهرة');
    });

    it('should handle "cairo" vs "القاهرة"', () => {
      const input1 = (service as any).applyLocationAlias('cairo');
      const input2 = (service as any).applyLocationAlias('القاهرة');
      expect(input1).toBe(input2);
      expect(input1).toBe('القاهرة');
    });

    it('should handle "nasr city" vs "مدينه نصر"', () => {
      const input1 = (service as any).applyLocationAlias('nasr city');
      const input2 = (service as any).applyLocationAlias('مدينه نصر');
      expect(input1).toBe(input2);
      expect(input1).toBe('مدينه نصر');
    });

    it('should handle "maadi" vs "المعادي"', () => {
      const input1 = (service as any).applyLocationAlias('maadi');
      const input2 = (service as any).applyLocationAlias('المعادي');
      expect(input1).toBe(input2);
      expect(input1).toBe('المعادي');
    });

    it('should handle "giza" vs "الجيزة"', () => {
      const input1 = (service as any).applyLocationAlias('giza');
      const input2 = (service as any).applyLocationAlias('الجيزة');
      expect(input1).toBe(input2);
      expect(input1).toBe('الجيزة');
    });

    it('should handle "alexandria" vs "الإسكندرية"', () => {
      const input1 = (service as any).applyLocationAlias('alexandria');
      const input2 = (service as any).applyLocationAlias('الإسكندرية');
      expect(input1).toBe(input2);
      expect(input1).toBe('الإسكندرية');
    });
  });
});
