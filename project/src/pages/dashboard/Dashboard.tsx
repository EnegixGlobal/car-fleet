import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { format, isBefore, addDays, parseISO } from 'date-fns';
import type { Booking, Driver, Vehicle, Company } from '../../types';

export const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { bookings, drivers, vehicles, companies, customers } = useApp();
  const [currentDay, setCurrentDay] = React.useState<string>(() => format(new Date(), 'yyyy-MM-dd'));

  // Tick current day periodically so sections auto-refresh across midnight
  React.useEffect(() => {
    const interval = setInterval(() => {
      const today = format(new Date(), 'yyyy-MM-dd');
      setCurrentDay(prev => (prev !== today ? today : prev));
    }, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, []);

  // If current user is a driver, resolve driver entity (match by name for demo)
  const currentDriver =
    user?.role === 'driver'
      ? drivers.find((d: Driver) => d.id === user.driverId) ||
        drivers.find(
          (d: Driver) => d.name?.trim().toLowerCase() === user.name?.trim().toLowerCase()
        )
      : undefined;

  const activeDriverId = user?.role === 'driver' ? user.driverId || currentDriver?.id : undefined;

  // Helper to decide if a booking belongs to current user (if driver)
  const bookingBelongsToCurrentDriver = (driverId?: string) => {
    if (user?.role !== 'driver') return true;
    if (!activeDriverId) return false;
    return driverId === activeDriverId;
  };

  // Calculate metrics
  const todayBookings = bookings.filter((booking: Booking) => {
    const bookingDate = parseISO(booking.startDate);
    return format(bookingDate, 'yyyy-MM-dd') === currentDay && bookingBelongsToCurrentDriver(booking.driverId);
  });

  const ongoingTrips = bookings.filter((booking: Booking) => booking.status === 'ongoing' && bookingBelongsToCurrentDriver(booking.driverId));
  const completedToday = bookings.filter((booking: Booking) => 
    booking.status === 'completed' && 
  format(parseISO(booking.startDate), 'yyyy-MM-dd') === currentDay &&
    bookingBelongsToCurrentDriver(booking.driverId)
  );

  const upcomingTrips = bookings
    .filter((booking: Booking) => {
      const bookingDate = parseISO(booking.startDate);
      const bookingDay = format(bookingDate, 'yyyy-MM-dd');
      return bookingDay > currentDay && bookingBelongsToCurrentDriver(booking.driverId);
    })
    .sort((a: Booking, b: Booking) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Calculate expiry alerts
  const getExpiryAlerts = () => {
    const alerts: Array<{type: string, item: string, expiry: string}> = [];
    const thirtyDaysFromNow = addDays(new Date(), 30);

    // Check driver documents (only current driver if role is driver)
  const driverList: Driver[] =
    user?.role === 'driver' ? (currentDriver ? [currentDriver] : []) : drivers;
  driverList.forEach((driver: Driver) => {
      const licenseExpiry = parseISO(driver.licenseExpiry);
      const policeExpiry = parseISO(driver.policeVerificationExpiry);

      if (isBefore(licenseExpiry, thirtyDaysFromNow)) {
        alerts.push({
          type: 'License',
          item: driver.name,
          expiry: driver.licenseExpiry
        });
      }

      if (isBefore(policeExpiry, thirtyDaysFromNow)) {
        alerts.push({
          type: 'Police Verification',
          item: driver.name,
          expiry: driver.policeVerificationExpiry
        });
      }
    });

    // Check vehicle documents
  // Vehicles: for driver role we only show vehicles that appear in their trips today / ongoing
  const relevantVehicleIds =
    user?.role === 'driver' && activeDriverId
      ? Array.from(
          new Set(
            bookings
              .filter((b: Booking) => b.driverId === activeDriverId)
              .map((b: Booking) => b.vehicleId)
              .filter(Boolean) as string[]
          )
        )
      : vehicles.map((v: Vehicle) => v.id);
  vehicles.filter((v: Vehicle) => relevantVehicleIds.includes(v.id)).forEach((vehicle: Vehicle) => {
      const insurance = parseISO(vehicle.insuranceExpiry);
      const fitness = parseISO(vehicle.fitnessExpiry);
      const permit = parseISO(vehicle.permitExpiry);
      const pollution = parseISO(vehicle.pollutionExpiry);

      if (isBefore(insurance, thirtyDaysFromNow)) {
        alerts.push({
          type: 'Insurance',
          item: vehicle.registrationNumber,
          expiry: vehicle.insuranceExpiry
        });
      }

      if (isBefore(fitness, thirtyDaysFromNow)) {
        alerts.push({
          type: 'Fitness',
          item: vehicle.registrationNumber,
          expiry: vehicle.fitnessExpiry
        });
      }

      if (isBefore(permit, thirtyDaysFromNow)) {
        alerts.push({
          type: 'Permit',
          item: vehicle.registrationNumber,
          expiry: vehicle.permitExpiry
        });
      }

      if (isBefore(pollution, thirtyDaysFromNow)) {
        alerts.push({
          type: 'Pollution',
          item: vehicle.registrationNumber,
          expiry: vehicle.pollutionExpiry
        });
      }
    });

    return alerts;
  };

  const expiryAlerts = getExpiryAlerts();

  // Calculate financial metrics
  const totalRevenue = bookings.reduce((sum: number, booking: Booking) => sum + booking.totalAmount, 0);
  const totalOutstanding = companies.reduce((sum: number, company: Company) => sum + company.outstandingAmount, 0);
  const unbilledAmount = bookings
  .filter((booking: Booking) => !booking.billed && booking.status === 'completed')
  .reduce((sum: number, booking: Booking) => sum + booking.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.name}
        </h1>
        <div className="text-sm text-gray-500">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Icon name="calendar" className="h-8 w-8 text-amber-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today's Trips</p>
                <p className="text-2xl font-bold text-gray-900">{todayBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Icon name="clock" className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ongoing Trips</p>
                <p className="text-2xl font-bold text-gray-900">{ongoingTrips.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Icon name="success" className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">{completedToday.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Icon name="warning" className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Expiry Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{expiryAlerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Extra Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Icon name="car" className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Icon name="user" className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Icon name="building" className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{(customers?.length) ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Trips */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Today's Trips</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {todayBookings.length === 0 ? (
                <p className="text-gray-500">No trips scheduled for today</p>
              ) : (
                todayBookings.map((booking: Booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{booking.customerName}</p>
                      <p className="text-sm text-gray-500">
                        {booking.pickupLocation} → {booking.dropLocation}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(parseISO(booking.startDate), 'h:mm a')}
                      </p>
                    </div>
                    <Badge variant={booking.status}>
                      {booking.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Alerts */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Compliance Alerts</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {expiryAlerts.length === 0 ? (
                <p className="text-gray-500">All documents are up to date</p>
              ) : (
                expiryAlerts.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-orange-900">{alert.type} Expiring</p>
                      <p className="text-sm text-orange-700">{alert.item}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-900">
                        {format(parseISO(alert.expiry), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Trips */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Upcoming Trips</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {upcomingTrips.length === 0 ? (
                <p className="text-gray-500">No upcoming trips</p>
              ) : (
                upcomingTrips.map((booking: Booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{booking.customerName}</p>
                      <p className="text-sm text-gray-500">
                        {booking.pickupLocation} → {booking.dropLocation}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(parseISO(booking.startDate), 'PPP p')}
                      </p>
                    </div>
                    <Badge variant={booking.status}>
                      {booking.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview - Only for Admin and Accountant */}
      {hasRole(['admin', 'accountant']) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Icon name="money" className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Icon name="warning" className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Outstanding Payments</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalOutstanding.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Icon name="chart" className="h-8 w-8 text-amber-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Unbilled Amount</p>
                  <p className="text-2xl font-bold text-gray-900">₹{unbilledAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

  {/* Fleet Overview - For Admin and Dispatcher (not for driver) */}
  {hasRole(['admin', 'dispatcher']) && user?.role !== 'driver' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Fleet Status</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Icon name="car" className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Active Vehicles</span>
                  </div>
                  <span className="font-medium">{vehicles.filter((v: Vehicle) => v.status === 'active').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Icon name="user" className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Active Drivers</span>
                  </div>
                  <span className="font-medium">{drivers.filter((d: Driver) => d.status === 'active').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Vehicle Categories</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['sedan', 'SUV', 'bus', 'mini-bus'].map(category => {
                  const count = vehicles.filter(v => v.category === category).length;
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{category}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};