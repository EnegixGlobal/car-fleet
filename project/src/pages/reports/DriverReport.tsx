import React from "react";
import { useApp } from "../../context/AppContext";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { DataTable } from "../../components/common/DataTable";
import { Icon } from "../../components/ui/Icon";
import { format, startOfMonth, endOfMonth } from "date-fns";
import type { Driver, Vehicle, DriverFinancePayment } from "../../types";
import { financeAPI } from "../../services/api";

interface ReportRow {
  id: string;
  sNo: number;
  bookingDate: string;
  customerName: string;
  route: string;
  bookingAmount: number;
  driverName: string;
  advanceToDriver: number;
  driverExpenses: number;
  driverReceived: number;
  amountPayable: number;
  vehicle: string;
  createdDate: string;
  finalPaid?: number;
}

export const DriverReport: React.FC = () => {
  const { bookings, drivers, vehicles } = useApp();
  console.log("bookings", bookings);
  const ALL_BOOKINGS_ID = "ALL_BOOKINGS";
  const formatMoney = (n: number) =>
    Number.isFinite(n)
      ? n.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";
  const [from, setFrom] = React.useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [to, setTo] = React.useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [driverId, setDriverId] = React.useState<string>("");
  const [month, setMonth] = React.useState<string>("");
  const [year, setYear] = React.useState<string>("");
  const [rows, setRows] = React.useState<ReportRow[]>([]);
  const [driverPayments, setDriverPayments] = React.useState<
    DriverFinancePayment[]
  >([]);
  const [loadingDriverPayments, setLoadingDriverPayments] =
    React.useState(false);
  const [generatingReport, setGeneratingReport] = React.useState(false);
  const [selectedBookingId, setSelectedBookingId] = React.useState<string>("");
  const [payAmount, setPayAmount] = React.useState<number>(0);

  const driversOptions = drivers.map((d) => ({ value: d.id, label: d.name }));

  // Derived data for Trip Payment section
  const filteredBookings = React.useMemo(() => {
    const start = new Date(from);
    const end = new Date(to);
    return bookings.filter((b) => {
      const dt = new Date(b.startDate);
      const inRange = dt >= start && dt <= end;
      const matchesDriver = driverId ? b.driverId === driverId : false;
      return inRange && matchesDriver;
    });
  }, [bookings, driverId, from, to]);

  const bookingPayables = React.useMemo(
    () =>
      filteredBookings.map((b) => {
        const driverExpenses = (b.expenses || []).reduce(
          (sum, e) => sum + e.amount,
          0
        );
        const advanceToDriver = b.advanceReceived || 0;
        const paymentsForBooking = (driverPayments || []).filter(
          (p) => p.bookingId === b.id
        );
        const totalPaymentAmount = paymentsForBooking.reduce(
          (sum, p) => sum + (p.amount || 0),
          0
        );
        const amountPayable =
          totalPaymentAmount === 0
            ? 0
            : totalPaymentAmount - driverExpenses - advanceToDriver;
        return { booking: b, totalPaymentAmount, amountPayable };
      }),
    [filteredBookings, driverPayments]
  );

  const trips = React.useMemo(
    () => filteredBookings.length,
    [filteredBookings]
  );
  const totalPaymentAmountAll = React.useMemo(
    () => bookingPayables.reduce((sum, r) => sum + r.totalPaymentAmount, 0),
    [bookingPayables]
  );

 const bookingOptions = React.useMemo(
   () =>
     bookingPayables
       .filter(({ booking }) => !booking.finalPaid || booking.finalPaid === 0) // exclude if finalPaid exists and > 0
       .map(({ booking, amountPayable }) => ({
         value: booking.id,
         label: `${new Date(booking.startDate).toLocaleDateString()} - ${
           booking.pickupLocation
         } to ${booking.dropLocation} - ₹${formatMoney(amountPayable)}`,
       })),
   [bookingPayables]
 );
  
  const totalFinalPaid = React.useMemo(() => {
    return bookingPayables.reduce(
      (sum, { booking }) => sum + (booking.finalPaid || 0),
      0
    );
  }, [bookingPayables]);

  const displayedAmountPayable = React.useMemo(() => {
    if (selectedBookingId === ALL_BOOKINGS_ID) {
      const diff = totalFinalPaid - payAmount;
      return Number.isFinite(diff) ? diff.toFixed(2) : "0.00";
    } else {
      const booking = bookingPayables.find(
        (b) => b.booking.id === selectedBookingId
      )?.booking;
      if (!booking) return "0.00";
      const diff = (booking.finalPaid || 0) - payAmount;
      return Number.isFinite(diff) ? diff.toFixed(2) : "0.00";
    }
  }, [selectedBookingId, bookingPayables, payAmount, totalFinalPaid]);
 



  React.useEffect(() => {
    if (!selectedBookingId && bookingPayables.length > 0) {
      setSelectedBookingId(ALL_BOOKINGS_ID);
    }
  }, [bookingPayables, selectedBookingId]);

  React.useEffect(() => {
    if (selectedBookingId === ALL_BOOKINGS_ID) {
      const total = bookingPayables.reduce(
        (sum, x) => sum + (x.amountPayable || 0),
        0
      );
      setPayAmount(total);
      return;
    }
    const sel = bookingPayables.find((x) => x.booking.id === selectedBookingId);
    setPayAmount(sel?.amountPayable || 0);
  }, [selectedBookingId, bookingPayables]);

  // Function to fetch driver payments
  const fetchDriverPayments = async (
    selectedDriverId: string
  ): Promise<DriverFinancePayment[]> => {
    if (!selectedDriverId) {
      setDriverPayments([]);
      return [];
    }

    try {
      setLoadingDriverPayments(true);
      console.log("Fetching driver payments for driver ID:", selectedDriverId);
      const payments = await financeAPI.getDriverPayments(selectedDriverId);
      console.log("Fetched driver payments:", payments);
      setDriverPayments(payments);
      return payments;
    } catch (error) {
      console.error("Failed to fetch driver payments:", error);
      setDriverPayments([]);
      return [];
    } finally {
      setLoadingDriverPayments(false);
    }
  };

  const applyMonthYear = () => {
    if (!year) return; // require at least year for month/year filter
    const m = month ? parseInt(month, 10) : 1; // 1-12
    const start = new Date(parseInt(year, 10), m - 1, 1);
    const end = month
      ? endOfMonth(start)
      : new Date(parseInt(year, 10), 11, 31);
    setFrom(format(start, "yyyy-MM-dd"));
    setTo(format(end, "yyyy-MM-dd"));
  };

  const generateRows = async () => {
    try {
      setGeneratingReport(true);
      const start = new Date(from);
      const end = new Date(to);
      // Ensure we have latest driver payments before computing rows
      const paymentsForDriver: DriverFinancePayment[] = driverId
        ? await fetchDriverPayments(driverId)
        : driverPayments;
      const filtered = bookings.filter((b) => {
        const dt = new Date(b.startDate);
        const inRange = dt >= start && dt <= end;
        const matchesDriver = driverId ? b.driverId === driverId : true;
        return inRange && matchesDriver;
      });
      const finalRows: ReportRow[] = filtered.map((b, idx) => {
        const driver: Driver | undefined = drivers.find(
          (d) => d.id === (b.driverId || "")
        );
        const vehicle: Vehicle | undefined = vehicles.find(
          (v) => v.id === (b.vehicleId || "")
        );
        const driverExpenses = b.expenses.reduce((sum, e) => sum + e.amount, 0);
        // We don't have per-booking advances/received to driver; use 0 placeholders
        const advanceToDriver = b.advanceReceived || 0;
        const driverReceived = b.advanceReceived || 0;
        // const driverReceived = payments
        //   .filter(
        //     (p) =>
        //       p.entityType === "driver" && p.entityId === (b.driverId || "")
        //   )
        //   .reduce((s, p) => s + (p.type === "paid" ? p.amount : 0), 0);
        // const amountPayable = Math.max(
        //   0,
        //   b.totalAmount - driverExpenses - advanceToDriver
        // );

        const paymentsForBooking = (paymentsForDriver || []).filter(
          (p) => p.bookingId === b.id
        );
        const totalPaymentAmount = paymentsForBooking.reduce(
          (sum, p) => sum + (p.amount || 0),
          0
        );

        // const amount = driverPayments.reduce(
        //   (sum, payment) => sum + (payment.amount || 0),
        //   0
        // );

        const amountPayable =
          totalPaymentAmount === 0
            ? 0
            : totalPaymentAmount - driverExpenses - advanceToDriver;

        return {
          id: b.id,
          sNo: idx + 1,
          bookingDate: new Date(b.startDate).toISOString(),
          customerName: b.customerName,
          route: `${b.pickupLocation} / ${b.dropLocation}`,
          bookingAmount: b.totalAmount,
          driverName: driver?.name || "-",
          advanceToDriver,
          driverExpenses,
          driverReceived,
          amountPayable,
          vehicle: vehicle?.registrationNumber || "-",
          createdDate: b.createdAt,
        };
      });
      setRows(finalRows);

      // Fetch driver payments when generating report if a driver is selected
      if (driverId) {
        console.log(
          "Generating report - fetching driver payments for:",
          driverId
        );
        await fetchDriverPayments(driverId);
      } else {
        // Clear driver payments if no driver selected
        setDriverPayments([]);
      }
    } finally {
      setGeneratingReport(false);
    }
  };

  React.useEffect(() => {
    generateRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, drivers, vehicles]);

  const exportCSV = () => {
    if (rows.length === 0) return;
    const header = [
      "S.No",
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
        r.bookingDate,
        r.customerName,
        r.route,
        Number(r.bookingAmount).toFixed(2),
        r.driverName,
        Number(r.advanceToDriver).toFixed(2),
        Number(r.driverExpenses).toFixed(2),
        Number(r.driverReceived).toFixed(2),
        Number(r.amountPayable).toFixed(2),
        r.vehicle,
        r.createdDate,
      ].join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `driver-report-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    if (rows.length === 0) return;
    const table = `
      <table>
        <thead><tr>
          <th>S.No</th><th>Booking Date</th><th>Customer Name</th><th>From / To</th><th>Booking Amount</th><th>Driver Name</th><th>Advance to Driver</th><th>Driver Expenses</th><th>Driver Received</th><th>Amount Payable</th><th>Vehicle</th><th>Created Date</th>
        </tr></thead>
        <tbody>
          ${rows
            .map(
              (r) =>
                `<tr><td>${r.sNo}</td><td>${r.bookingDate}</td><td>${
                  r.customerName
                }</td><td>${r.route}</td><td>${Number(r.bookingAmount).toFixed(
                  2
                )}</td><td>${r.driverName}</td><td>${Number(
                  r.advanceToDriver
                ).toFixed(2)}</td><td>${Number(r.driverExpenses).toFixed(
                  2
                )}</td><td>${Number(r.driverReceived).toFixed(
                  2
                )}</td><td>${Number(r.amountPayable).toFixed(2)}</td><td>${
                  r.vehicle
                }</td><td>${r.createdDate}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>`;
    const blob = new Blob([table], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `driver-report-${from}-to-${to}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCopy = async () => {
    if (rows.length === 0) return;
    const header = [
      "S.No",
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
        r.bookingDate,
        r.customerName,
        r.route,
        Number(r.bookingAmount).toFixed(2),
        r.driverName,
        Number(r.advanceToDriver).toFixed(2),
        Number(r.driverExpenses).toFixed(2),
        Number(r.driverReceived).toFixed(2),
        Number(r.amountPayable).toFixed(2),
        r.vehicle,
        r.createdDate,
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
      "<html><head><title>Driver Report</title><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;font-size:12px}th{background:#f5f5f5}</style></head><body>"
    );
    w.document.write(`<h3>Driver Report (${from} to ${to})</h3>`);
    w.document.write(
      "<table><thead><tr><th>S.No</th><th>Booking Date</th><th>Customer Name</th><th>From / To</th><th>Booking Amount</th><th>Driver Name</th><th>Advance to Driver</th><th>Driver Expenses</th><th>Driver Received</th><th>Amount Payable</th><th>Vehicle</th><th>Created Date</th></tr></thead><tbody>"
    );
    rows.forEach((r) => {
      w.document.write(
        `<tr><td>${r.sNo}</td><td>${r.bookingDate}</td><td>${
          r.customerName
        }</td><td>${r.route}</td><td>${Number(r.bookingAmount).toFixed(
          2
        )}</td><td>${r.driverName}</td><td>${Number(r.advanceToDriver).toFixed(
          2
        )}</td><td>${Number(r.driverExpenses).toFixed(2)}</td><td>${Number(
          r.driverReceived
        ).toFixed(2)}</td><td>${Number(r.amountPayable).toFixed(2)}</td><td>${
          r.vehicle
        }</td><td>${r.createdDate}</td></tr>`
      );
    });
    w.document.write("</tbody></table></body></html>");
    w.document.close();
    w.focus();
    w.print();
  };

  const assignedVehicles = React.useMemo(() => {
    if (!driverId) return [] as { vehicle: Vehicle; trips: number }[];
    const map = new Map<string, number>();
    bookings
      .filter(
        (b) =>
          b.driverId === driverId &&
          new Date(b.startDate) >= new Date(from) &&
          new Date(b.startDate) <= new Date(to)
      )
      .forEach((b) => {
        if (b.vehicleId) map.set(b.vehicleId, (map.get(b.vehicleId) || 0) + 1);
      });
    return Array.from(map.entries())
      .map(([vehId, trips]) => {
        const v = vehicles.find((v) => v.id === vehId) as Vehicle | undefined;
        return v ? { vehicle: v, trips } : undefined;
      })
      .filter(Boolean) as { vehicle: Vehicle; trips: number }[];
  }, [bookings, vehicles, driverId, from, to]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Driver Report</h1>
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
              label="Drivers"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              options={[{ value: "", label: "All Drivers" }, ...driversOptions]}
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
              onClick={async () => {
                if (year) applyMonthYear();
                await generateRows();
              }}
              disabled={generatingReport}
            >
              <Icon name="filter" className="h-4 w-4 mr-1" />
              {generatingReport ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </CardContent>
      </Card>
      {!!driverId && (
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
      )}
      {!!driverId && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">
              Driver Payments ({driverPayments.length})
              {loadingDriverPayments && (
                <span className="text-sm text-gray-500 ml-2">Loading...</span>
              )}
            </h3>
          </CardHeader>
          <CardContent>
            {loadingDriverPayments ? (
              <p className="text-sm text-gray-500">
                Loading driver payments...
              </p>
            ) : driverPayments.length === 0 ? (
              <p className="text-sm text-gray-500">No driver payments found.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-auto">
                {driverPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-3 border rounded-md text-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="font-medium">
                          ₹{formatMoney(payment.amount)}{" "}
                          <span className="text-xs text-gray-500">
                            ({payment.type})
                          </span>
                          {payment.mode && (
                            <span className="text-xs text-gray-500 ml-1">
                              • {payment.mode}
                            </span>
                          )}
                        </p>
                        {payment.description && (
                          <p className="text-gray-600 truncate">
                            {payment.description}
                          </p>
                        )}
                        {payment.booking && (
                          <p className="text-xs text-gray-500">
                            Booking: {payment.booking.pickupLocation} →{" "}
                            {payment.booking.dropLocation}
                          </p>
                        )}
                        {payment.mode === "fuel-basis" &&
                          payment.fuelQuantity &&
                          payment.fuelRate && (
                            <p className="text-xs text-gray-500">
                              Fuel: {payment.fuelQuantity}L @ ₹
                              {payment.fuelRate} = ₹
                              {formatMoney(payment.computedAmount || 0)}
                            </p>
                          )}
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>{new Date(payment.date).toLocaleDateString()}</p>
                        {payment.settled && (
                          <span className="text-green-600 font-medium">
                            Settled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pay to driver according to trip */}
      {!!driverId && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Trip Payment</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="p-3 border rounded-md">
                <p className="text-lg text-gray-500">
                  Total Amount :{" "}
                  <span className="font-semibold text-lg text-gray-700">
                    ₹{formatMoney(totalPaymentAmountAll)}
                  </span>
                </p>
              </div>
              <div className="p-3 border rounded-md">
                <p className="text-lg text-gray-500">
                  Trips:{" "}
                  <span className="font-semibold text-lg text-gray-700">
                    {trips}
                  </span>
                </p>
              </div>
              <Select
                label="Select Trip"
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                options={[
                  { value: ALL_BOOKINGS_ID, label: "All Bookings" },
                  ...bookingOptions,
                ]}
              />
              <div className="flex gap-2">
                <Input
                  type="text"
                  label="Amount Payable"
                  value={
                    Number.isFinite(payAmount)
                      ? Number(payAmount).toFixed(2)
                      : "0.00"
                  }
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                />
                <Button
                  size="sm"
                  className="h-8 pt-2 mt-6"
                  disabled={!selectedBookingId || payAmount <= 0}
                >
                  <Icon name="plus" className="h-4 w-4 mr-1" /> Pay
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            render: (r) =>
              `₹${Number(r.bookingAmount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
          },
          { key: "driverName", header: "Driver Name" },
          {
            key: "advanceToDriver",
            header: "Advance to Driver",
            render: (r) =>
              `₹${Number(r.advanceToDriver).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
          },
          {
            key: "driverExpenses",
            header: "Driver Expenses",
            render: (r) =>
              `₹${Number(r.driverExpenses).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
          },
          {
            key: "driverReceived",
            header: "Driver Received",
            render: (r) =>
              `₹${Number(r.driverReceived).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
          },
          {
            key: "amountPayable",
            header: "Amount Payable",
            render: (r) =>
              `₹${Number(r.amountPayable).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
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

export default DriverReport;
