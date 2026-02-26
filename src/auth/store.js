export function createUserStore() {
  const usersByEmail = new Map();
  const usersById = new Map();
  let idSequence = 1;

  function createUser({ email, passwordHash, fullName }) {
    const normalizedEmail = email.toLowerCase();
    if (usersByEmail.has(normalizedEmail)) {
      throw new Error('USER_EXISTS');
    }

    const user = {
      id: String(idSequence++),
      email: normalizedEmail,
      passwordHash,
      fullName,
      bio: '',
      avatarUrl: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    usersByEmail.set(normalizedEmail, user);
    usersById.set(user.id, user);
    return user;
  }

  function getByEmail(email) {
    return usersByEmail.get(email.toLowerCase()) ?? null;
  }

  function getById(id) {
    return usersById.get(id) ?? null;
  }

  function updateProfile(id, profileUpdates) {
    const user = getById(id);
    if (!user) {
      return null;
    }

    const allowedFields = ['fullName', 'bio', 'avatarUrl'];
    for (const field of allowedFields) {
      if (profileUpdates[field] !== undefined) {
        user[field] = profileUpdates[field];
      }
    }

    user.updatedAt = new Date().toISOString();
    return user;
  }

  return {
    createUser,
    getByEmail,
    getById,
    updateProfile
  };
}

export function sanitizeUser(user) {
  if (!user) return null;

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
