export const toNullableBigInt = (value: any): number | null => {
  return value === "" || value === undefined || value === null ? null : Number(value);
};

export const toNullableString = (value: any): string | null => {
  return value === "" || value === undefined || value === null ? null : String(value);
};

export const toNullableDate = (value: any): Date | null => {
  return value === "" || value === undefined || value === null ? null : new Date(value);
};

export const toNullableFloat = (value: any): number | null => {
  if (value === "" || value === undefined || value === null) return null;

  // If it's a string like "20%" or "3%", remove `%` then parse
  if (typeof value === "string") {
    value = value.replace('%', '').trim();
  }

  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};
