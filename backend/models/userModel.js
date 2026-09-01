const { prisma } = require('../config/database')

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

module.exports = { findByGoogleId, findByEmail, create, update }