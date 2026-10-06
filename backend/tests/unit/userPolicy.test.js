import { describe, it, expect } from '@jest/globals';
import { assertCanModifyUser } from '../../src/modules/users/user.policy.js';

const admin = { id: 'a1', role: 'ADMIN' };
const manager = { id: 'm1', role: 'MANAGER' };
const worker = { id: 'w1', role: 'WORKER' };

describe('assertCanModifyUser', () => {
  it('lets an admin change another account', () => {
    expect(() => assertCanModifyUser(admin, 'w1', { role: 'MANAGER' })).not.toThrow();
  });

  it('blocks managers from promoting anyone (including themselves) to admin', () => {
    expect(() => assertCanModifyUser(manager, 'm1', { role: 'ADMIN' })).toThrow(/administrators/);
    expect(() => assertCanModifyUser(manager, 'w1', { role: 'ADMIN' })).toThrow(/administrators/);
  });

  it('blocks workers entirely', () => {
    expect(() => assertCanModifyUser(worker, 'w1', { name: 'x' })).toThrow();
  });

  it('stops an admin changing their own role or active flag', () => {
    expect(() => assertCanModifyUser(admin, 'a1', { role: 'WORKER' })).toThrow(/your own/);
    expect(() => assertCanModifyUser(admin, 'a1', { isActive: false })).toThrow(/your own/);
  });

  it('still lets an admin rename themselves', () => {
    expect(() => assertCanModifyUser(admin, 'a1', { name: 'New Name' })).not.toThrow();
  });
});
