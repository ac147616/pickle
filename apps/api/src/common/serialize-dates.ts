// Entity schemas in @pickle/types use z.iso.datetime() (a string) for every
// timestamp field, matching what actually goes over the wire as JSON - but
// Prisma rows carry real Date instances. Controllers that validate a Prisma
// row through an entity schema need this first, or .parse() rejects valid
// data with an "expected string, received Date" error.
export function serializeDates<T extends Record<string, unknown>>(row: T): T {
  const result = { ...row };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (value instanceof Date) {
      (result as Record<string, unknown>)[key] = value.toISOString();
    }
  }
  return result;
}
