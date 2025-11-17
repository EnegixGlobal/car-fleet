import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { DataTable } from "../../components/common/DataTable";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/ui/Icon";
import { format, parseISO } from "date-fns";
import { Booking } from "../../types";

export const BookingList: React.FC = () => {
  const navigate = useNavigate();
  const { bookings, drivers, vehicles, companies, deleteBooking, addBooking } =
    useApp();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const { hasRole, user } = useAuth();
  const { showSuccess, showError } = useToast();

  // Filter bookings based on user role
  const getFilteredBookings = () => {
    if (user?.role === 'driver') {
      // Drivers see only their assigned trips
      return bookings.filter(booking => booking.driverId === user.id);
    }
    if (user?.role === 'customer') {
      // Customers see only their bookings (would need customer ID mapping)
      return bookings;
    }
    return bookings;
  };

  let filteredBookings = getFilteredBookings();
  if (statusFilter !== "all")
    filteredBookings = filteredBookings.filter((b) => b.status === statusFilter);
  if (sourceFilter !== "all")
    filteredBookings = filteredBookings.filter(
      (b) => b.bookingSource === sourceFilter
    );
  if (startDate)
    filteredBookings = filteredBookings.filter(
      (b) => b.startDate >= startDate
    );
  if (endDate)
    filteredBookings = filteredBookings.filter(
      (b) => b.startDate <= endDate + "T23:59:59"
    );

  const getDriverName = (driverId?: string) => {
    if (!driverId) return 'Unassigned';
    const driver = drivers.find(d => d.id === driverId);
    return driver?.name || 'Unknown Driver';
  };

  const getVehicleNumber = (vehicleId?: string) => {
    if (!vehicleId) return 'Unassigned';
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.registrationNumber || 'Unknown Vehicle';
  };

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return undefined;
    return companies.find((c) => c.id === companyId)?.name;
  };

  const sourceLabels: Record<Booking["bookingSource"], string> = {
    company: "Company",
    "travel-agency": "Travel Agency",
    individual: "Individual",
  };

  const processedBookings = filteredBookings.map((b) => ({
    ...b,
    driverName: getDriverName(b.driverId),
    vehicleNumber: getVehicleNumber(b.vehicleId),
  }));
  // console.log('Processed Bookings:', processedBookings);

  // Friendly labels for journey type
  const journeyLabels: Record<Booking['journeyType'], string> = {
    'outstation-one-way': 'Outstation One Way',
    'outstation': 'Outstation',
    'local-outstation': 'Local + Outstation',
    'local': 'Local',
    'transfer': 'Transfer',
  };

  const columns = [
    {
      key: 'id' as keyof Booking,
      header: 'ID',
      render: (booking: Booking) => `#${booking.id.slice(-6)}`
    },
    {
      key: "customerName" as keyof Booking,
      header: "Customer",
    },
    {
      key: "bookingSource" as keyof Booking,
      header: "Booking Source",
      render: (booking: Booking) => {
        const companyName = getCompanyName(booking.companyId);
        const sourceLabel =
          sourceLabels[booking.bookingSource] || booking.bookingSource;
        return (
          <div className="text-sm">
            <div className="text-sm text-gray-800">{sourceLabel}</div>
            {companyName && booking.bookingSource !== "individual" && (
              <div className="text-xs text-gray-500">{companyName}</div>
            )}
          </div>
        );
      },
    },
    {
      key: "pickupLocation" as keyof Booking,
      header: "Route",
      render: (booking: Booking) => (
        <div className="max-w-xs">
          <div className="text-sm">{booking.pickupLocation}</div>
          <div className="text-xs text-gray-500">to {booking.dropLocation}</div>
        </div>
      ),
    },
    {
      key: 'startDate' as keyof Booking,
      header: 'Date & Time',
      render: (booking: Booking) => (
        <div>
          <div className="text-sm">{format(parseISO(booking.startDate), 'MMM d, yyyy')}</div>
          <div className="text-xs text-gray-500">{format(parseISO(booking.startDate), 'h:mm a')}</div>
        </div>
      )
    },
    {
      key: 'journeyType' as keyof Booking,
      header: 'Journey',
      render: (booking: Booking) => journeyLabels[booking.journeyType] || booking.journeyType
    },
    {
      key: 'driverId' as keyof Booking,
      header: 'Driver',
      render: (booking: Booking) => getDriverName(booking.driverId)
    },
    {
      key: 'vehicleId' as keyof Booking,
      header: 'Vehicle',
      render: (booking: Booking) => getVehicleNumber(booking.vehicleId)
    },
    {
      key: 'totalAmount' as keyof Booking,
      header: 'Amount',
      render: (booking: Booking) => `₹${booking.totalAmount.toLocaleString()}`
    },
    {
      key: 'status' as keyof Booking,
      header: 'Status',
      render: (booking: Booking) => <Badge variant={booking.status}>{booking.status}</Badge>
    }
  ];

  const handleDelete = async (booking: Booking) => {
    const confirmed = window.confirm(
      `Delete booking #${booking.id.slice(-6)} for ${booking.customerName}? This action cannot be undone.`
    );
    if (!confirmed) return;
    setDeletingId(booking.id);
    try {
      await deleteBooking(booking.id);
      showSuccess('Booking deleted successfully');
    } catch (err) {
      console.error(err);
      showError('Failed to delete booking. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const buildClonePayload = (booking: Booking): Omit<Booking, "id" | "createdAt"> => ({
    customerId: booking.customerId,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    bookingSource: booking.bookingSource,
    companyId: booking.companyId,
    pickupLocation: booking.pickupLocation,
    dropLocation: booking.dropLocation,
    journeyType: booking.journeyType,
    cityOfWork: booking.cityOfWork,
    startDate: booking.startDate,
    endDate: booking.endDate,
    vehicleId: booking.vehicleId,
    driverId: booking.driverId,
    tariffRate: booking.tariffRate,
    totalAmount: booking.totalAmount,
    advanceReceived: booking.advanceReceived,
    balance: booking.totalAmount - booking.advanceReceived,
    advanceReason: booking.advanceReason,
    status: "booked",
    expenses: [],
    payments: [],
    dutySlips: [],
    finalPaid: 0,
    billed: false,
    dutySlipSubmitted: false,
    dutySlipSubmittedToCompany: false,
    statusHistory: [
      {
        id: Math.random().toString(36).slice(2),
        status: "booked",
        timestamp: new Date().toISOString(),
        changedBy: user?.name || user?.email || "Cloned",
      },
    ],
  });

  const handleClone = async (booking: Booking) => {
    setCloningId(booking.id);
    try {
      await addBooking(buildClonePayload(booking));
      showSuccess("Booking cloned");
    } catch (err) {
      console.error(err);
      showError("Failed to clone booking");
    } finally {
      setCloningId(null);
    }
  };

  const actions = (booking: Booking) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/bookings/${booking.id}`);
        }}
        className="text-amber-600 hover:text-amber-800"
        aria-label="View booking"
      >
        <Icon name="eye" className="h-4 w-4" />
      </button>
      {hasRole(['admin', 'dispatcher']) && (
        <>
          <span className="text-gray-300">|</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/bookings/${booking.id}/edit`);
            }}
            className="text-amber-600 hover:text-amber-800"
            aria-label="Edit booking"
          >
            <Icon name="edit" className="h-4 w-4" />
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClone(booking);
            }}
            className="text-amber-600 hover:text-amber-800 disabled:text-gray-400"
            aria-label="Clone booking"
            title="Clone booking"
            disabled={cloningId === booking.id}
          >
            {cloningId === booking.id ? (
              <Icon name="spinner" className="h-4 w-4" spin />
            ) : (
              <Icon name="copy" className="h-4 w-4" />
            )}
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(booking);
            }}
            className="text-amber-600 hover:text-amber-800 disabled:text-gray-400"
            aria-label="Delete booking"
            disabled={deletingId === booking.id}
          >
            <Icon
              name={deletingId === booking.id ? 'spinner' : 'delete'}
              className="h-4 w-4"
              spin={deletingId === booking.id}
            />
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
        {hasRole(["admin", "dispatcher"]) && (
          <div className="flex space-x-2">
            <Button onClick={() => navigate("/bookings/create")}>
              <Icon name="plus" className="h-4 w-4 mr-2" />
              New Booking
            </Button>
            {bookings.length === 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem("bolt_bookings");
                  window.location.reload();
                }}
              >
                Load Sample
              </Button>
            )}
          </div>
        )}
      </div>

      {/* DataTable now renders filters in collapsible panel */}

      <DataTable
        data={processedBookings}
        columns={columns}
        searchPlaceholder="Search bookings..."
        onRowClick={(booking) => navigate(`/bookings/${booking.id}`)}
        actions={
          hasRole(["admin", "dispatcher", "driver"]) ? actions : undefined
        }
        sortableColumns={[
          "customerName",
          "startDate",
          "journeyType",
          "totalAmount",
          "status",
        ]}
        defaultSortKey={"startDate"}
        defaultSortDirection="desc"
        filtersArea={
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label
                htmlFor="statusFilter"
                className="block text-xs font-medium text-gray-500 mb-1"
              >
                Status
              </label>
              <select
                id="statusFilter"
                aria-label="Status filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border-gray-300 rounded-md text-sm focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="all">All</option>
                <option value="booked">Booked</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="yet-to-start">Yet to Start</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="sourceFilter"
                className="block text-xs font-medium text-gray-500 mb-1"
              >
                Source
              </label>
              <select
                id="sourceFilter"
                aria-label="Source filter"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full border-gray-300 rounded-md text-sm focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="all">All</option>
                <option value="company">Company</option>
                <option value="travel-agency">Travel Agency</option>
                <option value="individual">Individual</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="startDateFilter"
                className="block text-xs font-medium text-gray-500 mb-1"
              >
                Start Date
              </label>
              <input
                id="startDateFilter"
                aria-label="Start date filter"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border-gray-300 rounded-md text-sm focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div>
              <label
                htmlFor="endDateFilter"
                className="block text-xs font-medium text-gray-500 mb-1"
              >
                End Date
              </label>
              <input
                id="endDateFilter"
                aria-label="End date filter"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border-gray-300 rounded-md text-sm focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStatusFilter("all");
                  setSourceFilter("all");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
};