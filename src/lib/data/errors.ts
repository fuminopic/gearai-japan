type SupabaseDataError = {
  message: string;
} | null | undefined;

export function assertNoSupabaseError(error: SupabaseDataError) {
  if (error) {
    throw new Error(error.message);
  }
}
