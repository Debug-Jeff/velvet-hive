import { autoCancelStaleOrders } from '../modules/orders/orders.service'

const CHECK_INTERVAL_MS = 30 * 60 * 1000 // every 30 minutes

export function startScheduledJobs() {
  async function run() {
    try {
      const count = await autoCancelStaleOrders()
      if (count > 0) console.log(`Auto-cancelled ${count} stale order(s) pending payment for over 48 hours`)
    } catch (err) {
      console.error('Scheduled auto-cancel job failed', err)
    }
  }

  run()
  return setInterval(run, CHECK_INTERVAL_MS)
}
