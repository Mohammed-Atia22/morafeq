const PLATFORM_FEE_PERCENT = 5;

export function buildBreakdownFromListing({ monthlyRent, depositAmount = 0 } = {}) {
  const rentAmount = Number(monthlyRent || 0);
  const deposit = Number(depositAmount || 0);
  const platformFee = Math.round((rentAmount * PLATFORM_FEE_PERCENT) / 100);
  const totalAmount = rentAmount + deposit + platformFee;

  return {
    rentAmount,
    depositAmount: deposit,
    platformFee,
    totalAmount,
    currency: "EGP",
  };
}

export function normalizePaymentBreakdown(source) {
  if (!source) return null;

  if (source.amounts) {
    const { amounts } = source;
    return {
      rentAmount: Number(amounts.rentAmount || 0),
      depositAmount: Number(
        amounts.securityDepositAmount ?? amounts.depositAmount ?? 0,
      ),
      platformFee: Number(amounts.serviceFee ?? amounts.platformFee ?? 0),
      totalAmount: Number(amounts.totalAmount || 0),
      currency: amounts.currency || "EGP",
    };
  }

  if (source.rentAmount != null && source.amount != null && !source.monthlyRent) {
    return {
      rentAmount: Number(source.rentAmount) / 100,
      depositAmount: Number(source.securityDepositAmount || 0) / 100,
      platformFee: Number(source.platformFee || 0) / 100,
      totalAmount: Number(source.amount) / 100,
      currency: source.currency || "EGP",
    };
  }

  if (source.rentAmount != null && source.amount != null) {
    const isCents = Number(source.amount) > 1000 || source.rentAmount > 1000;
    const divisor = isCents ? 100 : 1;

    return {
      rentAmount: Number(source.rentAmount) / divisor,
      depositAmount: Number(source.securityDepositAmount || 0) / divisor,
      platformFee: Number(source.platformFee || 0) / divisor,
      totalAmount: Number(source.amount) / divisor,
      currency: source.currency || "EGP",
    };
  }

  if (source.rentAmount != null || source.monthlyRent != null) {
    return buildBreakdownFromListing({
      monthlyRent: source.rentAmount ?? source.monthlyRent,
      depositAmount: source.depositAmount ?? source.securityDepositAmount,
    });
  }

  return null;
}

export function buildDisputeSettlementPreview(payment) {
  const breakdown = normalizePaymentBreakdown(payment);
  if (!breakdown) return null;

  return {
    ...breakdown,
    totalAmount: breakdown.totalAmount,
    expectedRefund: breakdown.rentAmount,
    hostCompensation: breakdown.depositAmount,
    retainedPlatformFee: breakdown.platformFee,
  };
}

export function formatMoney(amount, currency = "EGP") {
  const label = currency === "EGP" ? "ج.م" : currency;
  return `${Number(amount || 0).toLocaleString("ar-EG")} ${label}`;
}
