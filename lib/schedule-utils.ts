import { getScheduleFromDB, getScheduledImagesFromDB } from "./db"

interface ScheduleSettings {
  enabled: boolean
  frequency: "daily" | "weekly" | "custom"
  time: string
  daysOfWeek: number[]
  customDays: number
}

export async function calculateNextAvailableSlots(count: number): Promise<Date[]> {
  // Get the current schedule settings
  const settings = await getScheduleFromDB()

  // Get already scheduled posts
  const scheduledPosts = await getScheduledImagesFromDB()

  // Get the scheduled times of existing posts
  const existingScheduledTimes = scheduledPosts
    .map((post) => new Date(post.scheduledTime).getTime())
    .sort((a, b) => a - b)

  // Calculate the next available slots
  const slots: Date[] = []
  let nextSlot = calculateFirstAvailableSlot(settings, existingScheduledTimes)

  for (let i = 0; i < count; i++) {
    slots.push(new Date(nextSlot))
    nextSlot = calculateNextSlot(nextSlot, settings)

    // Make sure we don't schedule at an already taken slot
    while (existingScheduledTimes.includes(nextSlot.getTime())) {
      nextSlot = calculateNextSlot(nextSlot, settings)
    }
  }

  return slots
}

function calculateFirstAvailableSlot(settings: ScheduleSettings, existingTimes: number[]): Date {
  // Start with current date/time
  const now = new Date()

  // Parse the time setting (format: "HH:MM")
  const [hours, minutes] = settings.time.split(":").map(Number)

  // Set the time for today
  const today = new Date(now)
  today.setHours(hours, minutes, 0, 0)

  // If today's slot has passed, start from tomorrow
  const startDate = now > today ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : today

  // Find the next available slot based on frequency
  let nextSlot = findNextSlotByFrequency(startDate, settings)

  // Make sure we don't schedule at an already taken slot
  while (existingTimes.includes(nextSlot.getTime())) {
    nextSlot = calculateNextSlot(nextSlot, settings)
  }

  return nextSlot
}

function calculateNextSlot(currentSlot: Date, settings: ScheduleSettings): Date {
  const nextDate = new Date(currentSlot)

  switch (settings.frequency) {
    case "daily":
      // Add one day
      nextDate.setDate(nextDate.getDate() + 1)
      break

    case "weekly":
      // Find the next day of the week from the settings
      let found = false
      let daysToAdd = 1

      while (!found && daysToAdd < 8) {
        const nextDay = new Date(currentSlot)
        nextDay.setDate(nextDay.getDate() + daysToAdd)

        if (settings.daysOfWeek.includes(nextDay.getDay())) {
          found = true
          nextDate.setDate(nextDate.getDate() + daysToAdd)
        } else {
          daysToAdd++
        }
      }

      // If no valid day found in the next week, default to 7 days later
      if (!found) {
        nextDate.setDate(nextDate.getDate() + 7)
      }
      break

    case "custom":
      // Add the custom number of days
      nextDate.setDate(nextDate.getDate() + settings.customDays)
      break
  }

  return nextDate
}

function findNextSlotByFrequency(startDate: Date, settings: ScheduleSettings): Date {
  const date = new Date(startDate)

  // Set the time from settings
  const [hours, minutes] = settings.time.split(":").map(Number)
  date.setHours(hours, minutes, 0, 0)

  if (settings.frequency === "weekly") {
    // If the current day is not in the selected days, find the next available day
    if (!settings.daysOfWeek.includes(date.getDay())) {
      let daysToAdd = 1
      let found = false

      while (!found && daysToAdd < 8) {
        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + daysToAdd)

        if (settings.daysOfWeek.includes(nextDay.getDay())) {
          found = true
          date.setDate(date.getDate() + daysToAdd)
        } else {
          daysToAdd++
        }
      }
    }
  }

  return date
}

