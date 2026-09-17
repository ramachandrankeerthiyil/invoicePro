const { PrismaClient } = require('@prisma/client');

// Reuse a single client across hot reloads in dev (Next.js pattern).
if (!global.__prisma) {
  global.__prisma = new PrismaClient();
}

module.exports = { prisma: global.__prisma };
