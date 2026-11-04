const SUBACCOUNT = /^ACCT_[A-Za-z0-9]{6,40}$/;

export const isValidSubaccountCode = (value: string) => SUBACCOUNT.test(value);

/**
 * Decides where a school's fee payments are settled. Each school should have its own Paystack
 * subaccount so money never sits in the platform owner's account. Falling back to the platform
 * account must be switched on deliberately (PAYSTACK_ALLOW_PLATFORM_ACCOUNT=true).
 */
export function resolveSubaccount(code: string | null | undefined, allowPlatformAccount: boolean):
  | { ok: true; code: string | null }
  | { ok: false; error: string } {
  if (code && isValidSubaccountCode(code)) return { ok: true, code };
  if (allowPlatformAccount) return { ok: true, code: null };
  return { ok: false, error: "This school has no Paystack subaccount yet. An administrator must add it under Settings before fees can be paid online." };
}
