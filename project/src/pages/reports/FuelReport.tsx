import React from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DataTable } from '../../components/common/DataTable';
import { Icon } from '../../components/ui/Icon';
import { fuelAPI, FuelEntryDTO, bookingAPI } from '../../services/api';
import { DriverFinancePayment } from '../../types';
import { useApp } from '../../context/AppContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface FuelRow {
  id: string;
  sNo: number;
  fuelFillDate: string;
  vehicle: string;
  booking: string;
  driver: string;
  totalKm: number;
  mileage: number;
  qty: number;
  rate: number;
  total: number;
  source: 'fuel-entry' | 'driver-payment';
  createdAt: string;
}

export const FuelReport: React.FC = () => {
  const { vehicles, bookings, drivers } = useApp();
  const [from, setFrom] = React.useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [to, setTo] = React.useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [vehicleId, setVehicleId] = React.useState('');
  const [bookingId, setBookingId] = React.useState('');
  const [month, setMonth] = React.useState('');
  const [year, setYear] = React.useState('');
  const [rows, setRows] = React.useState<FuelRow[]>([]);
  const [all, setAll] = React.useState<FuelEntryDTO[]>([]);
  const [driverPayments, setDriverPayments] = React.useState<DriverFinancePayment[]>([]);
  const [loading, setLoading] = React.useState(false);

  const vehicleOptions = vehicles.map(v => ({ value: v.id, label: v.registrationNumber }));
  const bookingOptions = bookings.map(b => ({ value: b.id, label: `${b.pickupLocation} -> ${b.dropLocation}` }));

  const applyMonthYear = () => {
    if (!year) return;
    const m = month ? parseInt(month, 10) : 1;
    const start = new Date(parseInt(year, 10), (m - 1), 1);
    const end = month ? endOfMonth(start) : new Date(parseInt(year,10), 11, 31);
    setFrom(format(start, 'yyyy-MM-dd'));
    setTo(format(end, 'yyyy-MM-dd'));
  };

  const loadAllFuelBasisDriverPayments = React.useCallback(async (): Promise<DriverFinancePayment[]> => {
    const allPayments: DriverFinancePayment[] = [];
    
    // For each booking, get driver payments and filter for fuel-basis
    for (const booking of bookings) {
      if (!booking.id) continue;
      try {
        const payments = await bookingAPI.listDriverPayments(booking.id);
        const fuelBasisPayments = payments.filter(p => p.mode === 'fuel-basis' && p.bookingId);
        // Convert to DriverFinancePayment format
        for (const p of fuelBasisPayments) {
          allPayments.push({
            id: p.id,
            amount: p.amount,
            type: p.type || 'paid',
            date: p.date,
            description: p.description,
            bookingId: p.bookingId,
            booking: {
              id: booking.id,
              pickupLocation: booking.pickupLocation,
              dropLocation: booking.dropLocation,
              startDate: booking.startDate,
              endDate: booking.endDate,
            },
            mode: 'fuel-basis',
            fuelQuantity: p.fuelQuantity,
            fuelRate: p.fuelRate,
            computedAmount: p.computedAmount,
            distanceKm: p.distanceKm,
            mileage: p.mileage,
            settled: p.settled,
            settledAt: p.settledAt,
          });
        }
      } catch (err) {
        console.error(`Failed to load payments for booking ${booking.id}:`, err);
      }
    }
    return allPayments;
  }, [bookings]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [fuelList, allDriverPayments] = await Promise.all([
        fuelAPI.list(),
        loadAllFuelBasisDriverPayments()
      ]);
      setAll(fuelList);
      setDriverPayments(allDriverPayments);
    } finally {
      setLoading(false);
    }
  }, [loadAllFuelBasisDriverPayments]);

  const generateRows = React.useCallback(() => {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    
    // Process fuel entries
    const fuelRows: FuelRow[] = all
      .filter(f => {
        const dt = new Date(f.fuelFillDate);
        if (dt < start || dt > end) return false;
        if (vehicleId && f.vehicleId !== vehicleId) return false;
        if (bookingId && f.bookingId !== bookingId) return false;
        return true;
      })
      .map((f) => {
        const veh = vehicles.find(v => v.id === f.vehicleId);
        const bk = bookings.find(b => b.id === f.bookingId);
        const driver = bk?.driverId ? drivers.find(d => d.id === bk.driverId) : null;
        return {
          id: `fuel-${f.id}`,
          sNo: 0, // Will be set later
          fuelFillDate: f.fuelFillDate,
          vehicle: veh?.registrationNumber || f.vehicleLabel || '-',
          booking: bk ? `${bk.pickupLocation} -> ${bk.dropLocation}` : (f.bookingLabel || '-'),
          driver: driver?.name || '-',
          totalKm: 0, // Fuel entries don't have distance
          mileage: 0, // Fuel entries don't have mileage
          qty: f.fuelQuantity,
          rate: f.fuelRate,
          total: f.totalAmount,
          source: 'fuel-entry' as const,
          createdAt: f.createdAt,
        };
      });

    // Process driver payments (fuel-basis)
    const paymentRows: FuelRow[] = driverPayments
      .filter(p => {
        const dt = new Date(p.date);
        if (dt < start || dt > end) return false;
        if (!p.bookingId) return false;
        const bk = bookings.find(b => b.id === p.bookingId);
        if (vehicleId && bk?.vehicleId !== vehicleId) return false;
        if (bookingId && p.bookingId !== bookingId) return false;
        return true;
      })
      .map((p) => {
        const bk = bookings.find(b => b.id === p.bookingId);
        const veh = bk?.vehicleId ? vehicles.find(v => v.id === bk.vehicleId) : null;
        const driver = bk?.driverId ? drivers.find(d => d.id === bk.driverId) : null;
        return {
          id: `payment-${p.id}`,
          sNo: 0, // Will be set later
          fuelFillDate: p.date,
          vehicle: veh?.registrationNumber || '-',
          booking: p.booking ? `${p.booking.pickupLocation} -> ${p.booking.dropLocation}` : '-',
          driver: driver?.name || '-',
          totalKm: p.distanceKm || 0,
          mileage: p.mileage || 0,
          qty: p.fuelQuantity || 0,
          rate: p.fuelRate || 0,
          total: p.computedAmount || p.amount || 0,
          source: 'driver-payment' as const,
          createdAt: p.date,
        };
      });

    // Combine and sort by date
    const combined = [...fuelRows, ...paymentRows].sort((a, b) => 
      new Date(b.fuelFillDate).getTime() - new Date(a.fuelFillDate).getTime()
    );

    // Set serial numbers
    const result = combined.map((r, idx) => ({ ...r, sNo: idx + 1 }));
    setRows(result);
  }, [all, driverPayments, vehicles, bookings, drivers, from, to, vehicleId, bookingId]);

  React.useEffect(() => { 
    if (bookings.length > 0) {
      load(); 
    }
  }, [load]);
  React.useEffect(() => { generateRows(); }, [generateRows]);

  // Exports
  const exportCSV = () => {
    if (rows.length === 0) return;
    const header = ['S.No','Fuel Date','Vehicle','Booking','Driver','Total (Km)','Mileage (km/L)','QTY (L)','Fuel Rate','Total Amt'];
    const lines = rows.map(r => [
      r.sNo, 
      r.fuelFillDate, 
      r.vehicle, 
      r.booking, 
      r.driver,
      r.totalKm || '',
      r.mileage || '',
      r.qty, 
      r.rate, 
      r.total
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `fuel-report-${from}-to-${to}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const exportExcel = () => {
    if (rows.length === 0) return;
    const table = `
      <table>
        <thead><tr>
          <th>S.No</th><th>Fuel Date</th><th>Vehicle</th><th>Booking</th><th>Driver</th><th>Total (Km)</th><th>Mileage (km/L)</th><th>QTY (L)</th><th>Fuel Rate</th><th>Total Amt</th>
        </tr></thead>
        <tbody>
          ${rows.map(r => `<tr><td>${r.sNo}</td><td>${r.fuelFillDate}</td><td>${r.vehicle}</td><td>${r.booking}</td><td>${r.driver}</td><td>${r.totalKm || ''}</td><td>${r.mileage || ''}</td><td>${r.qty}</td><td>${r.rate}</td><td>${r.total}</td></tr>`).join('')}
        </tbody>
      </table>`;
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `fuel-report-${from}-to-${to}.xls`; a.click(); URL.revokeObjectURL(url);
  };
  const exportCopy = async () => {
    if (rows.length === 0) return;
    const header = ['S.No','Fuel Date','Vehicle','Booking','Driver','Total (Km)','Mileage (km/L)','QTY (L)','Fuel Rate','Total Amt'];
    const lines = rows.map(r => [
      r.sNo, 
      r.fuelFillDate, 
      r.vehicle, 
      r.booking, 
      r.driver,
      r.totalKm || '',
      r.mileage || '',
      r.qty, 
      r.rate, 
      r.total
    ].join('\t'));
    await navigator.clipboard.writeText([header.join('\t'), ...lines].join('\n'));
  };
  const exportPDF = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write('<html><head><title>Fuel Report</title><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;font-size:12px}th{background:#f5f5f5}</style></head><body>');
    w.document.write(`<h3>Fuel Report (${from} to ${to})</h3>`);
    w.document.write('<table><thead><tr><th>S.No</th><th>Fuel Date</th><th>Vehicle</th><th>Booking</th><th>Driver</th><th>Total (Km)</th><th>Mileage (km/L)</th><th>QTY (L)</th><th>Fuel Rate</th><th>Total Amt</th></tr></thead><tbody>');
    rows.forEach(r => { w.document.write(`<tr><td>${r.sNo}</td><td>${r.fuelFillDate}</td><td>${r.vehicle}</td><td>${r.booking}</td><td>${r.driver}</td><td>${r.totalKm || ''}</td><td>${r.mileage || ''}</td><td>${r.qty}</td><td>${r.rate}</td><td>${r.total}</td></tr>`); });
    w.document.write('</tbody></table></body></html>');
    w.document.close(); w.focus(); w.print();
  };

  const totals = React.useMemo(() => rows.reduce((acc, r) => {
    acc.qty += r.qty; acc.total += r.total; return acc;
  }, { qty: 0, total: 0 }), [rows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Fuel Report</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCopy}><Icon name="download" className="h-4 w-4 mr-1"/> Copy</Button>
          <Button variant="outline" onClick={exportCSV}><Icon name="download" className="h-4 w-4 mr-1"/> CSV</Button>
          <Button variant="outline" onClick={exportExcel}><Icon name="download" className="h-4 w-4 mr-1"/> Excel</Button>
          <Button variant="outline" onClick={exportPDF}><Icon name="download" className="h-4 w-4 mr-1"/> PDF</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Input type="date" label="Report From" value={from} onChange={e=>setFrom(e.target.value)} />
            <Input type="date" label="Report To" value={to} onChange={e=>setTo(e.target.value)} />
            <Select label="Vehicles" value={vehicleId} onChange={e=>setVehicleId(e.target.value)} options={[{ value: '', label: 'All Vehicles' }, ...vehicleOptions]} />
            <Select label="Bookings" value={bookingId} onChange={e=>setBookingId(e.target.value)} options={[{ value: '', label: 'All Bookings' }, ...bookingOptions]} />
            <Select label="Month" value={month} onChange={e=>setMonth(e.target.value)} options={[{value:'',label:'All'}, ...Array.from({length:12}, (_,i)=>({ value: String(i+1), label: format(new Date(2000, i, 1), 'MMMM') }))]} />
            <Select label="Year" value={year} onChange={e=>setYear(e.target.value)} options={[{value:'',label:'-- Year --'}, ...Array.from({length:6},(_,i)=>{ const y = new Date().getFullYear()-i; return { value: String(y), label: String(y)};})]} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => { if (year) applyMonthYear(); generateRows(); }} disabled={loading}>
              <Icon name="filter" className="h-4 w-4 mr-1"/> {loading ? 'Loading...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between">
          <div className="text-sm text-gray-700">Total Qty: <span className="font-semibold">{totals.qty.toLocaleString()} L</span></div>
          <div className="text-sm text-gray-700">Total Amount: <span className="font-semibold">₹{totals.total.toLocaleString()}</span></div>
        </CardContent>
      </Card>

      <DataTable<FuelRow>
        data={rows}
        columns={[
          { key: 'sNo', header: 'S.No' },
          { key: 'fuelFillDate', header: 'Fuel Date', render: (r) => new Date(r.fuelFillDate).toLocaleDateString() },
          { key: 'vehicle', header: 'Vehicle' },
          { key: 'booking', header: 'Booking' },
          { key: 'driver', header: 'Driver' },
          { key: 'totalKm', header: 'Total (Km)', render: (r) => r.totalKm > 0 ? r.totalKm.toLocaleString() : '-' },
          { key: 'mileage', header: 'Mileage (km/L)', render: (r) => r.mileage > 0 ? r.mileage.toLocaleString() : '-' },
          { key: 'qty', header: 'QTY (L)', render: (r) => r.qty.toLocaleString() },
          { key: 'rate', header: 'Fuel Rate', render: r => `₹${r.rate.toLocaleString()}` },
          { key: 'total', header: 'Total Amt', render: r => `₹${r.total.toLocaleString()}` },
        ]}
        defaultSortKey={'fuelFillDate'}
        defaultSortDirection="desc"
        searchPlaceholder="Search fuel entries..."
      />
    </div>
  );
};

export default FuelReport;
