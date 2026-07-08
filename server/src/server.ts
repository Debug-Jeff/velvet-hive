import { createApp } from './app'
import { env } from './config/env'
import { startScheduledJobs } from './lib/scheduler'
import { prisma } from './lib/prisma'

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`)
})

const schedulerHandle = startScheduledJobs()

let isShuttingDown = false

function shutdown(signal: string) {
  if (isShuttingDown) return
  isShuttingDown = true
  console.log(`\n${signal} received, shutting down…`)

  clearInterval(schedulerHandle)

  // Force-exit if close() hangs on a lingering connection, so the port is
  // never left stuck in a weird state requiring a manual kill.
  const forceExit = setTimeout(() => {
    console.error('Graceful shutdown timed out, forcing exit')
    process.exit(1)
  }, 10_000)
  forceExit.unref()

  server.close(async () => {
    await prisma.$disconnect()
    clearTimeout(forceExit)
    console.log('Server closed, port freed.')
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
