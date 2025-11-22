import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Icon, IconName } from "../ui/Icon";
import { UserRole } from "../../types";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const [reportsOpen, setReportsOpen] = React.useState<boolean>(
    location.pathname.startsWith("/reports")
  );

  interface NavItem {
    name: string;
    href: string;
    icon: IconName;
    roles: UserRole[];
  }
  const navigationItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "chart",
      roles: ["admin", "accountant", "dispatcher", "driver", "customer"],
    },
    {
      name: "Bookings",
      href: "/bookings",
      icon: "calendar",
      roles: ["admin", "dispatcher", "driver", "customer"],
    },
    {
      name: "Drivers",
      href: "/drivers",
      icon: "user",
      roles: ["admin", "dispatcher"],
    },
    {
      name: "Vehicles",
      href: "/vehicles",
      icon: "car",
      roles: ["admin", "dispatcher"],
    },
    {
      name: "Companies",
      href: "/companies",
      icon: "building",
      roles: ["admin", "accountant", "dispatcher"],
    },
    {
      name: "Customers",
      href: "/customers",
      icon: "user",
      roles: ["admin", "dispatcher", "accountant"],
    },
    // {
    //   name: "Finance",
    //   href: "/finance",
    //   icon: "money",
    //   roles: ["admin", "accountant"],
    // },
    // {
    //   name: "Fuel",
    //   href: "/fuel",
    //   icon: "wallet",
    //   roles: ["admin", "accountant", "dispatcher"],
    // },
    // Reports handled separately as a collapsible group below
    {
      name: "Account",
      href: "/account",
      icon: "user",
      roles: ["admin", "accountant", "dispatcher", "driver", "customer"],
    },
  ];

  const filteredItems = navigationItems.filter((item) => hasRole(item.roles));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <div className="flex items-center">
            <Icon name="car" className="h-8 w-8 text-amber-500" />
            <span className="ml-2 text-xl font-bold text-white">Car Fleet</span>
          </div>
          <button
            onClick={onToggle}
            className="md:hidden text-gray-300 hover:text-white"
            aria-label="Close sidebar"
          >
            <Icon name="close" className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-5 px-2 flex-1 flex flex-col">
          <div className="space-y-1 flex-1">
            {filteredItems.map((item) => {
              const navIcon = item.icon;
              const isActive = location.pathname.startsWith(item.href);

              return (
                <div key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => {
                      if (window.innerWidth < 768) onToggle();
                    }}
                    className={`${
                      isActive
                        ? "bg-gray-900 text-white border-r-2 border-amber-500"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                  >
                    <Icon
                      name={navIcon}
                      className={`${
                        isActive
                          ? "text-amber-500"
                          : "text-gray-400 group-hover:text-gray-300"
                      } mr-3 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </Link>

                  {/* Reports group - placed after Account */}
                  {item.name === "Account" &&
                    hasRole(["admin", "accountant"]) && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => setReportsOpen((o) => !o)}
                          className={`w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                            location.pathname.startsWith("/reports")
                              ? "bg-gray-900 text-white border-r-2 border-amber-500"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white"
                          }`}
                        >
                          <span className="inline-flex items-center">
                            <Icon
                              name="file"
                              className={`mr-3 h-6 w-6 ${
                                location.pathname.startsWith("/reports")
                                  ? "text-amber-500"
                                  : "text-gray-400"
                              }`}
                            />
                            Reports
                          </span>
                          <Icon
                            name={reportsOpen ? "chevronDown" : "chevronRight"}
                            className="h-4 w-4"
                          />
                        </button>
                        {reportsOpen && (
                          <div
                            className="mt-1 ml-9 space-y-1 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                            role="group"
                            aria-label="Reports submenu"
                          >
                            <Link
                              to="/reports/driver"
                              className={`block px-2 py-2 text-sm rounded-md ${
                                location.pathname.startsWith("/reports/driver")
                                  ? "bg-gray-900 text-white"
                                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
                              }`}
                              onClick={() => {
                                if (window.innerWidth < 768) onToggle();
                              }}
                            >
                              Driver Report
                            </Link>
                            <Link
                              to="/reports/booking"
                              className={`block px-2 py-2 text-sm rounded-md ${
                                location.pathname.startsWith("/reports/booking")
                                  ? "bg-gray-900 text-white"
                                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
                              }`}
                              onClick={() => {
                                if (window.innerWidth < 768) onToggle();
                              }}
                            >
                              Booking Report
                            </Link>
                            <Link
                              to="/reports/fuel"
                              className={`block px-2 py-2 text-sm rounded-md ${
                                location.pathname.startsWith("/reports/fuel")
                                  ? "bg-gray-900 text-white"
                                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
                              }`}
                              onClick={() => {
                                if (window.innerWidth < 768) onToggle();
                              }}
                            >
                              Fuel Report
                            </Link>
                            <Link
                              to="/reports/company"
                              className={`block px-2 py-2 text-sm rounded-md ${
                                location.pathname.startsWith("/reports/company")
                                  ? "bg-gray-900 text-white"
                                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
                              }`}
                              onClick={() => {
                                if (window.innerWidth < 768) onToggle();
                              }}
                            >
                              Company Report
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="p-4 border-t border-gray-700 mt-auto">
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-amber-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-300 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full px-2 py-2 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Sign out"
          >
            <Icon name="role" className="mr-3 h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
};
