import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../hooks/useAuth";
import { Card, CardContent, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Icon } from "../../components/ui/Icon";
import { format, parseISO } from "date-fns";
import { UploadedFile, Expense, Booking, DriverPayment } from "../../types";
import { bookingAPI } from "../../services/api";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    bookings,
    updateBooking,
    updateBookingStatus,
    toggleBookingBilled,
    toggleDutySlipSubmitted,
    toggleDutySlipSubmittedToCompany,
    drivers,
    vehicles,
  } = useApp();
  const { hasRole } = useAuth();

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Booking["payments"] extends (infer T)[] ? T | null : any>(null);
  const [showDriverPaymentModal, setShowDriverPaymentModal] = useState(false);
  const [driverPayments, setDriverPayments] = useState<DriverPayment[]>([]);
  const [editingDriverPayment, setEditingDriverPayment] =
    useState<DriverPayment | null>(null);
  const [exporting, setExporting] = useState(false);

  const booking = bookings.find((b) => b.id === id);

  // If booking exists but has driverId/vehicleId and we haven't loaded those entities yet, try a one-time direct fetch to ensure latest state
  useEffect(() => {
    (async () => {
      if (!id) return;
      if (!booking) return;
      try {
        const fresh = await bookingAPI.get(id);
        updateBooking(id, fresh as unknown as Partial<Booking>);
        // Load driver payments
        const dp = await bookingAPI.listDriverPayments(id);
        console.log('Driver payments received from backend:', dp);
        setDriverPayments(dp as DriverPayment[]);
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  interface ExpenseForm {
    type: Expense["type"];
    amount: string;
    description: string;
  }
  const {
    register: registerExpense,
    handleSubmit: handleExpenseSubmit,
    reset: resetExpense,
    formState: { errors: expenseErrors },
  } = useForm<ExpenseForm>();

  interface StatusForm {
    status: Booking["status"];
  }
  const {
    register: registerStatus,
    handleSubmit: handleStatusSubmit,
    formState: { errors: statusErrors },
  } = useForm<StatusForm>();

  interface PaymentForm {
    amount: string;
    comments?: string;
    collectedBy?: string;
    paidOn: string;
  }
  const {
    register: registerPayment,
    handleSubmit: handlePaymentSubmit,
    reset: resetPayment,
    setValue: setValuePayment,
    formState: { errors: paymentErrors },
  } = useForm<PaymentForm>({
    defaultValues: { paidOn: new Date().toISOString().slice(0, 10) },
  });

  interface DriverPaymentForm {
    mode: "per-trip" | "daily" | "fuel-basis";
    amount?: string;
    fuelQuantity?: string;
    fuelRate?: string;
    distanceKm?: string;
    mileage?: string;
    description?: string;
  }
  const {
    register: registerDriverPay,
    handleSubmit: handleDriverPaySubmit,
    watch: watchDriverPay,
    reset: resetDriverPay,
    formState: { errors: driverPayErrors },
  } = useForm<DriverPaymentForm>({ defaultValues: { mode: "per-trip" } });
  const startEditDriverPayment = (p: DriverPayment) => {
    setEditingDriverPayment(p);
    resetDriverPay({
      mode: p.mode,
      amount: p.mode !== "fuel-basis" ? String(p.amount) : undefined,
      fuelQuantity: p.fuelQuantity ? String(p.fuelQuantity) : undefined,
      fuelRate: p.fuelRate ? String(p.fuelRate) : undefined,
      description: p.description,
    });
    setShowDriverPaymentModal(true);
  };

  const onExportDriverPayments = async () => {
    if (!booking) return;
    setExporting(true);
    try {
      const blob = await bookingAPI.exportDriverPayments(booking.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `driver-payments-${booking.id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };
  const watchMode = watchDriverPay("mode");
  const watchFuelQty = watchDriverPay("fuelQuantity");
  const watchFuelRate = watchDriverPay("fuelRate");
  const watchDistanceKm = watchDriverPay("distanceKm");
  const watchMileage = watchDriverPay("mileage");
  // Derive fuel quantity if distance & mileage provided
  const derivedFuelQty =
    watchMode === "fuel-basis" &&
    watchDistanceKm &&
    watchMileage &&
    parseFloat(watchMileage) > 0
      ? parseFloat(watchDistanceKm || "0") / parseFloat(watchMileage || "0")
      : undefined;
  const effectiveFuelQty =
    derivedFuelQty !== undefined
      ? derivedFuelQty
      : watchFuelQty
      ? parseFloat(watchFuelQty || "0")
      : 0;
  const computedFuelAmount =
    watchMode === "fuel-basis" && (effectiveFuelQty || 0) && watchFuelRate
      ? effectiveFuelQty * parseFloat(watchFuelRate || "0")
      : 0;

  // Prefill collectedBy with assigned driver name when opening Add Payment modal.
  // Placed above any conditional return to satisfy React Hooks rules.
  useEffect(() => {
    if (!showPaymentModal) return;
    if (!booking) return;
    if (!booking.driverId) return;
    const drv = drivers.find((d) => d.id === booking.driverId);
    if (drv) setValuePayment("collectedBy", drv.name);
  }, [showPaymentModal, booking, drivers, setValuePayment]);

  if (!booking) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">
          Booking not found
        </h2>
        <Button onClick={() => navigate("/bookings")} className="mt-4">
          Back to Bookings
        </Button>
      </div>
    );
  }

  const driver = booking.driverId
    ? drivers.find((d) => d.id === booking.driverId)
    : null;
  const vehicle = booking.vehicleId
    ? vehicles.find((v) => v.id === booking.vehicleId)
    : null;

  const onAddExpense = async (data: ExpenseForm) => {
    try {
      let updated;
      if (editingExpense) {
        updated = await bookingAPI.updateExpense(booking.id, editingExpense.id, {
          type: data.type,
          amount: parseFloat(data.amount),
          description: data.description,
        });
      } else {
        updated = await bookingAPI.addExpense(booking.id, {
          type: data.type,
          amount: parseFloat(data.amount),
          description: data.description,
        });
      }
      updateBooking(booking.id, updated as unknown as Partial<Booking>);
      toast.success(editingExpense ? "Expense updated successfully" : "Expense added successfully");
      setShowExpenseModal(false);
      resetExpense();
      setEditingExpense(null);
    } catch {
      toast.error(editingExpense ? "Failed to update expense" : "Failed to add expense");
    }
  };

  const onDeleteExpense = async (expenseId: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      const updated = await bookingAPI.deleteExpense(booking.id, expenseId);
      updateBooking(booking.id, updated as unknown as Partial<Booking>);
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete expense");
    }
  };

  const onUpdateStatus = async (data: StatusForm) => {
    await updateBookingStatus(booking.id, data.status, "Current User");
    toast.success("Status updated successfully");
    setShowStatusModal(false);
  };

  const toggleBilled = async () => {
    try {
      await toggleBookingBilled(booking.id, !booking.billed);
      toast.success(
        `Booking marked as ${!booking.billed ? "billed" : "not billed"}`
      );
    } catch {
      toast.error("Failed to update billing status");
    }
  };

  const toggleDutySlipStatus = async () => {
    try {
      await toggleDutySlipSubmitted(booking.id, !booking.dutySlipSubmitted);
      toast.success(
        `Duty slip marked as ${
          !booking.dutySlipSubmitted ? "submitted" : "not submitted"
        }`
      );
    } catch {
      toast.error("Failed to update duty slip status");
    }
  };

  const toggleDutySlipToCompanyStatus = async () => {
    try {
      await toggleDutySlipSubmittedToCompany(
        booking.id,
        !booking.dutySlipSubmittedToCompany
      );
      toast.success(
        `Duty slip marked as ${
          !booking.dutySlipSubmittedToCompany
            ? "submitted to company"
            : "not submitted to company"
        }`
      );
    } catch {
      toast.error("Failed to update duty slip to company status");
    }
  };

  const onAddPayment = async (data: PaymentForm) => {
    try {
      let updated;
      if (editingPayment) {
        updated = await bookingAPI.updatePayment(booking.id, editingPayment.id, {
          amount: parseFloat(data.amount),
          comments: data.comments,
          collectedBy: data.collectedBy,
          paidOn: data.paidOn,
        });
      } else {
        updated = await bookingAPI.addPayment(booking.id, {
          amount: parseFloat(data.amount),
          comments: data.comments,
          collectedBy: data.collectedBy,
          paidOn: data.paidOn,
        });
      }
      updateBooking(booking.id, updated as unknown as Partial<Booking>);
      toast.success(editingPayment ? "Payment updated" : "Payment recorded");
      setShowPaymentModal(false);
      resetPayment();
      setEditingPayment(null);
      // Restore default collectedBy for next time
      if (driver) setValuePayment("collectedBy", driver.name);
    } catch {
      toast.error(editingPayment ? "Failed to update payment" : "Failed to record payment");
    }
  };

  const onDeletePayment = async (paymentId: string) => {
    if (!confirm('Delete this payment?')) return;
    try {
      const updated = await bookingAPI.deletePayment(booking.id, paymentId);
      updateBooking(booking.id, updated as unknown as Partial<Booking>);
      toast.success('Payment deleted');
    } catch {
      toast.error('Failed to delete payment');
    }
  };

  const onDutySlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const existing = booking.dutySlips || [];
      const converted: UploadedFile[] = await Promise.all(
        Array.from(files).map(
          (file) =>
            new Promise<UploadedFile>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({
                  id:
                    Date.now().toString() + Math.random().toString(36).slice(2),
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  data: reader.result as string,
                  uploadedAt: new Date().toISOString(),
                });
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );
      updateBooking(booking.id, { dutySlips: [...existing, ...converted] });
      toast.success("Duty slip(s) uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeDutySlip = (id: string) => {
    updateBooking(booking.id, {
      dutySlips: (booking.dutySlips || []).filter((f) => f.id !== id),
    });
  };

  const totalExpenses = booking.expenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );
  const totalPayments = (booking.payments || []).reduce(
    (sum, p) => sum + p.amount,
    0
  );
  // const totalDriverPayments = driverPayments.reduce((s, p) => s + p.amount, 0);


  const finalPayment = driverPayments.find(p =>
    p.description?.toLowerCase().includes("final payment")
  );
  
  let totalDriverPayments;
  
  if (finalPayment) {
    // Agar final payment hai, to sirf uska amount dikhana
    totalDriverPayments = finalPayment.amount;
  } else {
    // Agar final payment nahi hai, to sab normal payments ka sum dikhana
    totalDriverPayments = driverPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }
  
  console.log("Total Driver Payment:", totalDriverPayments);
  

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate("/bookings")}>
            <Icon name="back" className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Booking #{booking.id.slice(-6)}
            </h1>
            <p className="text-gray-500">
              Created {format(parseISO(booking.createdAt), "PPP")}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Badge variant={booking.status} className="text-sm px-3 py-1">
            {booking.status}
          </Badge>
          {hasRole(["admin", "dispatcher"]) && (
            <Button
              variant="outline"
              onClick={() => navigate(`/bookings/${booking.id}/edit`)}
            >
              <Icon name="edit" className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Journey Info */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">
                Journey Details
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Icon name="user" className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{booking.customerName}</p>
                    <p className="text-sm text-gray-500">
                      {booking.customerPhone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Icon name="file" className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium capitalize">
                      {booking.bookingSource.replace("-", " ")}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {booking.journeyType}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Icon
                    name="location"
                    className="h-5 w-5 text-green-600 mt-1"
                  />
                  <div>
                    <p className="font-medium">Pickup</p>
                    <p className="text-sm text-gray-600">
                      {booking.pickupLocation}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Icon name="location" className="h-5 w-5 text-red-600 mt-1" />
                  <div>
                    <p className="font-medium">Drop</p>
                    <p className="text-sm text-gray-600">
                      {booking.dropLocation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Icon name="calendar" className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Start</p>
                    <p className="text-sm text-gray-600">
                      {format(parseISO(booking.startDate), "PPP p")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Icon name="calendar" className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">End</p>
                    <p className="text-sm text-gray-600">
                      {format(parseISO(booking.endDate), "PPP p")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Advance Reason */}
                <div className="flex items-start space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <Icon name="file" className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900">Advance Reason</p>
                    <p className="text-sm text-amber-700 mt-1">
                    {booking.advanceReason?.trim() ? booking.advanceReason : "No reason added"}
                    </p>
                  </div>
                </div>
            </CardContent>
          </Card>

          {/* Assignment Info */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Assignment</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Icon name="user" className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Driver</p>
                    <p className="text-sm text-gray-600">
                      {driver ? driver.name : "Not assigned"}
                    </p>
                    {driver && (
                      <p className="text-xs text-gray-500">{driver.phone}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Icon name="car" className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Vehicle</p>
                    <p className="text-sm text-gray-600">
                      {vehicle ? vehicle.registrationNumber : "Not assigned"}
                    </p>
                    {vehicle && (
                      <p className="text-xs text-gray-500 capitalize">
                        {vehicle.category}
                        {vehicle.categoryDescription
                          ? ` - ${vehicle.categoryDescription}`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Expenses</h3>
                {hasRole(["admin", "dispatcher", "driver"]) &&
                  booking.status !== "booked" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowExpenseModal(true)}
                    >
                      <Icon name="plus" className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  )}
              </div>
            </CardHeader>
            <CardContent>
              {booking.expenses.length === 0 ? (
                <p className="text-gray-500">No expenses recorded</p>
              ) : (
                <div className="space-y-3">
                  {booking.expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="font-medium capitalize">{expense.type}</p>
                        <p className="text-sm text-gray-600">
                          {expense.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <p className="font-medium mr-2">
                          ₹{expense.amount.toLocaleString()}
                        </p>
                        {hasRole(["admin", "dispatcher"]) && (
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-300">|</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="p-1 border-0"
                              aria-label="Edit expense"
                              onClick={() => {
                                setEditingExpense(expense);
                                resetExpense({
                                  type: expense.type as ExpenseForm["type"],
                                  amount: String(expense.amount),
                                  description: expense.description,
                                });
                                setShowExpenseModal(true);
                              }}
                            >
                              <Icon name="edit" className="h-4 w-4" />
                            </Button>
                            <span className="text-gray-300">|</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="p-1 border-0"
                              aria-label="Delete expense"
                              onClick={() => onDeleteExpense(expense.id)}
                            >
                              <Icon name="delete" className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex justify-between items-center font-medium">
                    <span>Total Expenses</span>
                    <span>₹{totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Payments</h3>
                {hasRole(["admin", "accountant", "dispatcher"]) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    <Icon name="plus" className="h-4 w-4 mr-1" /> Add Payment
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!booking.payments || booking.payments.length === 0 ? (
                <p className="text-gray-500">No payments recorded</p>
              ) : (
                <div className="space-y-3">
                  {booking.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">
                          ₹{p.amount.toLocaleString()}
                        </p>
                        {p.comments && (
                          <p className="text-gray-600 truncate">{p.comments}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-xs text-gray-500 mr-1">
                          {p.collectedBy && <p>Collected by: {p.collectedBy}</p>}
                          <p>Paid on: {p.paidOn}</p>
                        </div>
                        {hasRole(["admin", "accountant", "dispatcher"]) && (
                          <>
                            <span className="text-gray-300">|</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="p-1 border-0"
                              aria-label="Edit payment"
                              onClick={() => {
                                setEditingPayment(p as any);
                                setShowPaymentModal(true);
                                setValuePayment('amount', String(p.amount));
                                setValuePayment('comments', p.comments || '');
                                setValuePayment('collectedBy', p.collectedBy || '');
                                // paidOn comes as ISO string; keep just date for input
                                const d = (p.paidOn || '').slice(0, 10);
                                setValuePayment('paidOn', d);
                              }}
                            >
                              <Icon name="edit" className="h-4 w-4" />
                            </Button>
                            <span className="text-gray-300">|</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="p-1 border-0"
                              aria-label="Delete payment"
                              onClick={() => onDeletePayment(p.id)}
                            >
                              <Icon name="delete" className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Driver Payments */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Driver Payments
                </h3>
                <div className="flex items-center space-x-2">
                  {driver && hasRole(["admin", "accountant", "dispatcher"]) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingDriverPayment(null);
                        resetDriverPay({ mode: "per-trip" });
                        setShowDriverPaymentModal(true);
                      }}
                    >
                      <Icon name="plus" className="h-4 w-4 mr-1" /> Add
                    </Button>
                  )}
                  {driverPayments.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onExportDriverPayments}
                      disabled={exporting}
                    >
                      <Icon name="download" className="h-4 w-4 mr-1" />{" "}
                      {exporting ? "Exporting..." : "Export"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!driver && (
                <p className="text-gray-500 text-sm">No driver assigned.</p>
              )}
              {driver && driverPayments.length === 0 && (
                <p className="text-gray-500">No driver payments recorded</p>
              )}
              {driver && driverPayments.length > 0 && (
                <div className="space-y-3">
                  {/* Show finalPaid as a special payment entry */}
                  {/* {(booking.finalPaid ?? 0) > 0 && (
                    
                    <div
                      className="p-3 bg-green-50 border border-green-200 rounded text-sm space-y-1"
                    >
                     
                      {hasRole(["admin", "accountant", "dispatcher"]) && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Set editing state for finalPaid
                              setEditingDriverPayment({
                                id: 'finalPaid',
                                amount: booking.finalPaid || 0,
                                mode: 'per-trip',
                                date: new Date().toISOString(),
                                type: 'paid',
                                description: 'Final settlement payment',
                                bookingId: booking.id,
                                driverId: booking.driverId || '',
                                settled: true,
                                settledAt: new Date().toISOString()
                              } as DriverPayment);
                              resetDriverPay({ 
                                mode: "per-trip",
                                amount: String(booking.finalPaid || 0),
                                description: 'Final settlement payment'
                              });
                              setShowDriverPaymentModal(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (!confirm("Delete final payment?")) return;
                              try {
                                // Update booking to remove finalPaid
                                updateBooking(booking.id, { finalPaid: 0 });
                                toast.success("Final payment removed");
                              } catch {
                                toast.error("Delete failed");
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                     
                      )}
                    </div>
                  )} */}
                  
                  {driverPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-gray-50 rounded text-sm space-y-1"
                    >
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <p className="font-medium">
                            ₹{p.amount.toLocaleString()}{" "}
                            <span className="text-xs text-gray-500">
                              ({p.mode})
                            </span>{" "}
                            {p.settled && (
                              <Badge
                                variant="completed"
                                className="ml-1 text-[10px]"
                              >
                                Settled
                              </Badge>
                            )}
                          </p>
                          {p.description && (
                            <p className="text-gray-600 truncate">
                              {p.description}
                            </p>
                          )}
                          {p.mode === "fuel-basis" && (
                            <p className="text-xs text-gray-500">
                              Fuel: {Math.round((p.fuelQuantity || 0) * 100) / 100}L @ ₹{p.fuelRate} = ₹
                              {Math.round((p.computedAmount || 0) * 100) / 100}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>{new Date(p.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {hasRole(["admin", "accountant", "dispatcher"]) && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {!p.settled && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const updated =
                                    await bookingAPI.updateDriverPayment(
                                      booking.id,
                                      p.id,
                                      { settle: true }
                                    );
                                  setDriverPayments((cur) =>
                                    cur.map((dp) =>
                                      dp.id === p.id ? updated : dp
                                    )
                                  );
                                  toast.success("Settled");
                                } catch {
                                  toast.error("Settle failed");
                                }
                              }}
                            >
                              Settle
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditDriverPayment(p)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (!confirm("Delete driver payment?")) return;
                              try {
                                await bookingAPI.deleteDriverPayment(
                                  booking.id,
                                  p.id
                                );
                                setDriverPayments((cur) =>
                                  cur.filter((dp) => dp.id !== p.id)
                                );
                                toast.success("Deleted");
                              } catch {
                                toast.error("Delete failed");
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-medium text-sm">
                    <span>Total Driver Paid</span>
                    <span>₹{totalDriverPayments.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">
                Status History
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {booking.statusHistory.map((history) => (
                  <div key={history.id} className="flex items-center space-x-3">
                    <Icon name="clock" className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            history.status as
                              | "booked"
                              | "ongoing"
                              | "completed"
                              | "yet-to-start"
                              | "canceled"
                          }
                          className="text-xs"
                        >
                          {history.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          by {history.changedBy}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {format(parseISO(history.timestamp), "PPP p")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">
                Financial Summary
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-medium">
                  ₹{booking.totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Advance</span>
                <span className="font-medium">
                  ₹{booking.advanceReceived.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payments</span>
                <span className="font-medium">
                  ₹{totalPayments.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expenses</span>
                <span className="font-medium">
                  ₹{totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Balance</span>
                <span>₹{(booking.balance - totalPayments).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Billing Status</span>
                <Badge variant={booking.billed ? "completed" : "pending"}>
                  {booking.billed ? "Billed" : "Not Billed"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Actions</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasRole(["admin", "dispatcher", "driver"]) && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowStatusModal(true)}
                >
                  Update Status
                </Button>
              )}

              {hasRole(["admin", "accountant"]) && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={toggleBilled}
                >
                  Mark as {booking.billed ? "Not Billed" : "Billed"}
                </Button>
              )}

              {hasRole(["admin", "accountant"]) && (
                <div className="flex items-center justify-between w-full">
                  <label
                    htmlFor="Dutyslip-toggle"
                    className="text-sm font-medium"
                  >
                    Dutyslip not submitted.
                  </label>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="Dutyslip-toggle"
                      checked={booking.dutySlipSubmitted}
                      onChange={toggleDutySlipStatus}
                      className="sr-only peer"
                    />
                    <div
                      className="w-16 h-8 flex items-center justify-between px-1 rounded-full 
                   bg-gray-300 peer-checked:bg-amber-500 transition-all duration-300"
                    >
                      <span
                        className={`text-sm font-semibold text-white transition-all duration-200 
                     ${
                       booking.dutySlipSubmitted ? "opacity-100" : "opacity-0"
                     }`}
                      >
                        YES
                      </span>
                      <span
                        className={`text-sm font-semibold text-white transition-all duration-200 
                     ${
                       booking.dutySlipSubmitted ? "opacity-0" : "opacity-100"
                     }`}
                      >
                        NO
                      </span>
                    </div>
                    <span
                      className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full 
                   transition-transform duration-300 peer-checked:translate-x-8"
                    ></span>
                  </label>
                </div>
              )}

              {hasRole(["admin", "accountant"]) && (
                <div className="flex items-center justify-between w-full">
                  <label
                    htmlFor="DutyslipCompany-toggle"
                    className="text-sm font-medium"
                  >
                    Dutyslip submitted to company
                  </label>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="DutyslipCompany-toggle"
                      checked={booking.dutySlipSubmittedToCompany}
                      onChange={toggleDutySlipToCompanyStatus}
                      className="sr-only peer"
                    />
                    <div
                      className="w-16 h-8 flex items-center justify-between px-1 rounded-full 
                   bg-gray-300 peer-checked:bg-amber-500 transition-all duration-300"
                    >
                      <span
                        className={`text-sm font-semibold text-white transition-all duration-200 
                     ${
                       booking.dutySlipSubmittedToCompany
                         ? "opacity-100"
                         : "opacity-0"
                     }`}
                      >
                        YES
                      </span>
                      <span
                        className={`text-sm font-semibold text-white transition-all duration-200 
                     ${
                       booking.dutySlipSubmittedToCompany
                         ? "opacity-0"
                         : "opacity-100"
                     }`}
                      >
                        NO
                      </span>
                    </div>
                    <span
                      className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full 
                   transition-transform duration-300 peer-checked:translate-x-8"
                    ></span>
                  </label>
                </div>
              )}

              {booking.status === "completed" && (
                <div className="space-y-2">
                  <label className="w-full flex items-center justify-center px-3 py-2 border border-dashed border-amber-400 rounded-md text-sm cursor-pointer hover:bg-amber-50 transition">
                    <Icon
                      name="upload"
                      className="h-4 w-4 mr-2 text-amber-600"
                    />
                    {uploading ? "Uploading..." : "Upload Duty Slip(s)"}
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={onDutySlipUpload}
                      className="hidden"
                    />
                  </label>
                  {booking.dutySlips && booking.dutySlips.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-auto">
                      {booking.dutySlips.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-xs"
                        >
                          <div className="truncate">
                            <span className="font-medium text-gray-700">
                              {file.name}
                            </span>
                            <span className="ml-2 text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          <button
                            onClick={() => removeDutySlip(file.id)}
                            aria-label="Remove file"
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Icon name="close" className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expense Modal */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? "Edit Expense" : "Add Expense"}
      >
        <form
          onSubmit={handleExpenseSubmit(onAddExpense)}
          className="space-y-4"
        >
          <Select
            {...registerExpense("type", {
              required: "Expense type is required",
            })}
            label="Expense Type"
            error={expenseErrors.type?.message as string}
            options={[
              { value: "toll", label: "Toll" },
              { value: "parking", label: "Parking" },
              { value: "night", label: "Night" },
              { value: "perday", label: "Perday" },
              { value: "rent", label: "Rent" },
              { value: "other", label: "Other" },
            ]}
          />

          <Input
            {...registerExpense("amount", { required: "Amount is required" })}
            type="number"
            step="0.01"
            label="Amount"
            error={expenseErrors.amount?.message as string}
            placeholder="0.00"
          />

          <Input
            {...registerExpense("description", {
              required: "Description is required",
            })}
            label="Description"
            error={expenseErrors.description?.message as string}
            placeholder="Enter expense description"
          />

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowExpenseModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{editingExpense ? "Save" : "Add Expense"}</Button>
          </div>
        </form>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Status"
      >
        <form
          onSubmit={handleStatusSubmit(onUpdateStatus)}
          className="space-y-4"
        >
          <Select
            {...registerStatus("status", { required: "Status is required" })}
            label="New Status"
            error={statusErrors.status?.message as string}
            options={[
              { value: "booked", label: "Booked" },
              // { value: 'yet-to-start', label: 'Yet to Start' },
              { value: "ongoing", label: "Ongoing" },
              { value: "completed", label: "Completed" },
              { value: "canceled", label: "Canceled" },
            ]}
          />

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowStatusModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Update Status</Button>
          </div>
        </form>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setEditingPayment(null); }}
        title={editingPayment ? 'Edit Payment' : 'Add Payment'}
      >
        <form
          onSubmit={handlePaymentSubmit(onAddPayment)}
          className="space-y-4"
        >
          <Input
            {...registerPayment("amount", { required: "Amount is required" })}
            type="number"
            step="0.01"
            label="Amount"
            error={paymentErrors.amount?.message as string}
            placeholder="0.00"
          />
          <Input
            {...registerPayment("comments")}
            label="Comments"
            placeholder="Optional notes"
          />
          <Input
            {...registerPayment("collectedBy")}
            label="Collected By"
            placeholder="Staff name"
          />
          <Input
            {...registerPayment("paidOn", { required: "Paid On is required" })}
            type="date"
            label="Paid On"
            error={paymentErrors.paidOn?.message as string}
          />

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{editingPayment ? 'Save' : 'Add Payment'}</Button>
          </div>
        </form>
      </Modal>

      {/* Add Driver Payment Modal */}
      <Modal
        isOpen={showDriverPaymentModal}
        onClose={() => setShowDriverPaymentModal(false)}
        title={
          editingDriverPayment 
            ? (editingDriverPayment.id === 'finalPaid' ? "Edit Final Payment" : "Edit Driver Payment")
            : "Add Driver Payment"
        }
      >
        <form
          onSubmit={handleDriverPaySubmit(async (data) => {
            console.log('Form submitted with data:', data);
            if (!booking || !driver) return;
            try {
              if (editingDriverPayment) {
                // Handle finalPaid editing
                if (editingDriverPayment.id === 'finalPaid') {
                  const newAmount = parseFloat(data.amount || "0");
                  updateBooking(booking.id, { finalPaid: newAmount });
                  toast.success("Final payment updated");
                } else {
                  const upd: {
                    mode: "per-trip" | "daily" | "fuel-basis";
                    description?: string;
                    amount?: number;
                    fuelQuantity?: number;
                    fuelRate?: number;
                    distanceKm?: number;
                    mileage?: number;
                  } = { mode: data.mode, description: data.description };
                  if (data.mode === "fuel-basis") {
                    if (
                      data.distanceKm &&
                      data.mileage &&
                      parseFloat(data.mileage) > 0
                    ) {
                      upd.distanceKm = parseFloat(data.distanceKm);
                      upd.mileage = parseFloat(data.mileage);
                      // Let backend derive fuelQuantity; we don't send explicit unless user manually entered without distance
                    }
                    if (!upd.distanceKm && data.fuelQuantity) {
                      upd.fuelQuantity = parseFloat(data.fuelQuantity || "0");
                    }
                    if (data.fuelRate)
                      upd.fuelRate = parseFloat(data.fuelRate || "0");
                  } else {
                    upd.amount = parseFloat(data.amount || "0");
                  }
                  const updated = await bookingAPI.updateDriverPayment(
                    booking.id,
                    editingDriverPayment.id,
                    upd
                  );
                  setDriverPayments((cur) =>
                    cur.map((p) =>
                      p.id === editingDriverPayment.id ? updated : p
                    )
                  );
                  toast.success("Driver payment updated");
                }
              } else {
                const payload: {
                  driverId: string;
                  mode: "per-trip" | "daily" | "fuel-basis";
                  description?: string;
                  amount?: number;
                  fuelQuantity?: number;
                  fuelRate?: number;
                  distanceKm?: number;
                  mileage?: number;
                } = {
                  driverId: driver.id,
                  mode: data.mode,
                  description: data.description,
                };
                if (data.mode === "fuel-basis") {
                  if (
                    data.distanceKm &&
                    data.mileage &&
                    parseFloat(data.mileage) > 0
                  ) {
                    payload.distanceKm = parseFloat(data.distanceKm);
                    payload.mileage = parseFloat(data.mileage);
                    // Derived path; don't set fuelQuantity explicitly
                  }
                  if (!payload.distanceKm && data.fuelQuantity) {
                    payload.fuelQuantity = parseFloat(data.fuelQuantity || "0");
                  }
                  if (data.fuelRate)
                    payload.fuelRate = parseFloat(data.fuelRate || "0");
                  
                  // For fuel-basis, we need to ensure fuelQuantity is calculated
                  if (payload.distanceKm && payload.mileage && payload.mileage > 0) {
                    payload.fuelQuantity = Math.round((payload.distanceKm / payload.mileage) * 100) / 100;
                  }
                  
                  // Calculate amount for fuel-basis
                  if (payload.fuelQuantity && payload.fuelRate) {
                    payload.amount = Math.round((payload.fuelQuantity * payload.fuelRate) * 100) / 100;
                    console.log('Fuel-basis calculation:', {
                      fuelQuantity: payload.fuelQuantity,
                      fuelRate: payload.fuelRate,
                      calculatedAmount: payload.amount
                    });
                  }
                } else {
                  payload.amount = parseFloat(data.amount || "0");
                }
                console.log('Final payload before API call:', payload);
                const created = await bookingAPI.addDriverPayment(
                  booking.id,
                  payload
                );
                console.log('Created driver payment response:', created);
                setDriverPayments([
                  created as DriverPayment,
                  ...driverPayments,
                ]);
                toast.success("Driver payment added");
              }
              resetDriverPay();
              setEditingDriverPayment(null);
              setShowDriverPaymentModal(false);
            } catch {
              toast.error("Failed to add driver payment");
            }
          })}
          className="space-y-4"
        >
          <Select
            {...registerDriverPay("mode", { required: "Mode required" })}
            label="Payment Mode"
            error={driverPayErrors.mode?.message as string}
            options={[
              { value: "per-trip", label: "Per Trip" },
              { value: "daily", label: "Daily" },
              { value: "fuel-basis", label: "Fuel Basis" },
            ]}
          />
          {watchMode !== "fuel-basis" && (
            <Input
              {...registerDriverPay("amount", { required: "Amount required" })}
              type="number"
              step="0.01"
              label="Amount"
              error={driverPayErrors.amount?.message as string}
              placeholder="0.00"
            />
          )}
          {watchMode === "fuel-basis" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  {...registerDriverPay("distanceKm", {
                    min: { value: 0.1, message: "Distance must be greater than 0" }
                  })}
                  type="number"
                  step="0.1"
                  label="Distance (km)"
                  placeholder="0"
                />
                <Input
                  {...registerDriverPay("mileage", {
                    min: { value: 0.1, message: "Mileage must be greater than 0" }
                  })}
                  type="number"
                  step="0.1"
                  label="Mileage (km/L)"
                  placeholder="0"
                />
                {derivedFuelQty === undefined && (
                  <Input
                    {...registerDriverPay("fuelQuantity")}
                    type="number"
                    step="0.01"
                    label="Fuel Litres"
                    placeholder="0"
                  />
                )}
                <Input
                  {...registerDriverPay("fuelRate", {
                    required: "Rate required",
                    min: { value: 0.01, message: "Rate must be greater than 0" }
                  })}
                  type="number"
                  step="0.01"
                  label="Fuel Rate (₹/L)"
                  error={driverPayErrors.fuelRate?.message as string}
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Litres (Auto)
                  </label>
                  <div className="px-3 py-2 border rounded bg-gray-50 text-gray-700">
                    {derivedFuelQty !== undefined
                      ? Math.round(derivedFuelQty * 100) / 100
                      : watchFuelQty || "0"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Computed Amount
                  </label>
                  <div className="px-3 py-2 border rounded bg-gray-50 text-gray-700">
                    ₹{Math.round(computedFuelAmount * 100) / 100}
                  </div>
                </div>
              </div>
            </div>
          )}
          <Input
            {...registerDriverPay("description")}
            label="Description"
            placeholder="Optional"
          />
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDriverPaymentModal(false);
                setEditingDriverPayment(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingDriverPayment ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
