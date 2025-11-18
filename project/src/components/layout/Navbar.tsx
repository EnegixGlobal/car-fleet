import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, addDays, isBefore } from 'date-fns';

interface NavbarProps {
  onSidebarToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSidebarToggle }) => {
  const { user } = useAuth();
  const { bookings, drivers } = useApp();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const currentDriver =
    user?.role === 'driver'
      ? drivers.find(d => d.id === user.driverId) ||
        drivers.find(d => d.name?.trim()?.toLowerCase() === user.name?.trim()?.toLowerCase())
      : undefined;

  // Build notifications differently for driver role
  let notifications: { id: string; type: string; message: string; time: string; target?: string }[] = [];
  if (user?.role === 'driver') {
    const activeDriverId = user.driverId || currentDriver?.id;
    if (activeDriverId) {
      const todayKey = format(new Date(), 'yyyy-MM-dd');
      const todaysTrips = bookings.filter(
        b => b.driverId === activeDriverId && format(parseISO(b.startDate), 'yyyy-MM-dd') === todayKey
      );
      notifications.push(
        ...todaysTrips.map(b => ({
          id: 'trip-' + b.id,
          type: 'trip',
          message: `${b.status === 'completed' ? 'Completed' : b.status === 'ongoing' ? 'Ongoing' : 'Upcoming'} trip: ${b.pickupLocation} → ${b.dropLocation}`,
          time: format(parseISO(b.startDate), 'h:mm a'),
          target: `/bookings/${b.id}`
        }))
      );
    }
    if (currentDriver) {
      // Document expiry alerts (within 30 days)
      const soon = addDays(new Date(), 30);
      const licenseExpiry = parseISO(currentDriver.licenseExpiry);
      if (isBefore(licenseExpiry, soon)) {
        notifications.push({
          id: 'license-exp',
          type: 'alert',
          message: `License expiring on ${format(licenseExpiry, 'MMM d, yyyy')}`,
          time: 'doc'
        });
      }
      const policeExpiry = parseISO(currentDriver.policeVerificationExpiry);
      if (isBefore(policeExpiry, soon)) {
        notifications.push({
          id: 'police-exp',
          type: 'alert',
          message: `Police verification expiring on ${format(policeExpiry, 'MMM d, yyyy')}`,
          time: 'doc'
        });
      }
    }
  } else {
    // Admin/dispatcher basic placeholder sample notifications
    notifications = [
      { id: '1', type: 'booking', message: '3 new bookings scheduled today', time: 'Just now', target: '/bookings' },
      { id: '2', type: 'alert', message: '2 vehicle permits expiring soon', time: '10m ago', target: '/dashboard' }
    ];
  }

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
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-2 max-h-96 overflow-y-auto">
                    <div className="px-4 pb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-700">Notifications</h4>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-xs text-amber-600 hover:underline"
                      >Close</button>
                    </div>
                    {notifications.map(n => {
                      const clickable = Boolean(n.target);
                      return (
                        <button
                          key={n.id}
                          onClick={() => {
                            if (n.target) {
                              navigate(n.target);
                              setShowNotifications(false);
                            }
                          }}
                          className={`w-full text-left px-4 py-2 border-t first:border-t-0 border-gray-100 focus:outline-none ${clickable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default bg-white'}`}
                          disabled={!clickable}
                        >
                          <p className="text-sm text-gray-800">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{n.time}{!clickable && ' • info'}</p>
                        </button>
                      );
                    })}
                    {notifications.length === 0 && (
                      <p className="px-4 py-4 text-sm text-gray-500">No notifications</p>
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