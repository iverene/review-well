const { PrismaClient } = require('@prisma/client')

let prisma = null

const getPrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }
  return prisma
}

const connectDB = async () => {
  try {
    const client = getPrisma()
    await client.$connect()
    console.log('Database connected')
    return client
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

const disconnectDB = async () => {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
}

module.exports = { getPrisma, connectDB, disconnectDB }
