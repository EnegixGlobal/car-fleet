import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { Layout } from "./components/layout/Layout";

// Auth Pages
import { Login } from "./pages/auth/Login";

// Dashboard
import { Dashboard } from "./pages/dashboard/Dashboard";

// Booking Pages
import { BookingList } from "./pages/bookings/BookingList";
import { CreateBooking } from "./pages/bookings/CreateBooking";
import { BookingDetails } from "./pages/bookings/BookingDetails";
import { EditBooking } from "./pages/bookings/EditBooking";

// Driver Pages
import { DriverList } from "./pages/drivers/DriverList";
import { CreateDriver } from "./pages/drivers/CreateDriver";
import { DriverProfile } from "./pages/drivers/DriverProfile";
import { DriverPaymentHistory } from "./pages/drivers/DriverPaymentHistory";
import { EditDriver } from "./pages/drivers/EditDriver";
import { DriverManagementPage } from "./pages/drivers/DriverManagement";
import { DriverManagementDetailPage } from "./pages/drivers/DriverManagementDetail";

// Vehicle Pages
import { VehicleList } from "./pages/vehicles/VehicleList";
import { CreateVehicle } from "./pages/vehicles/CreateVehicle";
import { VehicleDetails } from "./pages/vehicles/VehicleDetails";
import { EditVehicle } from "./pages/vehicles/EditVehicle";
import { VehicleServicingPage } from "./pages/vehicles/VehicleServicing";
import VehicleCategoryPage from "./pages/vehicles/VehicleCategory";

// Company Pages
import { CompanyList } from "./pages/companies/CompanyList";
import { CreateCompany } from "./pages/companies/CreateCompany";
import { CompanyDetails } from "./pages/companies/CompanyDetails";
import { EditCompany } from "./pages/companies/EditCompany";

// Customer Pages
import { CustomerList } from "./pages/customers/CustomerList";
import { CreateCustomer } from "./pages/customers/CreateCustomer";
import { CustomerDetails } from "./pages/customers/CustomerDetails";
import { EditCustomer } from "./pages/customers/EditCustomer";

// Finance Pages
import { Finance } from "./pages/finance/Finance";

// Reports Pages
import { Reports } from "./pages/reports/Reports";
import { DriverReport } from "./pages/reports/DriverReport";
import { BookingReport } from "./pages/reports/BookingReport";
import { FuelReport } from "./pages/reports/FuelReport";
import { CompanyReport } from "./pages/reports/CompanyReport";
// Account Page
import { Account } from "./pages/account/Account";
import FuelManagement from "./pages/fuel/FuelManagement";
import AddFuel from "./pages/fuel/AddFuel";

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <div className="App">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
                success: {
                  style: {
                    background: "#10B981",
                  },
                },
                error: {
                  style: {
                    background: "#EF4444",
                  },
                },
              }}
            />

            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "admin",
                        "accountant",
                        "dispatcher",
                        "driver",
                        "customer",
                      ]}
                    >
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                {/* Bookings */}
                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "admin",
                        "dispatcher",
                        "driver",
                        "customer",
                      ]}
                    >
                      <BookingList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings/create"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "dispatcher"]}>
                      <CreateBooking />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings/:id"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "admin",
                        "dispatcher",
                        "driver",
                        "customer",
                      ]}
                    >
                      <BookingDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "dispatcher"]}>
                      <EditBooking />
                    </ProtectedRoute>
                  }
                />
                {/* Drivers */}
                <Route
                  path="/drivers"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "dispatcher"]}>
                      <DriverList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/drivers/management"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "dispatcher", "accountant"]}
                    >
                      <DriverManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/drivers/management/:id"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "dispatcher", "accountant"]}
                    >
                      <DriverManagementDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/drivers/create"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "dispatcher"]}>
                      <CreateDriver />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/drivers/:id"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "dispatcher"]}>
                      <DriverProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/drivers/:id/payments"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "dispatcher", "accountant"]}
                    >
                      <DriverPaymentHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/drivers/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "dispatcher"]}>
                      <EditDriver />
                    </ProtectedRoute>
                  }
                />
                {/* Vehicles */}
                <Route
                  path="/vehicles"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "dispatcher"]}>
                      <VehicleList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vehicles/create"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "dispatcher"]}>
                      <CreateVehicle />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vehicles/:id"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "dispatcher"]}>
                      <VehicleDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vehicles/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "dispatcher"]}>
                      <EditVehicle />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vehicles/servicing/manage"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "dispatcher"]}>
                      <VehicleServicingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vehicles/categories"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "dispatcher"]}>
                      <VehicleCategoryPage />
                    </ProtectedRoute>
                  }
                />
                {/* Companies */}
                <Route
                  path="/companies"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "accountant", "dispatcher"]}
                    >
                      <CompanyList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/companies/create"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "accountant", "dispatcher"]}
                    >
                      <CreateCompany />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/companies/:id"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "accountant", "dispatcher"]}
                    >
                      <CompanyDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/companies/:id/edit"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "accountant", "dispatcher"]}
                    >
                      <EditCompany />
                    </ProtectedRoute>
                  }
                />
                {/* Customers */}
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "dispatcher", "accountant"]}
                    >
                      <CustomerList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers/create"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "dispatcher", "accountant"]}
                    >
                      <CreateCustomer />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers/:id"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "dispatcher", "accountant"]}
                    >
                      <CustomerDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers/:id/edit"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "dispatcher", "accountant"]}
                    >
                      <EditCustomer />
                    </ProtectedRoute>
                  }
                />
                {/* Finance */}
                <Route
                  path="/finance"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                      <Finance />
                    </ProtectedRoute>
                  }
                />
                {/* Fuel */}
                <Route
                  path="/fuel"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "accountant", "dispatcher"]}
                    >
                      <FuelManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/fuel/add"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "accountant", "dispatcher"]}
                    >
                      <AddFuel />
                    </ProtectedRoute>
                  }
                />
                {/* Reports */}
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                      <Reports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports/driver"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                      <DriverReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports/booking"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                      <BookingReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports/fuel"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                      <FuelReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports/company"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "accountant"]}>
                      <CompanyReport />
                    </ProtectedRoute>
                  }
                />
                {/* Account */}
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "admin",
                        "accountant",
                        "dispatcher",
                        "driver",
                        "customer",
                      ]}
                    >
                      <Account />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </div>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
