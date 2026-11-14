const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

export default function formatCalendarMonth(date: Date) {
  const month = MONTH_NAMES[date.getMonth()];
  return month.length >= 6 ? month.slice(0, 3) : month;
}
