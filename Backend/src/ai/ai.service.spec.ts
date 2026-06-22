import { RagService } from './ai.service';

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      embedContent: jest.fn(),
      generateContent: jest.fn(),
    },
  })),
}));

const NOT_FOUND_MESSAGE = 'لم أجد سكنًا مناسبًا بناءً على طلبك.';

describe('RagService smoke tests', () => {
  let service: RagService;
  let prisma: any;
  let locationInsightsService: any;
  let roommateMatchingService: any;

  beforeEach(() => {
    prisma = {
      listing: {
        findMany: jest.fn(),
      },
      listingVector: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      listingLocationInsight: {
        findUnique: jest.fn(),
      },
    };
    locationInsightsService = {
      generateForListingAutomatically: jest.fn(),
    };
    roommateMatchingService = {
      getListingRoommates: jest.fn(),
    };
    service = new RagService(
      prisma,
      locationInsightsService,
      roommateMatchingService,
    );
  });

  it('1. rejects a low top similarity score without calling the generation model', async () => {
    jest.spyOn(service as any, 'extractFilters').mockResolvedValue({});
    jest.spyOn(service as any, 'findApprovedListings').mockResolvedValue([
      {
        id: 1,
        locationInsight: null,
      },
    ]);
    jest.spyOn(service as any, 'createEmbedding').mockResolvedValue([1, 0]);

    prisma.listingVector.findMany.mockResolvedValue([
      {
        listingId: 1,
        vectorText: [0, 1],
        textChunk: 'Listing ID: 1',
      },
    ]);
    prisma.listingVector.count.mockResolvedValue(100);

    const generateContent = (service as any).ai.models.generateContent;

    await expect(service.generateRAGResponse('عايز سكن')).resolves.toBe(
      NOT_FOUND_MESSAGE,
    );
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('2. returns the same listing set for two real spellings of the same location', async () => {
    const rehabListings = [
      { id: 10, title: 'Rehab studio', monthlyRent: 6000 },
      { id: 11, title: 'Rehab room', monthlyRent: 4500 },
    ];
    prisma.listing.findMany.mockResolvedValue(rehabListings);

    const englishAliasResults = await (service as any).findApprovedListings({
      area: 'el rehab',
    });
    const englishAliasWhere = prisma.listing.findMany.mock.calls[0][0].where;

    prisma.listing.findMany.mockClear();

    const arabicAliasResults = await (service as any).findApprovedListings({
      area: 'الرحاب',
    });
    const arabicAliasWhere = prisma.listing.findMany.mock.calls[0][0].where;

    expect(englishAliasResults).toEqual(rehabListings);
    expect(arabicAliasResults).toEqual(rehabListings);
    expect(englishAliasWhere).toEqual(arabicAliasWhere);
  });

  it('3. infers sortBy cheapest from a follow-up and returns ascending rent results', async () => {
    const listings = [
      { id: 1, monthlyRent: 7000 },
      { id: 2, monthlyRent: 3500 },
      { id: 3, monthlyRent: 5000 },
    ];

    (service as any).ai.models.generateContent.mockResolvedValue({
      text: '{"sortBy":"cheapest"}',
    });
    prisma.listing.findMany.mockImplementation(({ orderBy }: any) => {
      if (orderBy?.monthlyRent === 'asc') {
        return Promise.resolve(
          [...listings].sort((a, b) => a.monthlyRent - b.monthlyRent),
        );
      }

      return Promise.resolve(listings);
    });

    const filters = await (service as any).extractFilters('والأرخص؟', [
      { role: 'user', text: 'عايز سكن في الرحاب' },
      { role: 'model', text: 'لقيت كذا اختيار.' },
    ]);
    const results = await (service as any).findApprovedListings(filters);

    expect(filters).toEqual({ sortBy: 'cheapest' });
    expect(results.map((listing: any) => listing.monthlyRent)).toEqual([
      3500, 5000, 7000,
    ]);
  });

  it('5. includes the non-exact retry tier marker in the Gemini context', async () => {
    jest.spyOn(service as any, 'extractFilters').mockResolvedValue({
      area: 'المعادي',
      maxRent: 5000,
    });
    const fallbackListing = {
      id: 7,
      locationInsight: null,
    };
    jest
      .spyOn(service as any, 'findApprovedListings')
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([fallbackListing]);
    jest.spyOn(service as any, 'createEmbedding').mockResolvedValue([1, 0]);
    const answerSpy = jest
      .spyOn(service as any, 'generateArabicAnswer')
      .mockResolvedValue('answer');

    prisma.listingVector.findMany.mockResolvedValue([
      {
        listingId: 7,
        vectorText: [1, 0],
        textChunk: 'Listing ID: 7',
      },
    ]);
    prisma.listingVector.count.mockResolvedValue(100);
    prisma.listingLocationInsight.findUnique.mockResolvedValue(null);

    await expect(service.generateRAGResponse('عايز في المعادي')).resolves.toBe(
      'answer',
    );

    expect(answerSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.any(Object),
      expect.stringContaining('Match confidence: rent_only'),
      'rent_only',
    );
  });
});
