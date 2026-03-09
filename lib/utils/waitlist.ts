const WAITLIST_EMAIL_RE =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export function normalizeWaitlistEmail(email: string) {
  return email.trim().toLowerCase()
}

export function isValidWaitlistEmail(email: string) {
  return WAITLIST_EMAIL_RE.test(normalizeWaitlistEmail(email))
}
