import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { financeAPI } from '../../services/api';
import { DriverFinancePayment } from '../../types';

export const DriverProfile: React.FC = () => {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const { drivers, payments, settleDriverAdvance, addDriverAdvance } = useApp();
  const [advAmount, setAdvAmount] = React.useState('');
  const [advDesc, setAdvDesc] = React.useState('');
  const [loadingDriverPayments, setLoadingDriverPayments] = React.useState(false);
  const [driverPayments, setDriverPayments] = React.useState<DriverFinancePayment[]>([]);
  const [viewMode, setViewMode] = React.useState<'trip' | 'day'>('trip');
  const driver = drivers.find(d => d.id === id);

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoadingDriverPayments(true);
        const list = await financeAPI.getDriverPayments(id);
        console.log(list);
        setDriverPayments(list);
      } catch (err) {
        console.error('Failed to load driver payments', err);
      } finally {
        setLoadingDriverPayments(false);
      }
    })();
  }, [id]);

  // Aggregate per-day (sum of amounts by date (YYYY-MM-DD))
  const perDay = React.useMemo(() => {
    const map: Record<string, { date: string; total: number; count: number }> = {};
    driverPayments.forEach(p => {
      const day = p.date ? new Date(p.date).toISOString().slice(0,10) : 'unknown';
      if (!map[day]) map[day] = { date: day, total: 0, count: 0 };
      map[day].total += p.amount;
      map[day].count += 1;
    });
    return Object.values(map).sort((a,b)=> b.date.localeCompare(a.date));
  }, [driverPayments]);

  if (!driver) {
    return (
      <div className='space-y-4'>
        <p className='text-gray-600'>Driver not found.</p>
        <Button onClick={() => navigate('/drivers')}>Back</Button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between flex-wrap gap-3'>
        <div className='flex items-center space-x-4'>
          <Button variant='outline' onClick={() => navigate('/drivers')}><Icon name='back' className='h-4 w-4 mr-2'/>Back</Button>
          <h1 className='text-3xl font-bold text-gray-900'>{driver.name}</h1>
        </div>
        <div className='flex items-center gap-2'>
          <Button size='sm' variant='outline' onClick={()=>navigate(`/drivers/${driver.id}/payments`)}>
            <Icon name='eye' className='h-4 w-4 mr-1'/> Payment History
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <h2 className='text-xl font-semibold text-gray-900'>Basic Info</h2>
        </CardHeader>
        <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
          {driver.photo && (
            <div className='md:col-span-2 flex items-center gap-4'>
              <img
                src={driver.photo}
                alt={driver.name}
                className='h-24 w-24 rounded-full object-cover border border-gray-300 shadow'
              />
              <a
                href={driver.photo}
                target='_blank'
                rel='noopener'
                className='text-amber-600 underline text-sm'
              >View</a>
            </div>
          )}
          <div><span className='font-medium'>Phone:</span> {driver.phone}</div>
          <div><span className='font-medium'>License #:</span> {driver.licenseNumber}</div>
          <div><span className='font-medium'>Aadhaar:</span> {driver.aadhaar}</div>
          <div><span className='font-medium'>Vehicle Type:</span> {driver.vehicleType}</div>
          <div><span className='font-medium'>Payment Mode:</span> {driver.paymentMode}</div>
          {driver.salary !== undefined && <div><span className='font-medium'>Salary/Rate:</span> ₹{driver.salary.toLocaleString()}</div>}
          <div><span className='font-medium'>Date Of Joining:</span> {driver.dateOfJoining}</div>
          {driver.referenceNote && <div className='md:col-span-2'><span className='font-medium'>Reference Note:</span> {driver.referenceNote}</div>}
          {driver.document && <div className='md:col-span-2'><span className='font-medium'>Document:</span> <a href={driver.document as string} target='_blank' rel='noopener' className='text-amber-600 underline'>View</a></div>}
          <div><span className='font-medium'>License Expiry:</span> {driver.licenseExpiry}</div>
          <div><span className='font-medium'>Police Verification Expiry:</span> {driver.policeVerificationExpiry}</div>
          {driver.licenseDocument && (
            <div className='md:col-span-2'>
              <span className='font-medium'>License Document:</span>{' '}
              <a
                href={typeof driver.licenseDocument === 'string' ? driver.licenseDocument : driver.licenseDocument.data}
                target='_blank'
                rel='noopener'
                className='text-amber-600 underline'
              >View</a>
            </div>
          )}
          {driver.policeVerificationDocument && (
            <div className='md:col-span-2'>
              <span className='font-medium'>Police Verification Document:</span>{' '}
              <a
                href={typeof driver.policeVerificationDocument === 'string' ? driver.policeVerificationDocument : driver.policeVerificationDocument.data}
                target='_blank'
                rel='noopener'
                className='text-amber-600 underline'
              >View</a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className='text-xl font-semibold text-gray-900'>Advances</h2>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div className='flex flex-col md:flex-row md:items-end md:space-x-3 space-y-2 md:space-y-0'>
            <div className='flex-1'>
              <label className='block text-xs font-medium text-gray-500 mb-1'>Amount</label>
              <input aria-label='Advance amount' value={advAmount} onChange={e=>setAdvAmount(e.target.value)} type='number' className='w-full border rounded px-2 py-1 text-sm'/>
            </div>
            <div className='flex-1'>
              <label className='block text-xs font-medium text-gray-500 mb-1'>Description</label>
              <input aria-label='Advance description' value={advDesc} onChange={e=>setAdvDesc(e.target.value)} placeholder='Advance reason' className='w-full border rounded px-2 py-1 text-sm'/>
            </div>
            <Button size='sm' disabled={!advAmount} onClick={()=>{ addDriverAdvance(driver.id, { amount: parseFloat(advAmount), date: new Date().toISOString().slice(0,10), description: advDesc || 'Advance' }); setAdvAmount(''); setAdvDesc(''); }}>
              <Icon name='plus' className='h-4 w-4 mr-1'/> Add
            </Button>
          </div>
          {driver.advances.length === 0 && <p className='text-gray-500'>No advances.</p>}
          {driver.advances.map(a => {
            const settlementPayment = payments.find(p => p.relatedAdvanceId === a.id);
            return (
              <div key={a.id} className='flex items-center justify-between p-2 border rounded-md'>
                <div>
                  <p className='font-medium'>₹{a.amount.toLocaleString()} {a.settled && <span className='text-green-600'>(Settled)</span>}</p>
                  <p className='text-xs text-gray-500'>{a.description} • {a.date}</p>
                  {settlementPayment && <p className='text-xs text-green-600'>Settled on {new Date(settlementPayment.date).toLocaleDateString()}</p>}
                </div>
                {!a.settled && (
                  <Button size='sm' variant='outline' onClick={() => settleDriverAdvance(driver.id, a.id)}>
                    <Icon name='success' className='h-4 w-4 mr-1'/> Settle
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
          <h2 className='text-xl font-semibold text-gray-900'>Driver Payments</h2>
          <div className='flex items-center gap-2'>
            <Button size='sm' variant={viewMode==='trip'? 'primary':'outline'} onClick={()=>setViewMode('trip')}>Trip-wise</Button>
            <Button size='sm' variant={viewMode==='day'? 'primary':'outline'} onClick={()=>setViewMode('day')}>Per Day</Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          {loadingDriverPayments && <p className='text-gray-500'>Loading payments...</p>}
          {!loadingDriverPayments && viewMode==='trip' && driverPayments.slice(0,15).map(p => {
            const bookingLabel = p.booking ? `${p.booking.pickupLocation || ''}${p.booking.pickupLocation && p.booking.dropLocation ? ' → ' : ''}${p.booking.dropLocation || ''}` : (p.bookingId ? `#${p.bookingId.slice(-6)}` : '—');
            return (
              <div key={p.id} className='p-2 border rounded hover:bg-amber-50 transition cursor-pointer' onClick={()=> p.bookingId && navigate(`/bookings/${p.bookingId}`)}>
                <div className='flex justify-between items-start'>
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='font-medium'>₹{p.amount.toLocaleString()}</span>
                      {p.mode && <span className='px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 border border-amber-300'>{p.mode}</span>}
                      {p.settled && <span className='px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 border border-green-300'>settled</span>}
                    </div>
                    <p className='text-xs text-gray-600'>Date: {new Date(p.date).toLocaleDateString()} • {p.description || 'Payment'}{p.bookingId && <> • Booking: <span className='underline text-amber-700'>{bookingLabel}</span></>}
                    </p>
                    {p.mode==='fuel-basis' && p.fuelQuantity !== undefined && p.fuelRate !== undefined && (
                      <p className='text-xs text-gray-500'>Fuel: {p.fuelQuantity} L × ₹{p.fuelRate} = ₹{(p.computedAmount ?? p.fuelQuantity * p.fuelRate).toLocaleString()}</p>
                    )}
                  </div>
                  <span className={p.type==='paid' ? 'text-red-600 text-sm' : 'text-green-600 text-sm'}>
                    {p.type==='paid' ? '-' : '+'}₹{p.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
          {!loadingDriverPayments && viewMode==='trip' && driverPayments.length===0 && <p className='text-gray-500'>No driver payments yet.</p>}

          {!loadingDriverPayments && viewMode==='day' && perDay.slice(0,30).map(d => (
            <div key={d.date} className='p-2 border rounded bg-gray-50'>
              <div className='flex justify-between'>
                <p className='font-medium'>{d.date}</p>
                <p className='text-sm font-semibold'>₹{d.total.toLocaleString()} <span className='text-xs text-gray-500'>({d.count} payments)</span></p>
              </div>
            </div>
          ))}
          {!loadingDriverPayments && viewMode==='day' && perDay.length===0 && <p className='text-gray-500'>No driver payments yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
};
