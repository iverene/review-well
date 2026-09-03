import { prisma } from '../config/database.js'

const findById = async (id) => {
  return prisma.user.findUnique({ where: { id } })
}

const findByGoogleId = async (googleId) => {
  return prisma.user.findUnique({ where: { googleId } })
}

const findByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } })
}

const create = async (data) => {
  return prisma.user.create({ data })
}

const update = async (id, data) => {
  return prisma.user.update({ where: { id }, data })
}

const getProfile = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      school: true,
      program: true,
      major: true,
      yearLevel: true,
      createdAt: true,
      _count: {
        select: {
          reviewers: true,
          followers: true,
          following: true,
        },
      },
    },
  })
}

export { findById, findByGoogleId, findByEmail, create, update, getProfile }
