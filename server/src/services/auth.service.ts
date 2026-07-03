import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, type Role } from '../models/User.js';
import { Provider } from '../models/Provider.js';
import { HttpError } from '../utils/asyncHandler.js';

function signTokens(sub: string, role: Role) {
  const access = jwt.sign({ sub, role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessTtl as jwt.SignOptions['expiresIn'],
  });
  const refresh = jwt.sign({ sub, role }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshTtl as jwt.SignOptions['expiresIn'],
  });
  return { access, refresh };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
}) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) throw new HttpError(409, 'An account with that email already exists');

  const passwordHash = await bcrypt.hash(input.password, 12);
  const role: Role = input.role === 'provider' ? 'provider' : 'customer';

  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone,
    passwordHash,
    role,
  });

  // Spin up a provider profile so onboarding can continue.
  if (role === 'provider') {
    const provider = await Provider.create({ user: user._id, businessName: input.name });
    user.provider = provider._id;
    await user.save();
  }

  const tokens = signTokens(String(user._id), role);
  return { user: publicUser(user), ...tokens };
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) throw new HttpError(401, 'Invalid email or password');
  if (user.suspended) throw new HttpError(403, 'Account suspended');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Invalid email or password');

  const tokens = signTokens(String(user._id), user.role);
  return { user: publicUser(user), ...tokens };
}

export function refresh(refreshToken: string) {
  try {
    const decoded = jwt.verify(refreshToken, env.jwt.refreshSecret) as { sub: string; role: Role };
    return signTokens(decoded.sub, decoded.role);
  } catch {
    throw new HttpError(401, 'Invalid refresh token');
  }
}

/** Never leak the password hash. */
export function publicUser(u: InstanceType<typeof User>) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone ?? null,
    smsOptIn: u.smsOptIn,
  };
}
