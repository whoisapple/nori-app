export function formatDate(value: string): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export function formatReportCount(count: number): string {
  return `${count}개의 매체 보도`;
}

export function getNewsIndex(index: number, total: number): number {
  return total === 0 ? 0 : (index + total) % total;
}

export function scaleTopOffset(scaleValue: number, cardHeight: number): number {
  return Math.round(((1 - scaleValue) * cardHeight) / 2);
}
