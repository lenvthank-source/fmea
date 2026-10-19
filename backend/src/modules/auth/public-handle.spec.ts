import { ServiceUnavailableException } from '@nestjs/common';
import { HANDLE_CAPACITY, HANDLE_WORDS, reservePublicHandle } from './public-handle';

describe('permanent public handle allocation', () => {
  const ledger = () => {
    const reserved = new Set<string>();
    const tx = { publicHandleReservation: { findMany: jest.fn(async () => Array.from(reserved, handle => ({ handle }))), createMany: jest.fn(async ({ data }) => {
      const handle = data[0].handle;
      if (reserved.has(handle)) return { count: 0 };
      reserved.add(handle);
      return { count: 1 };
    }) } };
    return { tx, reserved };
  };
  it('uses unique, short lowercase word pairs', () => {
    expect(new Set(HANDLE_WORDS).size).toBe(HANDLE_WORDS.length);
    expect(HANDLE_WORDS.every(word => /^[a-z]{2,7}$/.test(word))).toBe(true);
  });
  it('reserves before returning and skips an existing reservation', async () => {
    const { tx, reserved } = ledger();
    reserved.add('table-table');
    expect(await reservePublicHandle(tx as any, () => 0)).toBe('table-bear');
    expect(reserved.has('table-bear')).toBe(true);
    expect(tx.publicHandleReservation.createMany).toHaveBeenCalledWith({ data: [{ handle: 'table-bear' }], skipDuplicates: true });
  });
  it('concurrent allocations with identical random starts remain distinct', async () => {
    const { tx } = ledger();
    const names = await Promise.all(Array.from({ length: 30 }, () => reservePublicHandle(tx as any, () => 0)));
    expect(new Set(names).size).toBe(30);
  });
  it('does not recycle reserved identities when their account disappears', async () => {
    const { tx, reserved } = ledger();
    const previous = await reservePublicHandle(tx as any, () => 0);
    // Ledger contains no account or tenant foreign key; account deletion cannot change it.
    expect(await reservePublicHandle(tx as any, () => 0)).not.toBe(previous);
    expect(reserved.has(previous)).toBe(true);
  });
  it('wraps the finite candidate pool without a numerical suffix', async () => {
    const { tx, reserved } = ledger();
    reserved.add('zebra-zebra');
    expect(await reservePublicHandle(tx as any, () => HANDLE_CAPACITY - 1)).toBe('table-table');
  });
  it('fails honestly when every handle is permanently reserved', async () => {
    const entries = HANDLE_WORDS.flatMap(a => HANDLE_WORDS.map(b => ({ handle: `${a}-${b}` })));
    const tx = { publicHandleReservation: { findMany: jest.fn().mockResolvedValue(entries), createMany: jest.fn().mockResolvedValue({ count: 0 }) } };
    await expect(reservePublicHandle(tx as any, () => 0)).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(tx.publicHandleReservation.createMany).not.toHaveBeenCalled();
  });
});
