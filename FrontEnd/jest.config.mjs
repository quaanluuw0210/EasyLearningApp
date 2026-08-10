import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Chỉ đường dẫn để Next.js load file .env
  dir: './',
})

// Cấu hình môi trường giả lập trình duyệt để test UI
const config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: [],
}

export default createJestConfig(config)