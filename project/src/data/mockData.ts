/* Demo mock data retained for reference only. The app now relies on real API
   responses and local storage. Uncomment the block below if you ever need the
   historical demo dataset locally during development.

import { Booking, Driver, Vehicle, Company } from '../types';

export const mockBookings: Booking[] = [
  {
    id: '1',
    customerName: 'John Doe',
    customerPhone: '+1234567890',
    bookingSource: 'company',
    companyId: '1',
    pickupLocation: 'Airport Terminal 1, Mumbai',
    dropLocation: 'Hotel Taj, Mumbai',
    journeyType: 'one-way',
    startDate: '2025-01-15T10:00:00Z',
    endDate: '2025-01-15T11:30:00Z',
    vehicleId: '1',
    driverId: '1',
    tariffRate: 15,
    totalAmount: 1500,
    advanceReceived: 500,
    balance: 1000,
  status: 'completed',
  billed: true,
  dutySlips: [],
    expenses: [
      { id: '1', type: 'fuel', amount: 200, description: 'Petrol fill-up' },
      { id: '2', type: 'toll', amount: 50, description: 'Highway toll' }
    ],
    statusHistory: [
      { id: '1', status: 'booked', timestamp: '2025-01-14T09:00:00Z', changedBy: 'Dispatcher' },
      { id: '2', status: 'ongoing', timestamp: '2025-01-15T10:00:00Z', changedBy: 'Driver' },
      { id: '3', status: 'completed', timestamp: '2025-01-15T11:30:00Z', changedBy: 'Driver' }
    ],
    createdAt: '2025-01-14T09:00:00Z'
  },
  {
    id: '2',
    customerName: 'Jane Smith',
    customerPhone: '+1234567891',
    bookingSource: 'individual',
    pickupLocation: 'Central Station, Delhi',
    dropLocation: 'Connaught Place, Delhi',
    journeyType: 'local',
    startDate: '2025-01-16T14:00:00Z',
    endDate: '2025-01-16T15:00:00Z',
    vehicleId: '2',
    driverId: '2',
    tariffRate: 12,
    totalAmount: 800,
    advanceReceived: 300,
    balance: 500,
  status: 'ongoing',
  billed: false,
  dutySlips: [],
    expenses: [],
    statusHistory: [
      { id: '1', status: 'booked', timestamp: '2025-01-15T10:00:00Z', changedBy: 'Dispatcher' },
      { id: '2', status: 'ongoing', timestamp: '2025-01-16T14:00:00Z', changedBy: 'Driver' }
    ],
    createdAt: '2025-01-15T10:00:00Z'
  },
  {
    id: '3',
    customerName: 'ABC Travel Agency',
    customerPhone: '+1234567892',
    bookingSource: 'travel-agency',
    companyId: '2',
    pickupLocation: 'Goa Airport',
    dropLocation: 'Resort Paradise, Goa',
    journeyType: 'round-trip',
    startDate: '2025-01-17T08:00:00Z',
    endDate: '2025-01-20T20:00:00Z',
    vehicleId: '3',
    driverId: '3',
    tariffRate: 20,
    totalAmount: 15000,
    advanceReceived: 5000,
    balance: 10000,
  status: 'booked',
  billed: false,
  dutySlips: [],
    expenses: [],
    statusHistory: [
      { id: '1', status: 'booked', timestamp: '2025-01-16T11:00:00Z', changedBy: 'Dispatcher' }
    ],
    createdAt: '2025-01-16T11:00:00Z'
  }
  ,{
    id: '4',
    customerName: 'Corporate Client A',
    customerPhone: '+1234567894',
    bookingSource: 'company',
    companyId: '1',
    pickupLocation: 'Bandra Kurla Complex, Mumbai',
    dropLocation: 'Mumbai Airport T2',
    journeyType: 'one-way',
    startDate: '2025-01-18T06:30:00Z',
    endDate: '2025-01-18T07:30:00Z',
    vehicleId: '2',
    driverId: '2',
    tariffRate: 18,
    totalAmount: 2200,
    advanceReceived: 1000,
    balance: 1200,
    status: 'completed',
    billed: true,
    dutySlips: [],
    expenses: [
      { id: '1', type: 'fuel', amount: 300, description: 'Diesel refill' },
      { id: '2', type: 'parking', amount: 150, description: 'Airport parking' }
    ],
    statusHistory: [
      { id: '1', status: 'booked', timestamp: '2025-01-17T05:00:00Z', changedBy: 'Dispatcher' },
      { id: '2', status: 'ongoing', timestamp: '2025-01-18T06:30:00Z', changedBy: 'Driver' },
      { id: '3', status: 'completed', timestamp: '2025-01-18T07:30:00Z', changedBy: 'Driver' }
    ],
    createdAt: '2025-01-17T05:00:00Z'
  },
  {
    id: '5',
    customerName: 'City Tours Group',
    customerPhone: '+1234567895',
    bookingSource: 'travel-agency',
    companyId: '2',
    pickupLocation: 'Delhi City Center',
    dropLocation: 'Monuments Circuit',
    journeyType: 'local',
    startDate: '2025-01-18T09:00:00Z',
    endDate: '2025-01-18T18:00:00Z',
    vehicleId: '4',
    driverId: '4',
    tariffRate: 25,
    totalAmount: 6000,
    advanceReceived: 3000,
    balance: 3000,
    status: 'ongoing',
    billed: false,
    dutySlips: [],
    expenses: [
      { id: '1', type: 'fuel', amount: 500, description: 'Refuel mid-day' },
      { id: '2', type: 'toll', amount: 200, description: 'Expressway toll' },
      { id: '3', type: 'other', amount: 100, description: 'Bottled water' }
    ],
    statusHistory: [
      { id: '1', status: 'booked', timestamp: '2025-01-17T10:00:00Z', changedBy: 'Dispatcher' },
      { id: '2', status: 'ongoing', timestamp: '2025-01-18T09:00:00Z', changedBy: 'Driver' }
    ],
    createdAt: '2025-01-17T10:00:00Z'
  },
  {
    id: '6',
    customerName: 'Walk-in Customer',
    customerPhone: '+1234567896',
    bookingSource: 'individual',
    pickupLocation: 'Pune Railway Station',
    dropLocation: 'Shivaji Nagar, Pune',
    journeyType: 'one-way',
    startDate: '2025-01-19T12:15:00Z',
    endDate: '2025-01-19T13:00:00Z',
    vehicleId: '1',
    driverId: '1',
    tariffRate: 10,
    totalAmount: 900,
    advanceReceived: 300,
    balance: 600,
    status: 'booked',
    billed: false,
    dutySlips: [],
    expenses: [
      { id: '1', type: 'parking', amount: 40, description: 'Station parking' }
    ],
    statusHistory: [
      { id: '1', status: 'booked', timestamp: '2025-01-18T11:45:00Z', changedBy: 'Dispatcher' }
    ],
    createdAt: '2025-01-18T11:45:00Z'
  }
];

export const mockDrivers: Driver[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    phone: '+9876543210',
    licenseNumber: 'DL1420110012345',
    aadhaar: '1234-5678-9012',
    vehicleType: 'owned',
    licenseExpiry: '2025-12-31',
    policeVerificationExpiry: '2025-06-30',
    paymentMode: 'per-trip',
    salary: 500,
    advances: [
      { id: '1', amount: 2000, date: '2025-01-01', settled: false, description: 'Monthly advance' }
    ],
    status: 'active',
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'Mohammed Ali',
    phone: '+9876543211',
    licenseNumber: 'DL1420110012346',
    aadhaar: '1234-5678-9013',
    vehicleType: 'rented',
    licenseExpiry: '2025-08-15',
    policeVerificationExpiry: '2025-03-20',
    paymentMode: 'daily',
    salary: 800,
    advances: [],
    status: 'active',
    createdAt: '2024-02-10T00:00:00Z'
  },
  {
    id: '3',
    name: 'Suresh Sharma',
    phone: '+9876543212',
    licenseNumber: 'DL1420110012347',
    aadhaar: '1234-5678-9014',
    vehicleType: 'owned',
    licenseExpiry: '2025-11-30',
    policeVerificationExpiry: '2025-01-25',
    paymentMode: 'monthly',
    salary: 25000,
    advances: [
      { id: '1', amount: 5000, date: '2025-01-10', settled: false, description: 'Emergency advance' }
    ],
    status: 'active',
    createdAt: '2024-03-05T00:00:00Z'
  }
  ,{
  id: '4',
  name: 'Mike Driver',
  phone: '+9876543299',
  licenseNumber: 'DL1420110099999',
  aadhaar: '1234-5678-9099',
  vehicleType: 'owned',
  licenseExpiry: '2025-12-31',
  policeVerificationExpiry: '2025-08-15',
  paymentMode: 'per-trip',
  salary: 0,
  advances: [],
  status: 'active',
  createdAt: '2024-04-10T00:00:00Z'
  }
];

export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    registrationNumber: 'MH01AB1234',
    category: 'sedan',
    owner: 'owned',
    insuranceExpiry: '2025-03-15',
    fitnessExpiry: '2025-05-20',
    permitExpiry: '2025-07-10',
    pollutionExpiry: '2025-02-28',
  status: 'active',
  mileageTrips: 120,
  mileageKm: 45000,
    createdAt: '2024-01-10T00:00:00Z'
  },
  {
    id: '2',
    registrationNumber: 'DL02CD5678',
    category: 'SUV',
    owner: 'rented',
    insuranceExpiry: '2025-04-30',
    fitnessExpiry: '2025-06-15',
    permitExpiry: '2025-08-25',
    pollutionExpiry: '2025-01-31',
  status: 'active',
  mileageTrips: 80,
  mileageKm: 30000,
    createdAt: '2024-02-15T00:00:00Z'
  },
  {
    id: '3',
    registrationNumber: 'GA03EF9012',
    category: 'mini-bus',
    owner: 'owned',
    insuranceExpiry: '2025-12-31',
    fitnessExpiry: '2025-09-30',
    permitExpiry: '2025-11-15',
    pollutionExpiry: '2025-03-31',
  status: 'active',
  mileageTrips: 60,
  mileageKm: 15000,
    createdAt: '2024-03-20T00:00:00Z'
  }
  ,{
    id: '4',
    registrationNumber: 'DL04GH3456',
    category: 'bus',
    owner: 'rented',
    insuranceExpiry: '2025-09-30',
    fitnessExpiry: '2025-10-20',
    permitExpiry: '2025-12-15',
    pollutionExpiry: '2025-06-30',
    status: 'active',
    mileageTrips: 30,
    mileageKm: 20000,
    createdAt: '2024-04-01T00:00:00Z'
  },
  {
    id: '5',
    registrationNumber: 'MH05JK7788',
    category: 'sedan',
    owner: 'owned',
    insuranceExpiry: '2025-02-10',
    fitnessExpiry: '2025-12-01',
    permitExpiry: '2025-08-05',
    pollutionExpiry: '2025-01-25',
    status: 'maintenance',
    mileageTrips: 200,
    mileageKm: 78000,
    createdAt: '2024-05-12T00:00:00Z'
  },
  {
    id: '6',
    registrationNumber: 'DL06LM9900',
    category: 'SUV',
    owner: 'owned',
    insuranceExpiry: '2025-11-18',
    fitnessExpiry: '2025-07-22',
    permitExpiry: '2026-01-10',
    pollutionExpiry: '2025-04-14',
    status: 'active',
    mileageTrips: 50,
    mileageKm: 12000,
    createdAt: '2024-06-08T00:00:00Z'
  },
  {
    id: '7',
    registrationNumber: 'GA07NP2233',
    category: 'mini-bus',
    owner: 'rented',
    insuranceExpiry: '2025-05-05',
    fitnessExpiry: '2025-09-09',
    permitExpiry: '2025-10-20',
    pollutionExpiry: '2025-03-12',
    status: 'inactive',
    mileageTrips: 15,
    mileageKm: 9000,
    createdAt: '2024-07-01T00:00:00Z'
  }
];

// Extra bookings for Mike Driver (id '4')
mockBookings.push(
  {
    id: '7',
    customerName: 'Express Logistics',
    customerPhone: '+1234567897',
    bookingSource: 'company',
    companyId: '1',
    pickupLocation: 'Logistics Park, Mumbai',
    dropLocation: 'JNPT Port, Navi Mumbai',
    journeyType: 'one-way',
    startDate: '2025-01-19T05:00:00Z',
    endDate: '2025-01-19T07:30:00Z',
    vehicleId: '2',
    driverId: '4',
    tariffRate: 22,
    totalAmount: 3500,
    advanceReceived: 1500,
    balance: 2000,
    status: 'ongoing',
    billed: false,
    dutySlips: [],
    expenses: [
      { id: '1', type: 'fuel', amount: 400, description: 'Fuel top-up' },
      { id: '2', type: 'toll', amount: 180, description: 'Highway tolls' }
    ],
    statusHistory: [
      { id: '1', status: 'booked', timestamp: '2025-01-18T04:00:00Z', changedBy: 'Dispatcher' },
      { id: '2', status: 'ongoing', timestamp: '2025-01-19T05:00:00Z', changedBy: 'Driver' }
    ],
    createdAt: '2025-01-18T04:00:00Z'
  },
  {
    id: '8',
    customerName: 'Evening City Ride',
    customerPhone: '+1234567898',
    bookingSource: 'individual',
    pickupLocation: 'Marine Drive, Mumbai',
    dropLocation: 'Andheri West, Mumbai',
    journeyType: 'one-way',
    startDate: '2025-01-19T17:30:00Z',
    endDate: '2025-01-19T18:10:00Z',
    vehicleId: '1',
    driverId: '4',
    tariffRate: 14,
    totalAmount: 1100,
    advanceReceived: 300,
    balance: 800,
    status: 'booked',
    billed: false,
    dutySlips: [],
    expenses: [
      { id: '1', type: 'parking', amount: 60, description: 'Promenade parking' }
    ],
    statusHistory: [
      { id: '1', status: 'booked', timestamp: '2025-01-18T19:00:00Z', changedBy: 'Dispatcher' }
    ],
    createdAt: '2025-01-18T19:00:00Z'
  }
);

// Dummy bookings for today's trips (2025-08-19)
// These provide a mix of statuses to populate dashboard metrics.
mockBookings.push(
  {
    id: '9',
    customerName: 'Morning Airport Pickup',
    customerPhone: '+1234500001',
    bookingSource: 'individual',
    pickupLocation: 'Andheri East, Mumbai',
    dropLocation: 'Mumbai Airport T2',
    journeyType: 'one-way',
    startDate: '2025-08-19T03:30:00Z',
    endDate: '2025-08-19T04:15:00Z',
    vehicleId: '1',
    driverId: '1',
    tariffRate: 14,
    totalAmount: 950,
    advanceReceived: 300,
    balance: 650,
    status: 'completed',
    billed: false,
    dutySlips: [],
    expenses: [
      { id: '1', type: 'toll', amount: 120, description: 'Expressway toll' }
    ],
    statusHistory: [
      { id: '1', status: 'booked', timestamp: '2025-08-18T16:00:00Z', changedBy: 'Dispatcher' },
      { id: '2', status: 'ongoing', timestamp: '2025-08-19T03:30:00Z', changedBy: 'Driver' },
      { id: '3', status: 'completed', timestamp: '2025-08-19T04:15:00Z', changedBy: 'Driver' }
    ],
    createdAt: '2025-08-18T16:00:00Z'
  },
  {
    id: '10',
    customerName: 'Corporate Client Shuttle',
    customerPhone: '+1234500002',
    bookingSource: 'company',
    companyId: '1',
    pickupLocation: 'BKC, Mumbai',
    dropLocation: 'Nariman Point, Mumbai',
    journeyType: 'one-way',
    startDate: '2025-08-19T07:00:00Z',
    endDate: '2025-08-19T08:00:00Z',
    vehicleId: '2',
    driverId: '2',
    tariffRate: 18,
    totalAmount: 1800,
    advanceReceived: 800,
    balance: 1000,
    status: 'ongoing',
    billed: false,
    dutySlips: [],
    expenses: [],
    statusHistory: [
      { id: '1', status: 'booked', timestamp: '2025-08-18T19:30:00Z', changedBy: 'Dispatcher' },
      { id: '2', status: 'ongoing', timestamp: '2025-08-19T07:00:00Z', changedBy: 'Driver' }
    ],
    createdAt: '2025-08-18T19:30:00Z'
  },
  {
    id: '11',
    customerName: 'Evening Outstation Drop',
    customerPhone: '+1234500003',
    bookingSource: 'travel-agency',
    companyId: '2',
    pickupLocation: 'Gateway of India, Mumbai',
    dropLocation: 'Lonavala Hilltop Resort',
    journeyType: 'one-way',
    startDate: '2025-08-19T14:30:00Z',
    endDate: '2025-08-19T17:30:00Z',
    vehicleId: '3',
    driverId: '3',
    tariffRate: 25,
    totalAmount: 5200,
    advanceReceived: 2000,
    balance: 3200,
    status: 'booked',
    billed: false,
    dutySlips: [],
    expenses: [
      { id: '1', type: 'fuel', amount: 600, description: 'Pre-trip refuel' }
    ],
    statusHistory: [
      { id: '1', status: 'booked', timestamp: '2025-08-18T21:00:00Z', changedBy: 'Dispatcher' }
    ],
    createdAt: '2025-08-18T21:00:00Z'
  }
);

export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Tech Solutions Pvt Ltd',
    gst: '27AAACT2727Q1ZS',
    address: 'Plot 123, Tech Park, Mumbai - 400001',
    contactPerson: 'Amit Patel',
    phone: '+912234567890',
    email: 'amit@techsolutions.com',
    outstandingAmount: 25000,
    createdAt: '2024-01-05T00:00:00Z'
  },
  {
    id: '2',
    name: 'Global Travel Agency',
    gst: '07BBCDE3838R2ZT',
    address: '456 Travel Street, Delhi - 110001',
    contactPerson: 'Priya Sharma',
    phone: '+911134567890',
    email: 'priya@globaltravel.com',
    outstandingAmount: 15000,
    createdAt: '2024-02-12T00:00:00Z'
  },
  {
    id: '3',
    name: 'Maharashtra Tourism Board',
    gst: '27FGHIJ4949S3ZU',
    address: '789 Government Complex, Mumbai - 400032',
    contactPerson: 'Rajesh Desai',
    phone: '+912298765432',
    email: 'rajesh@mhtourism.gov.in',
    outstandingAmount: 0,
    createdAt: '2024-03-18T00:00:00Z'
  },
  {
    id: '4',
    name: 'LogiTrans Warehousing Pvt Ltd',
    gst: '27LOGTR1234Z5Z1',
    address: 'Warehouse 12, Industrial Estate, Navi Mumbai - 400710',
    contactPerson: 'Neha Verma',
    phone: '+912267890123',
    email: 'neha@logitrans.com',
    outstandingAmount: 48000,
    createdAt: '2024-04-22T00:00:00Z'
  },
  {
    id: '5',
    name: 'Metro Hospitals Group',
    gst: '27METHP5678Q2Z9',
    address: '45 Health Avenue, Pune - 411001',
    contactPerson: 'Dr. Karan Mehta',
    phone: '+912025678900',
    email: 'karan.mehta@metrohospitals.in',
    outstandingAmount: 12500,
    createdAt: '2024-05-05T00:00:00Z'
  },
  {
    id: '6',
    name: 'EventSpark Productions',
    gst: '27EVSPR2233L8Z4',
    address: 'Studio 8, Film City Road, Mumbai - 400065',
    contactPerson: 'Prachi Nair',
    phone: '+912245678901',
    email: 'prachi@eventspark.in',
    outstandingAmount: 30000,
    createdAt: '2024-06-14T00:00:00Z'
  },
  {
    id: '7',
    name: 'Green Tours Co',
    gst: '27GRNTR9900P1Z7',
    address: 'Eco Plaza, Nashik Highway, Thane - 400604',
    contactPerson: 'Vivek Sinha',
    phone: '+912231145678',
    email: 'vivek@greentours.co',
    outstandingAmount: 0,
    createdAt: '2024-07-02T00:00:00Z'
  }
];
*/

export {};