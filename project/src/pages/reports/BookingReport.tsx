import React from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DataTable } from '../../components/common/DataTable';
import { Icon } from '../../components/ui/Icon';
import { useApp } from '../../context/AppContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';

import type {
  DriverFinancePayment,
} from "../../types";
import { financeAPI } from "../../services/api";

interface ReportRow {
  id: string;
  sNo: number;
  bookingDate: string;
  customerName: string;
  route: string;
  bookingAmount: number;
  advanceReceived: number; // Advance to Driver
  expenses: number;
  balance: number;
  driverName: string;
  vehicle: string;
  status: "booked" | "ongoing" | "completed" | "yet-to-start" | "canceled";
  createdAt: string;
  paymentsAmount?: number;
}

export const BookingReport: React.FC = () => {
  const { bookings, drivers, vehicles } = useApp();
  const [from, setFrom] = React.useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [to, setTo] = React.useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [driverId, setDriverId] = React.useState('');
  const [vehicleId, setVehicleId] = React.useState('');
  const [status, setStatus] = React.useState<''|'booked'|'ongoing'|'completed'|'yet-to-start'|'canceled'>('');
  const [month, setMonth] = React.useState('');
  const [year, setYear] = React.useState('');
  const [rows, setRows] = React.useState<ReportRow[]>([]);

  const driversOptions = drivers.map(d => ({ value: d.id, label: d.name }));
  const vehicleOptions = vehicles.map(v => ({ value: v.id, label: v.registrationNumber }));

  const applyMonthYear = () => {
    if (!year) return;
    const m = month ? parseInt(month, 10) : 1;
    const start = new Date(parseInt(year, 10), (m - 1), 1);
    const end = month ? endOfMonth(start) : new Date(parseInt(year,10), 11, 31);
    setFrom(format(start, 'yyyy-MM-dd'));
    setTo(format(end, 'yyyy-MM-dd'));
  };

  const generateRows = async () => {
    const start = new Date(from);
    const end = new Date(to);
    const filtered = bookings.filter((b) => {
      const dt = new Date(b.startDate);
      if (dt < start || dt > end) return false;
      if (driverId && b.driverId !== driverId) return false;
      if (vehicleId && b.vehicleId !== vehicleId) return false;
      if (status && b.status !== status) return false;
      return true;
    });

    // Fetch driver payments for all drivers involved in filtered bookings
    const uniqueDriverIds = Array.from(
      new Set(filtered.map((b) => b.driverId).filter(Boolean) as string[])
    );
    const driverIdToPayments = new Map<string, DriverFinancePayment[]>();
    await Promise.all(
      uniqueDriverIds.map(async (id) => {
        try {
          const list = await financeAPI.getDriverPayments(id);
          driverIdToPayments.set(id, Array.isArray(list) ? list : []);
        } catch {
          driverIdToPayments.set(id, []);
        }
      })
    );

    const result: ReportRow[] = filtered.map((b, idx) => {
      const veh = vehicles.find((v) => v.id === b.vehicleId);
      const drv = drivers.find((d) => d.id === b.driverId);

      const baseDriverExpenses = (b.expenses || []).reduce(
        (sum, e) => sum + e.amount,
        0
      );

      const financePayments = b.driverId
        ? driverIdToPayments.get(b.driverId) || []
        : [];
      const paymentsForBooking = financePayments.filter(
        (p) => p.bookingId === b.id
      );
      const totalOilAmount = paymentsForBooking
        .filter((p) => !p.description?.toLowerCase().includes("final payment"))
        .reduce((s, p) => s + (p.amount || 0), 0);

      const driverExpenses = baseDriverExpenses + totalOilAmount;

      const hasPaymentAmount = (b.payments || []).reduce(
        (s, p) => s + (p.amount || 0),
        0
      );
      const advanceToDriver = (b.advanceReceived || 0) + hasPaymentAmount;

      const amountPayable = (() => {
        if (totalOilAmount === 0) {
          if (hasPaymentAmount === baseDriverExpenses) return 0;
          if (hasPaymentAmount < baseDriverExpenses && hasPaymentAmount > 0)
            return baseDriverExpenses - hasPaymentAmount;
          return baseDriverExpenses;
        } else {
          if (hasPaymentAmount === 0) return baseDriverExpenses + totalOilAmount;
          if (hasPaymentAmount < baseDriverExpenses)
            return totalOilAmount + (baseDriverExpenses - hasPaymentAmount);
          return totalOilAmount;
        }
      })();

      // Compute how much driver actually received at the end
      const driverReceivedBase = (b.advanceReceived || 0) + hasPaymentAmount;
      const displayDriverReceived = b.finalPaid
        ? (b.finalPaid || 0) + driverReceivedBase
        : driverReceivedBase;

      const amountPay = paymentsForBooking.reduce(
        (s, p) => s + (p.amount || 0),
        0
      );

      return {
        id: b.id,
        sNo: idx + 1,
        bookingDate: b.startDate,
        customerName: b.customerName,
        route: `${b.pickupLocation} / ${b.dropLocation}`,
        bookingAmount: b.totalAmount,
        advanceReceived: advanceToDriver,
        expenses: driverExpenses,
        balance: displayDriverReceived,
        driverName: drv?.name || "-",
        vehicle: veh?.registrationNumber || "-",
        status: b.status,
        createdAt: b.createdAt,
        paymentsAmount: amountPay,
      };
    });
    setRows(result);
  };

  React.useEffect(() => {
    generateRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, drivers, vehicles]);

  // Exports
  const exportCSV = () => {
    if (rows.length === 0) return;
    const header = ['S.No','Booking Date','Customer Name','From / To','Booking Amount','Advance Received','Expenses','Balance','Driver Name','Vehicle','Status','Created Date'];
    const lines = rows.map(r => [r.sNo, r.bookingDate, r.customerName, r.route, r.bookingAmount, r.advanceReceived, r.expenses, r.balance, r.driverName, r.vehicle, r.status, r.createdAt].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `booking-report-${from}-to-${to}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const exportExcel = () => {
    if (rows.length === 0) return;
    const table = `
      <table>
        <thead><tr>
          <th>S.No</th><th>Booking Date</th><th>Customer Name</th><th>From / To</th><th>Booking Amount</th><th>Advance Received</th><th>Expenses</th><th>Balance</th><th>Driver Name</th><th>Vehicle</th><th>Status</th><th>Created Date</th>
        </tr></thead>
        <tbody>
          ${rows.map(r => `<tr><td>${r.sNo}</td><td>${r.bookingDate}</td><td>${r.customerName}</td><td>${r.route}</td><td>${r.bookingAmount}</td><td>${r.advanceReceived}</td><td>${r.expenses}</td><td>${r.balance}</td><td>${r.driverName}</td><td>${r.vehicle}</td><td>${r.status}</td><td>${r.createdAt}</td></tr>`).join('')}
        </tbody>
      </table>`;
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `booking-report-${from}-to-${to}.xls`; a.click(); URL.revokeObjectURL(url);
  };
  const exportCopy = async () => {
    if (rows.length === 0) return;
    const header = ['S.No','Booking Date','Customer Name','From / To','Booking Amount','Advance Received','Expenses','Balance','Driver Name','Vehicle','Status','Created Date'];
    const lines = rows.map(r => [r.sNo, r.bookingDate, r.customerName, r.route, r.bookingAmount, r.advanceReceived, r.expenses, r.balance, r.driverName, r.vehicle, r.status, r.createdAt].join('\t'));
    await navigator.clipboard.writeText([header.join('\t'), ...lines].join('\n'));
  };
  const exportPDF = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write('<html><head><title>Booking Report</title><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;font-size:12px}th{background:#f5f5f5}</style></head><body>');
    w.document.write(`<h3>Booking Report (${from} to ${to})</h3>`);
    w.document.write('<table><thead><tr><th>S.No</th><th>Booking Date</th><th>Customer Name</th><th>From / To</th><th>Booking Amount</th><th>Advance Received</th><th>Expenses</th><th>Balance</th><th>Driver Name</th><th>Vehicle</th><th>Status</th><th>Created Date</th></tr></thead><tbody>');
    rows.forEach(r => { w.document.write(`<tr><td>${r.sNo}</td><td>${r.bookingDate}</td><td>${r.customerName}</td><td>${r.route}</td><td>${r.bookingAmount}</td><td>${r.advanceReceived}</td><td>${r.expenses}</td><td>${r.balance}</td><td>${r.driverName}</td><td>${r.vehicle}</td><td>${r.status}</td><td>${r.createdAt}</td></tr>`); });
    w.document.write('</tbody></table></body></html>');
    w.document.close(); w.focus(); w.print();
  };

  const totals = React.useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.amount += r.bookingAmount;
        acc.advance += r.advanceReceived;
        acc.expenses += r.expenses;
        acc.balance += r.balance;
        acc.payments += r.paymentsAmount || 0;
        return acc;
      },
      { amount: 0, advance: 0, expenses: 0, balance: 0, payments: 0 }
    );
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Booking Report</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCopy}>
            <Icon name="download" className="h-4 w-4 mr-1" /> Copy
          </Button>
          <Button variant="outline" onClick={exportCSV}>
            <Icon name="download" className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" onClick={exportExcel}>
            <Icon name="download" className="h-4 w-4 mr-1" /> Excel
          </Button>
          <Button variant="outline" onClick={exportPDF}>
            <Icon name="download" className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Input
              type="date"
              label="Report From"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input
              type="date"
              label="Report To"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <Select
              label="Drivers"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              options={[{ value: "", label: "All Drivers" }, ...driversOptions]}
            />
            <Select
              label="Vehicles"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              options={[
                { value: "", label: "All Vehicles" },
                ...vehicleOptions,
              ]}
            />
            <Select
              label="Status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as ReportRow["status"] | "")
              }
              options={[
                { value: "", label: "All" },
                { value: "booked", label: "Booked" },
                { value: "yet-to-start", label: "Yet to Start" },
                { value: "ongoing", label: "Ongoing" },
                { value: "completed", label: "Completed" },
                { value: "canceled", label: "Canceled" },
              ]}
            />
            <div className="hidden md:block" />
            <Select
              label="Month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={[
                { value: "", label: "All" },
                ...Array.from({ length: 12 }, (_, i) => ({
                  value: String(i + 1),
                  label: format(new Date(2000, i, 1), "MMMM"),
                })),
              ]}
            />
            <Select
              label="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={[
                { value: "", label: "-- Year --" },
                ...Array.from({ length: 6 }, (_, i) => {
                  const y = new Date().getFullYear() - i;
                  return { value: String(y), label: String(y) };
                }),
              ]}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => {
                if (year) applyMonthYear();
                generateRows();
              }}
            >
              <Icon name="filter" className="h-4 w-4 mr-1" /> Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Total Amount:{" "}
            <span className="font-semibold">
              ₹{(totals.expenses + totals.advance).toLocaleString()}
            </span>
          </div>
          <div className="text-sm text-gray-700">
            Advance:{" "}
            <span className="font-semibold">
              ₹{totals.advance.toLocaleString()}
            </span>
          </div>
          <div className="text-sm text-gray-700">
            Expenses:{" "}
            <span className="font-semibold">
              ₹{totals.expenses.toLocaleString()}
            </span>
          </div>
          <div className="text-sm text-gray-700">
            Balance:{" "}
            <span className="font-semibold">
              ₹{totals.balance.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <DataTable<ReportRow>
        data={rows}
        columns={[
          { key: "sNo", header: "S.No" },
          {
            key: "bookingDate",
            header: "Booking Date",
            render: (r) => new Date(r.bookingDate).toLocaleDateString(),
          },
          { key: "customerName", header: "Customer Name" },
          { key: "route", header: "From / To" },
          {
            key: "bookingAmount",
            header: "Booking Amount",
            render: (r) => `₹${r.bookingAmount.toLocaleString()}`,
          },
          {
            key: "advanceReceived",
            header: "Advance Received",
            render: (r) => `₹${r.advanceReceived.toLocaleString()}`,
          },
          {
            key: "expenses",
            header: "Driver Expenses",
            render: (r) => `₹${r.expenses.toLocaleString()}`,
          },
          {
            key: "balance",
            header: "Amount Paid",
            render: (r) => `₹${r.balance.toLocaleString()}`,
          },
          { key: "driverName", header: "Driver Name" },
          { key: "vehicle", header: "Vehicle" },
          { key: "status", header: "Status" },
          {
            key: "createdAt",
            header: "Created Date",
            render: (r) => new Date(r.createdAt).toLocaleString(),
          },
        ]}
        defaultSortKey={"bookingDate"}
        defaultSortDirection="desc"
        searchPlaceholder="Search bookings..."
      />
    </div>
  );
};

export default BookingReport;
