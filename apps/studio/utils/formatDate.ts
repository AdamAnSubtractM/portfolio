export const formatDate = function (dateString: string) {
  // Split the date string and construct a UTC date
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day)); // Explicit UTC
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
};
