const INDIA_TIME_ZONE = "Asia/Kolkata";

export function getIndiaDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function getIndiaDateTime(): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    dateStyle: "full",
    timeStyle: "long",
  }).format(new Date());
}
