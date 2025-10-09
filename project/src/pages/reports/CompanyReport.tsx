import React from "react";
import { useApp } from "../../context/AppContext";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { DataTable } from "../../components/common/DataTable";
import { Icon } from "../../components/ui/Icon";
import { format, startOfMonth, endOfMonth } from "date-fns";
import type { Driver, Vehicle, Company } from "../../types";

interface ReportRow {
  id: string;
  sNo: number;
  bookingDate: string;
  customerName: string;
  route: string;
  bookingAmount: number;
  driverName: string;
  companyName: string;
  advanceToDriver: number;
  driverExpenses: number;
  driverReceived: number;
  amountPayable: number;
  vehicle: string;
  createdDate: string;
}

export const CompanyReport: React.FC = () => {
  const { bookings, drivers, vehicles, payments, companies } = useApp();
  const [from, setFrom] = React.useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [to, setTo] = React.useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [companyId, setCompanyId] = React.useState<string>("");
  const [month, setMonth] = React.useState<string>("");
  const [year, setYear] = React.useState<string>("");
  const [rows, setRows] = React.useState<ReportRow[]>([]);

  const companiesOptions = companies.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const applyMonthYear = () => {
    if (!year) return { from, to }; // return current values if no year
    const m = month ? parseInt(month, 10) : 1; // 1-12
    const start = new Date(parseInt(year, 10), m - 1, 1);
    const end = month
      ? endOfMonth(start)
      : new Date(parseInt(year, 10), 11, 31);
    const newFrom = format(start, "yyyy-MM-dd");
    const newTo = format(end, "yyyy-MM-dd");
    setFrom(newFrom);
    setTo(newTo);
    return { from: newFrom, to: newTo };
  };

  const generateRows = (customFrom?: string, customTo?: string) => {
    const startDate = customFrom || from;
    const endDate = customTo || to;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const filtered = bookings.filter((b) => {
      const dt = new Date(b.startDate);
      const inRange = dt >= start && dt <= end;
      const matchesCompany = companyId ? b.companyId === companyId : true;
      return inRange && matchesCompany;
    });
    const finalRows: ReportRow[] = filtered.map((b, idx) => {
      const driver: Driver | undefined = drivers.find(
        (d) => d.id === (b.driverId || "")
      );
      const vehicle: Vehicle | undefined = vehicles.find(
        (v) => v.id === (b.vehicleId || "")
      );
      const company: Company | undefined = companies.find(
        (c) => c.id === (b.companyId || "")
      );
      const driverExpenses = b.expenses.reduce((sum, e) => sum + e.amount, 0);
      // We don't have per-booking advances/received to driver; use 0 placeholders
      const advanceToDriver = 0;
      const driverReceived = payments
        .filter(
          (p) => p.entityType === "driver" && p.entityId === (b.driverId || "")
        )
        .reduce((s, p) => s + (p.type === "paid" ? p.amount : 0), 0);
      const amountPayable = Math.max(
        0,
        b.totalAmount - driverExpenses - advanceToDriver
      );
      return {
        id: b.id,
        sNo: idx + 1,
        bookingDate: new Date(b.startDate).toISOString(),
        customerName: b.customerName,
        route: `${b.pickupLocation} / ${b.dropLocation}`,
        bookingAmount: b.totalAmount,
        driverName: driver?.name || "-",
        companyName: company?.name || "-",
        advanceToDriver,
        driverExpenses,
        driverReceived,
        amountPayable,
        vehicle: vehicle?.registrationNumber || "-",
        createdDate: b.createdAt,
      };
    });
    setRows(finalRows);
  };

  React.useEffect(() => {
    generateRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, drivers, vehicles]);

  const exportCSV = () => {
    if (rows.length === 0) return;
    const header = [
      "S.No",
      "Company Name",
      "Booking Date",
      "Customer Name",
      "From / To",
      "Booking Amount",
      "Driver Name",
      "Advance to Driver",
      "Driver Expenses",
      "Driver Received",
      "Amount Payable",
      "Vehicle",
      "Created Date",
    ];
    const lines = rows.map((r) =>
      [
        r.sNo,
        r.companyName,
        new Date(r.bookingDate).toLocaleDateString(),
        r.customerName,
        r.route,
        r.bookingAmount,
        r.driverName,
        r.advanceToDriver,
        r.driverExpenses,
        r.driverReceived,
        r.amountPayable,
        r.vehicle,
        new Date(r.createdDate).toLocaleString(),
      ].join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `company-report-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    if (rows.length === 0) return;
    const table = `
      <table>
        <thead><tr>
          <th>S.No</th><th>Company Name</th><th>Booking Date</th><th>Customer Name</th><th>From / To</th><th>Booking Amount</th><th>Driver Name</th><th>Advance to Driver</th><th>Driver Expenses</th><th>Driver Received</th><th>Amount Payable</th><th>Vehicle</th><th>Created Date</th>
        </tr></thead>
        <tbody>
          ${rows
            .map(
              (r) =>
                `<tr><td>${r.sNo}</td><td>${r.companyName}</td><td>${new Date(
                  r.bookingDate
                ).toLocaleDateString()}</td><td>${r.customerName}</td><td>${
                  r.route
                }</td><td>${r.bookingAmount}</td><td>${r.driverName}</td><td>${
                  r.advanceToDriver
                }</td><td>${r.driverExpenses}</td><td>${
                  r.driverReceived
                }</td><td>${r.amountPayable}</td><td>${
                  r.vehicle
                }</td><td>${new Date(r.createdDate).toLocaleString()}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>`;
    const blob = new Blob([table], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `company-report-${from}-to-${to}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCopy = async () => {
    if (rows.length === 0) return;
    const header = [
      "S.No",
      "Company Name",
      "Booking Date",
      "Customer Name",
      "From / To",
      "Booking Amount",
      "Driver Name",
      "Advance to Driver",
      "Driver Expenses",
      "Driver Received",
      "Amount Payable",
      "Vehicle",
      "Created Date",
    ];
    const lines = rows.map((r) =>
      [
        r.sNo,
        r.companyName,
        new Date(r.bookingDate).toLocaleDateString(),
        r.customerName,
        r.route,
        r.bookingAmount,
        r.driverName,
        r.advanceToDriver,
        r.driverExpenses,
        r.driverReceived,
        r.amountPayable,
        r.vehicle,
        new Date(r.createdDate).toLocaleString(),
      ].join("\t")
    );
    await navigator.clipboard.writeText(
      [header.join("\t"), ...lines].join("\n")
    );
  };

  const exportPDF = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      "<html><head><title>Company Report</title><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;font-size:12px}th{background:#f5f5f5}</style></head><body>"
    );
    w.document.write(`<h3>Company Report (${from} to ${to})</h3>`);
    w.document.write(
      "<table><thead><tr><th>S.No</th><th>Company Name</th><th>Booking Date</th><th>Customer Name</th><th>From / To</th><th>Booking Amount</th><th>Driver Name</th><th>Advance to Driver</th><th>Driver Expenses</th><th>Driver Received</th><th>Amount Payable</th><th>Vehicle</th><th>Created Date</th></tr></thead><tbody>"
    );
    rows.forEach((r) => {
      w.document.write(
        `<tr><td>${r.sNo}</td><td>${r.companyName}</td><td>${new Date(
          r.bookingDate
        ).toLocaleDateString()}</td><td>${r.customerName}</td><td>${
          r.route
        }</td><td>${r.bookingAmount}</td><td>${r.driverName}</td><td>${
          r.advanceToDriver
        }</td><td>${r.driverExpenses}</td><td>${r.driverReceived}</td><td>${
          r.amountPayable
        }</td><td>${r.vehicle}</td><td>${new Date(
          r.createdDate
        ).toLocaleString()}</td></tr>`
      );
    });
    w.document.write("</tbody></table></body></html>");
    w.document.close();
    w.focus();
    w.print();
  };

  // const assignedVehicles = React.useMemo(() => {
  //   if (!companyId) return [] as { vehicle: Vehicle; trips: number }[];
  //   const map = new Map<string, number>();
  //   bookings
  //     .filter(
  //       (b) =>
  //         b.companyId === companyId &&
  //         new Date(b.startDate) >= new Date(from) &&
  //         new Date(b.startDate) <= new Date(to)
  //     )
  //     .forEach((b) => {
  //       if (b.vehicleId) map.set(b.vehicleId, (map.get(b.vehicleId) || 0) + 1);
  //     });
  //   return Array.from(map.entries())
  //     .map(([vehId, trips]) => {
  //       const v = vehicles.find((v) => v.id === vehId) as Vehicle | undefined;
  //       return v ? { vehicle: v, trips } : undefined;
  //     })
  //     .filter(Boolean) as { vehicle: Vehicle; trips: number }[];
  // }, [bookings, vehicles, companyId, from, to]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Company Report</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              label="Companies"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              options={[
                { value: "", label: "All Companies" },
                ...companiesOptions,
              ]}
            />
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
                if (year) {
                  const { from: newFrom, to: newTo } = applyMonthYear();
                  generateRows(newFrom, newTo);
                } else {
                  generateRows();
                }
              }}
            >
              <Icon name="filter" className="h-4 w-4 mr-1" /> Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* {!!companyId && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">
              Assigned Vehicles ({assignedVehicles.length})
            </h3>
          </CardHeader>
          <CardContent>
            {assignedVehicles.length === 0 ? (
              <p className="text-sm text-gray-500">
                No vehicles assigned in this period.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {assignedVehicles.map(({ vehicle, trips }) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <p className="font-medium">
                        {vehicle.registrationNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {vehicle.category} • Status: {vehicle.status}
                      </p>
                    </div>
                    <span className="text-sm text-gray-700">
                      Trips: {trips}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )} */}

      <DataTable<ReportRow>
        data={rows}
        columns={[
          { key: "sNo", header: "S.No" },
          { key: "companyName", header: "Company Name" },
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
          { key: "driverName", header: "Driver Name" },
          {
            key: "advanceToDriver",
            header: "Advance to Driver",
            render: (r) => `₹${r.advanceToDriver.toLocaleString()}`,
          },
          {
            key: "driverExpenses",
            header: "Driver Expenses",
            render: (r) => `₹${r.driverExpenses.toLocaleString()}`,
          },
          {
            key: "driverReceived",
            header: "Driver Received",
            render: (r) => `₹${r.driverReceived.toLocaleString()}`,
          },
          {
            key: "amountPayable",
            header: "Amount Payable",
            render: (r) => `₹${r.amountPayable.toLocaleString()}`,
          },
          { key: "vehicle", header: "Vehicle" },
          {
            key: "createdDate",
            header: "Created Date",
            render: (r) => new Date(r.createdDate).toLocaleString(),
          },
        ]}
        defaultSortKey={"bookingDate"}
        defaultSortDirection="desc"
        searchPlaceholder="Search report..."
      />
    </div>
  );
};

export default CompanyReport;
