export function periodoToFechas(mesesAtras: number): { desde: string; hasta: string } {
  const hasta = new Date();
  const desde = new Date();
  desde.setMonth(desde.getMonth() - mesesAtras);
  desde.setDate(1);
  desde.setHours(0, 0, 0, 0);
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}
