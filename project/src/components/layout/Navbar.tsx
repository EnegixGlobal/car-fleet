import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, addDays, isBefore, differenceInDays, isToday, isPast } from 'date-fns';
import { Vehicle } from '../../types';

interface NavbarProps {
  onSidebarToggle: () => void;
}

interface Notification {
  id: string;
  type: 'trip' | 'alert' | 'booking' | 'document' | 'payment' | 'company';
  message: string;
  time: string;
  target?: string;
  timestamp: number;
  read: boolean;
}

const NOTIFICATIONS_STORAGE_KEY = 'dashboard_notifications_read';

export const Navbar: React.FC<NavbarProps> = ({ onSidebarToggle }) => {
  const { user } = useAuth();
  const { bookings, drivers, vehicles, companies } = useApp();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement | null>(null);
  
  const currentDriver =
    user?.role === 'driver'
      ? drivers.find(d => d.id === user.driverId) ||
        drivers.find(d => d.name?.trim()?.toLowerCase() === user.name?.trim()?.toLowerCase())
      : undefined;

  // Load read notifications from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (stored) {
      try {
        const readIds = JSON.parse(stored) as string[];
        setReadNotifications(new Set(readIds));
      } catch {
        setReadNotifications(new Set());
      }
    }
  }, []);

  // Save read notifications to localStorage
  const markAsRead = (notificationId: string) => {
    setReadNotifications(prev => {
      const updated = new Set(prev);
      updated.add(notificationId);
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(Array.from(updated)));
      return updated;
    });
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(new Set(allIds));
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(allIds));
  };

  // Build notifications based on role
  const notifications = useMemo((): Notification[] => {
    const notifs: Notification[] = [];
    const now = new Date();
    const soon = addDays(now, 30);

    if (user?.role === 'driver') {
      // Driver notifications
      const activeDriverId = user.driverId || currentDriver?.id;
      if (activeDriverId) {
        const todayKey = format(now, 'yyyy-MM-dd');
        const todaysTrips = bookings.filter(
          b => b.driverId === activeDriverId && format(parseISO(b.startDate), 'yyyy-MM-dd') === todayKey
        );
        notifs.push(
          ...todaysTrips.map(b => ({
            id: 'trip-' + b.id,
            type: 'trip' as const,
            message: `${b.status === 'completed' ? 'Completed' : b.status === 'ongoing' ? 'Ongoing' : 'Upcoming'} trip: ${b.pickupLocation} → ${b.dropLocation}`,
            time: format(parseISO(b.startDate), 'h:mm a'),
            target: `/bookings/${b.id}`,
            timestamp: parseISO(b.startDate).getTime(),
            read: false
          }))
        );
      }
      if (currentDriver) {
        // Document expiry alerts
        const licenseExpiry = parseISO(currentDriver.licenseExpiry);
        if (isBefore(licenseExpiry, soon)) {
          const daysLeft = differenceInDays(licenseExpiry, now);
          notifs.push({
            id: 'license-exp-' + currentDriver.id,
            type: 'document',
            message: `License expiring ${daysLeft <= 7 ? 'soon' : 'in ' + daysLeft + ' days'} (${format(licenseExpiry, 'MMM d, yyyy')})`,
            time: daysLeft <= 7 ? 'urgent' : 'warning',
            timestamp: licenseExpiry.getTime(),
            read: false
          });
        }
        const policeExpiry = parseISO(currentDriver.policeVerificationExpiry);
        if (isBefore(policeExpiry, soon)) {
          const daysLeft = differenceInDays(policeExpiry, now);
          notifs.push({
            id: 'police-exp-' + currentDriver.id,
            type: 'document',
            message: `Police verification expiring ${daysLeft <= 7 ? 'soon' : 'in ' + daysLeft + ' days'} (${format(policeExpiry, 'MMM d, yyyy')})`,
            time: daysLeft <= 7 ? 'urgent' : 'warning',
            timestamp: policeExpiry.getTime(),
            read: false
          });
        }
      }
    } else {
      // Admin/Dispatcher notifications
      
      // New bookings today
      const todayBookings = bookings.filter(b => {
        const bookingDate = parseISO(b.startDate);
        return isToday(bookingDate) && b.status !== 'completed' && b.status !== 'canceled';
      });
      if (todayBookings.length > 0) {
        notifs.push({
          id: 'new-bookings-today',
          type: 'booking',
          message: `${todayBookings.length} ${todayBookings.length === 1 ? 'booking' : 'bookings'} scheduled today`,
          time: 'today',
          target: '/bookings',
          timestamp: now.getTime(),
          read: false
        });
      }

      // Upcoming bookings (next 3 days)
      const upcomingBookings = bookings.filter(b => {
        const bookingDate = parseISO(b.startDate);
        const daysDiff = differenceInDays(bookingDate, now);
        return daysDiff > 0 && daysDiff <= 3 && (b.status === 'booked' || b.status === 'yet-to-start');
      });
      if (upcomingBookings.length > 0) {
        notifs.push({
          id: 'upcoming-bookings',
          type: 'booking',
          message: `${upcomingBookings.length} ${upcomingBookings.length === 1 ? 'booking' : 'bookings'} coming up in next 3 days`,
          time: 'upcoming',
          target: '/bookings',
          timestamp: now.getTime(),
          read: false
        });
      }

      // Vehicle document expiry alerts
      const expiringVehicles: { vehicle: Vehicle; type: string; expiry: Date }[] = [];
      vehicles.forEach(vehicle => {
        const checks: Array<{ field: keyof Vehicle; label: string }> = [
          { field: 'insuranceExpiry', label: 'Insurance' },
          { field: 'fitnessExpiry', label: 'Fitness' },
          { field: 'permitExpiry', label: 'Permit' },
          { field: 'pollutionExpiry', label: 'Pollution' }
        ];
        checks.forEach(({ field, label }) => {
          const expiryStr = vehicle[field];
          if (typeof expiryStr === 'string') {
            try {
              const expiryDate = parseISO(expiryStr);
              if (!isNaN(expiryDate.getTime()) && isBefore(expiryDate, soon)) {
                expiringVehicles.push({ vehicle, type: label, expiry: expiryDate });
              }
            } catch {
              // Skip invalid dates
            }
          }
        });
      });
      if (expiringVehicles.length > 0) {
        const urgent = expiringVehicles.filter(v => differenceInDays(v.expiry, now) <= 7);
        if (urgent.length > 0) {
          notifs.push({
            id: 'urgent-vehicle-docs',
            type: 'alert',
            message: `${urgent.length} vehicle ${urgent.length === 1 ? 'document' : 'documents'} expiring within 7 days`,
            time: 'urgent',
            target: '/vehicles',
            timestamp: now.getTime(),
            read: false
          });
        } else {
          notifs.push({
            id: 'vehicle-docs-expiring',
            type: 'alert',
            message: `${expiringVehicles.length} vehicle ${expiringVehicles.length === 1 ? 'document' : 'documents'} expiring soon`,
            time: 'warning',
            target: '/vehicles',
            timestamp: now.getTime(),
            read: false
          });
        }
      }

      // Driver document expiry alerts
      const expiringDrivers: { driver: typeof drivers[0]; type: string; expiry: Date }[] = [];
      drivers.forEach(driver => {
        const licenseExpiry = parseISO(driver.licenseExpiry);
        if (isBefore(licenseExpiry, soon)) {
          expiringDrivers.push({ driver, type: 'License', expiry: licenseExpiry });
        }
        const policeExpiry = parseISO(driver.policeVerificationExpiry);
        if (isBefore(policeExpiry, soon)) {
          expiringDrivers.push({ driver, type: 'Police Verification', expiry: policeExpiry });
        }
      });
      if (expiringDrivers.length > 0) {
        const urgent = expiringDrivers.filter(d => differenceInDays(d.expiry, now) <= 7);
        if (urgent.length > 0) {
          notifs.push({
            id: 'urgent-driver-docs',
            type: 'alert',
            message: `${urgent.length} driver ${urgent.length === 1 ? 'document' : 'documents'} expiring within 7 days`,
            time: 'urgent',
            target: '/drivers',
            timestamp: now.getTime(),
            read: false
          });
        } else {
          notifs.push({
            id: 'driver-docs-expiring',
            type: 'alert',
            message: `${expiringDrivers.length} driver ${expiringDrivers.length === 1 ? 'document' : 'documents'} expiring soon`,
            time: 'warning',
            target: '/drivers',
            timestamp: now.getTime(),
            read: false
          });
        }
      }

      // Companies with outstanding amounts
      const companiesWithDues = companies.filter(c => c.outstandingAmount > 0);
      if (companiesWithDues.length > 0) {
        const totalOutstanding = companiesWithDues.reduce((sum, c) => sum + c.outstandingAmount, 0);
        notifs.push({
          id: 'outstanding-payments',
          type: 'company',
          message: `${companiesWithDues.length} ${companiesWithDues.length === 1 ? 'company' : 'companies'} with outstanding payments (₹${totalOutstanding.toLocaleString()})`,
          time: 'pending',
          target: '/companies',
          timestamp: now.getTime(),
          read: false
        });
      }

      // Overdue bookings (past end date but not completed)
      const overdueBookings = bookings.filter(b => {
        const endDate = parseISO(b.endDate);
        return isPast(endDate) && b.status !== 'completed' && b.status !== 'canceled';
      });
      if (overdueBookings.length > 0) {
        notifs.push({
          id: 'overdue-bookings',
          type: 'alert',
          message: `${overdueBookings.length} ${overdueBookings.length === 1 ? 'booking' : 'bookings'} overdue`,
          time: 'overdue',
          target: '/bookings',
          timestamp: now.getTime(),
          read: false
        });
      }
    }

    // Sort by timestamp (newest first) and mark read status
    return notifs
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(n => ({ ...n, read: readNotifications.has(n.id) }));
  }, [user, bookings, drivers, vehicles, companies, currentDriver, readNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Auto-refresh notifications every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render by updating readNotifications (triggers useMemo recalculation)
      setReadNotifications(prev => new Set(prev));
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              type="button"
              onClick={onSidebarToggle}
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500"
            >
              <Icon name="menu" className="h-6 w-6" />
            </button>
            
            <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-start">
              <div className="max-w-lg w-full lg:max-w-xs">
                <label htmlFor="search" className="sr-only">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="search" className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                    placeholder="Search bookings, drivers..."
                    type="search"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4" ref={notifRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(v => !v)}
                aria-label="Toggle notifications"
                title="Notifications"
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 relative"
              >
                <Icon name="bell" className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-2 max-h-96 overflow-y-auto">
                    <div className="px-4 pb-2 flex items-center justify-between border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Notifications {unreadCount > 0 && <span className="text-red-500">({unreadCount})</span>}
                      </h4>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-amber-600 hover:underline"
                            title="Mark all as read"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                    {notifications.map(n => {
                      const clickable = Boolean(n.target);
                      const isUrgent = n.time === 'urgent' || n.time === 'overdue';
                      return (
                        <button
                          key={n.id}
                          onClick={() => {
                            if (n.target) {
                              navigate(n.target);
                              setShowNotifications(false);
                            }
                            if (!n.read) {
                              markAsRead(n.id);
                            }
                          }}
                          className={`w-full text-left px-4 py-2 border-t first:border-t-0 border-gray-100 focus:outline-none transition-colors ${
                            clickable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
                          } ${!n.read ? 'bg-amber-50/50' : 'bg-white'} ${isUrgent ? 'border-l-4 border-l-red-500' : ''}`}
                          disabled={!clickable}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={`text-sm ${!n.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                                {n.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {n.time === 'urgent' ? '⚠️ Urgent' : 
                                 n.time === 'overdue' ? '🔴 Overdue' :
                                 n.time === 'warning' ? '⚠️ Warning' :
                                 n.time === 'today' ? '📅 Today' :
                                 n.time === 'upcoming' ? '📆 Upcoming' :
                                 n.time === 'pending' ? '💰 Pending' :
                                 n.time === 'doc' ? '📄 Document' :
                                 n.time}
                              </p>
                            </div>
                            {!n.read && (
                              <span className="flex-shrink-0 w-2 h-2 bg-amber-500 rounded-full mt-1.5" title="Unread" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {notifications.length === 0 && (
                      <p className="px-4 py-4 text-sm text-gray-500 text-center">No notifications</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-amber-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};