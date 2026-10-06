import bcrypt from 'bcryptjs';
import {
  findUserByEmail,
  createUser,
  listUsers as listUsersRepo,
  updateUser as updateUserRepo,
} from './user.repository.js';
import { Errors } from '../../utils/errors.js';

const SALT_ROUNDS = 12;

// A real bcrypt hash (same cost as real users) computed once at startup.
// Comparing against it when the email doesn't exist keeps response time
// identical to a wrong-password attempt, so attackers can't use timing to
// discover which emails are registered. (A malformed dummy hash makes
// bcrypt return instantly, which leaks exactly that.)
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', SALT_ROUNDS);

export async function authenticate(email, password) {
  const user = await findUserByEmail(email);
  // Constant-shape response either way to avoid user-enumeration timing
  // differences: always run a bcrypt comparison even on a missing user.
  const hash = user?.passwordHash ?? DUMMY_HASH;
  const passwordMatches = await bcrypt.compare(password, hash);

  if (!user || !passwordMatches) {
    throw Errors.unauthorized('Invalid email or password.');
  }
  if (!user.isActive) {
    throw Errors.unauthorized('Your account has been deactivated. Contact an administrator.');
  }

  // eslint-disable-next-line no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function registerUser({ name, email, password, role }) {
  const existing = await findUserByEmail(email);
  if (existing) throw Errors.conflict('An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return createUser({ name, email, passwordHash, role });
}

export async function listUsers(pagination) {
  return listUsersRepo(pagination);
}

export async function updateUser(id, updates) {
  const updated = await updateUserRepo(id, updates);
  if (!updated) throw Errors.notFound('Worker not found.');
  return updated;
}
