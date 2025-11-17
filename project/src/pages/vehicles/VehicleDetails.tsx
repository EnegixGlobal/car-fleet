import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { vehicleServicingAPI, VehicleServicingDTO, vehicleCategoryAPI, VehicleCategoryDTO } from '../../services/api';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';

export const VehicleDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, bookings } = useApp();
  const vehicle = vehicles.find(v => v.id === id);
  const [servicing, setServicing] = useState<VehicleServicingDTO | null>(null);
  const [servicingLoading, setServicingLoading] = useState(false);
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategoryDTO[]>([]);

  useEffect(() => {
    if (vehicle?.id) {
      setServicingLoading(true);
      vehicleServicingAPI.get(vehicle.id)
        .then(setServicing)
        .catch(() => setServicing(null))
        .finally(() => setServicingLoading(false));
    }
  }, [vehicle?.id]);

  useEffect(() => {
    vehicleCategoryAPI
      .list()
      .then(setVehicleCategories)
      .catch(() => setVehicleCategories([]));
  }, []);

  const categoryInfo = vehicle
    ? vehicleCategories.find((c) => c.id === vehicle.categoryId)
    : undefined;

  if (!vehicle) {
    return (
      <div className="space-y-4">
        <p className="text-gray-600">Vehicle not found.</p>
        <Button onClick={() => navigate('/vehicles')}>Back</Button>
      </div>
    );
  }

  const relatedBookings = bookings.filter(b => b.vehicleId === vehicle.id);
  const totalRevenue = relatedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalExpenses = relatedBookings.reduce((sum, b) => sum + b.expenses.reduce((eSum, e) => eSum + e.amount, 0), 0);
  const completedTrips = relatedBookings.filter(b => b.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/vehicles')}>
          <Icon name="back" className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">{vehicle.registrationNumber}</h1>
        <Button variant="outline" onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}>
          <Icon name="edit" className="h-4 w-4 mr-2" /> Edit
        </Button>
        <Button variant="outline" onClick={() => navigate('/vehicles/servicing/manage', { state: { vehicleId: vehicle.id } })}>
          <Icon name="car" className="h-4 w-4 mr-2" /> Servicing
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Basic Info</h2>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {vehicle.photo && (
            <div className="md:col-span-2">
              <p className="font-medium mb-2">Vehicle Image</p>
              <img src={vehicle.photo} alt="Vehicle" className="max-h-56 rounded border" />
            </div>
          )}
          <div>
            <span className="font-medium">Category:</span>{' '}

            <span>
              {vehicle.category || categoryInfo?.name }{' - '}
              {categoryInfo?.description && (
                <span className="text-gray-600 text-sm">{categoryInfo.description}</span>
              )}
            </span>
          </div>

          <div><span className="font-medium">Ownership:</span> {vehicle.owner}</div>
          <div><span className="font-medium">Status:</span> {vehicle.status}</div>
          {vehicle.mileageTrips !== undefined && <div><span className="font-medium">Trips:</span> {vehicle.mileageTrips}</div>}
          {vehicle.mileageKm !== undefined && <div><span className="font-medium">Mileage (km):</span> {vehicle.mileageKm?.toLocaleString()}</div>}
          <div><span className="font-medium">Created:</span> {vehicle.createdAt?.slice(0, 10)}</div>
          {vehicle.document && (
            <div className="md:col-span-2">
              <span className="font-medium">Document:</span>{' '}
              <a href={vehicle.document} target="_blank" rel="noreferrer" className="text-amber-600 underline break-all">Open document</a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Document Expiry</h2>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium">Insurance:</span> {vehicle.insuranceExpiry}</div>
          <div><span className="font-medium">Fitness:</span> {vehicle.fitnessExpiry}</div>
          <div><span className="font-medium">Permit:</span> {vehicle.permitExpiry}</div>
          <div><span className="font-medium">Pollution:</span> {vehicle.pollutionExpiry}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Usage & Performance</h2>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-amber-600">{relatedBookings.length}</p>
            <p className="text-xs text-gray-500">Trips</p>
          </div>
          <div>
            <p className="text-xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Revenue</p>
          </div>
          <div>
            <p className="text-xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Trip Expenses</p>
          </div>
          <div>
            <p className="text-xl font-bold text-amber-700">{completedTrips}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Servicing Summary</h2>
            <div>
              <Button size="sm" variant="outline" onClick={() => navigate('/vehicles/servicing/manage', { state: { vehicleId: vehicle.id } })}>
                <Icon name="car" className="h-4 w-4 mr-1" /> Manage
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {servicingLoading && <p className="text-sm text-gray-500">Loading servicing data...</p>}
          {!servicingLoading && servicing && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 text-sm">
                <div>
                  <p className="font-medium mb-1">Oil Changes</p>
                  {servicing.oilChanges.length > 0 ? (
                    <ul className="space-y-1">
                      <li className="flex justify-between"><span className="text-gray-600">Total:</span> <span>{servicing.oilChanges.length}</span></li>
                      <li className="flex justify-between"><span className="text-gray-600">Last Km:</span> <span>{servicing.oilChanges[servicing.oilChanges.length - 1].kilometers}</span></li>
                      <li className="flex justify-between"><span className="text-gray-600">Last Price:</span> <span>₹{servicing.oilChanges[servicing.oilChanges.length - 1].price}</span></li>
                    </ul>
                  ) : <p className="text-gray-500 text-xs">None</p>}
                </div>
                <div>
                  <p className="font-medium mb-1">Parts</p>
                  {servicing.partsReplacements.length > 0 ? (
                    <ul className="space-y-1">
                      <li className="flex justify-between"><span className="text-gray-600">Items:</span> <span>{servicing.partsReplacements.length}</span></li>
                      <li className="flex justify-between"><span className="text-gray-600">Total:</span> <span>₹{servicing.partsReplacements.reduce((s, p) => s + p.price, 0).toLocaleString()}</span></li>
                      <li className="flex justify-between break-all"><span className="text-gray-600">Last:</span> <span>{servicing.partsReplacements[servicing.partsReplacements.length - 1].part}</span></li>
                    </ul>
                  ) : <p className="text-gray-500 text-xs">None</p>}
                </div>
                <div>
                  <p className="font-medium mb-1">Tyres</p>
                  {servicing.tyres.length > 0 ? (
                    <ul className="space-y-1">
                      <li className="flex justify-between"><span className="text-gray-600">Entries:</span> <span>{servicing.tyres.length}</span></li>
                      <li className="flex justify-between"><span className="text-gray-600">Total:</span> <span>₹{servicing.tyres.reduce((s, t) => s + t.price, 0).toLocaleString()}</span></li>
                      <li className="flex justify-between break-all"><span className="text-gray-600">Last:</span> <span>{servicing.tyres[servicing.tyres.length - 1].details}</span></li>
                    </ul>
                  ) : <p className="text-gray-500 text-xs">None</p>}
                </div>
                <div>
                  <p className="font-medium mb-1">Installments</p>
                  {servicing.installments.length > 0 ? (
                    <ul className="space-y-1">
                      <li className="flex justify-between"><span className="text-gray-600">Count:</span> <span>{servicing.installments.length}</span></li>
                      <li className="flex justify-between"><span className="text-gray-600">Total:</span> <span>₹{servicing.installments.reduce((s, a) => s + a.amount, 0).toLocaleString()}</span></li>
                      <li className="flex justify-between break-all"><span className="text-gray-600">Last:</span> <span>{servicing.installments[servicing.installments.length - 1].amount}</span></li>
                    </ul>
                  ) : <p className="text-gray-500 text-xs">None</p>}
                </div>
                <div>
                  <p className="font-medium mb-1">Insurance</p>
                  {servicing.insurances.length > 0 ? (
                    <ul className="space-y-1">
                      <li className="flex justify-between"><span className="text-gray-600">Policies:</span> <span>{servicing.insurances.length}</span></li>
                      <li className="flex justify-between"><span className="text-gray-600">Total:</span> <span>₹{servicing.insurances.reduce((s, i) => s + i.cost, 0).toLocaleString()}</span></li>
                      <li className="flex justify-between"><span className="text-gray-600">Last:</span> <span>₹{servicing.insurances[servicing.insurances.length - 1].cost}</span></li>
                    </ul>
                  ) : <p className="text-gray-500 text-xs">None</p>}
                </div>
                <div>
                  <p className="font-medium mb-1">Legal Papers</p>
                  {servicing.legalPapers.length > 0 ? (() => {
                    const total = servicing.legalPapers.reduce((s, l) => s + l.cost, 0);
                    const nextExpiry = servicing.legalPapers
                      .filter(l => l.expiryDate)
                      .sort((a, b) => (a.expiryDate! > b.expiryDate! ? 1 : -1))[0]?.expiryDate;
                    return (
                      <ul className="space-y-1">
                        <li className="flex justify-between"><span className="text-gray-600">Entries:</span> <span>{servicing.legalPapers.length}</span></li>
                        <li className="flex justify-between"><span className="text-gray-600">Total:</span> <span>₹{total.toLocaleString()}</span></li>
                        <li className="flex justify-between"><span className="text-gray-600">Next Exp:</span> <span>{nextExpiry ? nextExpiry.slice(0, 10) : '—'}</span></li>
                      </ul>
                    );
                  })() : <p className="text-gray-500 text-xs">None</p>}
                </div>
              </div>
            </>
          )}
          {!servicingLoading && !servicing && (
            <p className="text-sm text-gray-500">No servicing data yet. <button className="text-amber-600 underline" onClick={() => navigate('/vehicles/servicing/manage', { state: { vehicleId: vehicle.id } })}>Add now</button></p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Recent Trips</h2>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {relatedBookings.slice(-5).reverse().map(b => (
            <div key={b.id} className="flex items-center justify-between p-2 border rounded-md">
              <div>
                <p className="font-medium">{b.pickupLocation} → {b.dropLocation}</p>
                <p className="text-xs text-gray-500">{b.startDate.slice(0, 10)} • {b.status}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">₹{b.totalAmount.toLocaleString()}</p>
                <p className="text-xs text-red-600">₹{b.expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()} exp</p>
              </div>
            </div>
          ))}
          {relatedBookings.length === 0 && <p className="text-gray-500">No trips yet for this vehicle.</p>}
        </CardContent>
      </Card>
    </div>
  );
};
