import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { vehicleServicingAPI, VehicleServicingDTO } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import toast from 'react-hot-toast';

// (utility ids removed; not needed now)

export const VehicleServicingPage: React.FC = () => {
  const { vehicles, vehiclesLoading } = useApp();
  const location = useLocation() as { state?: { vehicleId?: string } };
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(location.state?.vehicleId || null);
  const [doc, setDoc] = useState<VehicleServicingDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastSavedRef = useRef<string>(''); // holds a JSON snapshot to detect unchanged saves
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedVehicleId) {
      setLoading(true);
      // clear current doc immediately so UI doesn't show stale data when switching vehicles
      setDoc(null);
      vehicleServicingAPI.get(selectedVehicleId)
        .then((d) => { setDoc(d); lastSavedRef.current = JSON.stringify(d || {}); })
        .catch(()=>toast.error('Load servicing failed'))
        .finally(()=>setLoading(false));
    } else {
      setDoc(null);
    }
  }, [selectedVehicleId]);

  const ensureDoc = () => {
    if (!doc && selectedVehicleId) {
      setDoc({ vehicleId: selectedVehicleId, oilChanges: [], partsReplacements: [], tyres: [], installments: [], insurances: [], legalPapers: [] });
    }
  };

  const updateSection = <K extends keyof VehicleServicingDTO, U extends VehicleServicingDTO[K] extends (infer R)[] ? R : never>(section: K, items: U[]) => {
    if (!doc) return; setDoc({ ...doc, [section]: items } as VehicleServicingDTO);
  };

  const addRow = <K extends keyof VehicleServicingDTO, U extends VehicleServicingDTO[K] extends (infer R)[] ? R : never>(section: K, template: U) => {
    ensureDoc();
    if (!doc) return; // after ensureDoc doc may still be null until next render
    const items = ([...(doc[section] as unknown as U[]), template]);
    updateSection(section, items as U[]);
  };

  const removeRow = <K extends keyof VehicleServicingDTO, U extends VehicleServicingDTO[K] extends (infer R)[] ? R : never>(section: K, index: number) => {
    if (!doc) return; const original = doc[section] as unknown as U[]; const arr: U[] = [...original]; arr.splice(index,1); updateSection(section, arr);
  };

  const saveAll = async () => {
    if (!selectedVehicleId || !doc || saving) return;
    // Avoid duplicate save if nothing changed
    const snapshot = JSON.stringify(doc);
    if (snapshot === lastSavedRef.current) {
      toast.success('No changes to save');
      return;
    }
    try {
      setSaving(true);
  // merge but ensure vehicleId set explicitly (avoid duplicate key warning)
  const clone: VehicleServicingDTO = { ...doc, vehicleId: selectedVehicleId };
  const toSave: VehicleServicingDTO = clone;
      const saved = await vehicleServicingAPI.upsert(selectedVehicleId, toSave);
      setDoc(saved);
      lastSavedRef.current = JSON.stringify(saved || {});
      toast.success('Servicing saved');
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const sectionHeader = (title: string, onAdd: () => void) => (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}><Icon name="plus" className="h-4 w-4 mr-1"/>Add Row</Button>
    </div>
  );

  const numberInput = (label: string, value: number | undefined, onChange: (v: number)=>void, placeholder?: string) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type="number" value={value} onChange={e=>onChange(parseFloat(e.target.value)||0)} className="w-full border-gray-300 rounded-md text-sm focus:ring-amber-500 focus:border-amber-500" placeholder={placeholder} />
    </div>
  );

  const textInput = (label: string, value: string | undefined, onChange: (v: string)=>void, placeholder?: string) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input value={value} onChange={e=>onChange(e.target.value)} className="w-full border-gray-300 rounded-md text-sm focus:ring-amber-500 focus:border-amber-500" placeholder={placeholder} />
    </div>
  );

  const dateInput = (label: string, value: string | undefined, onChange: (v: string)=>void) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type="date" title={label} placeholder={label} value={value?.slice(0,10) || ''} onChange={e=>onChange(e.target.value)} className="w-full border-gray-300 rounded-md text-sm focus:ring-amber-500 focus:border-amber-500" />
    </div>
  );

  const renderOilChanges = () => doc && (
    <Card>
      <CardHeader>{sectionHeader('Oil Changes', ()=>addRow('oilChanges', { price:0, kilometers:0 }))}</CardHeader>
      <CardContent className="space-y-4">
        {(doc.oilChanges||[]).map((o,i)=>(
          <div key={i} className="relative grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-3 rounded-md">
            {numberInput('Price', o.price, v=>updateField('oilChanges', i, 'price', v))}
            {numberInput('Kilometers', o.kilometers, v=>updateField('oilChanges', i, 'kilometers', v))}
            {dateInput('Date', o.date, v=>updateField('oilChanges', i, 'date', v))}
            <button type="button" onClick={()=>removeRow('oilChanges', i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 text-xs">×</button>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const updateField = <K extends keyof VehicleServicingDTO, U extends VehicleServicingDTO[K] extends (infer R)[] ? R : never>(section: K, index: number, key: string, value: unknown) => {
    if (!doc) return; const original = doc[section] as unknown as U[]; const arr: U[] = [...original];
    const current = arr[index] as unknown as Record<string, unknown>;
    const updated = { ...current, [key]: value } as unknown as U;
    arr[index] = updated;
    updateSection(section, arr);
  };

  const renderParts = () => doc && (
    <Card>
      <CardHeader>{sectionHeader('Parts Replacement', ()=>addRow('partsReplacements', { part:'', price:0 }))}</CardHeader>
      <CardContent className="space-y-4">
        {(doc.partsReplacements||[]).map((p,i)=>(
          <div key={i} className="relative grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-3 rounded-md">
            {textInput('Part', p.part, v=>updateField('partsReplacements', i, 'part', v))}
            {numberInput('Price', p.price, v=>updateField('partsReplacements', i, 'price', v))}
            {dateInput('Date', p.date, v=>updateField('partsReplacements', i, 'date', v))}
            <button type="button" onClick={()=>removeRow('partsReplacements', i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 text-xs">×</button>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderTyres = () => doc && (
    <Card>
      <CardHeader>{sectionHeader('Tyres', ()=>addRow('tyres', { details:'', price:0 }))}</CardHeader>
      <CardContent className="space-y-4">
        {(doc.tyres||[]).map((t,i)=>(
          <div key={i} className="relative grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-3 rounded-md">
            {textInput('Details', t.details, v=>updateField('tyres', i, 'details', v))}
            {numberInput('Price', t.price, v=>updateField('tyres', i, 'price', v))}
            {dateInput('Date', t.date, v=>updateField('tyres', i, 'date', v))}
            <button type="button" onClick={()=>removeRow('tyres', i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 text-xs">×</button>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderInstallments = () => doc && (
    <Card>
      <CardHeader>{sectionHeader('Installments / EMI', ()=>addRow('installments', { description:'', amount:0 }))}</CardHeader>
      <CardContent className="space-y-4">
        {(doc.installments||[]).map((t,i)=>(
          <div key={i} className="relative grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-3 rounded-md">
            {textInput('Description', t.description, v=>updateField('installments', i, 'description', v))}
            {numberInput('Amount', t.amount, v=>updateField('installments', i, 'amount', v))}
            {dateInput('Date', t.date, v=>updateField('installments', i, 'date', v))}
            <button type="button" onClick={()=>removeRow('installments', i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 text-xs">×</button>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderInsurance = () => doc && (
    <Card>
      <CardHeader>{sectionHeader('Insurance', ()=>addRow('insurances', { provider:'', policyNumber:'', cost:0, validFrom:'', validTo:'' }))}</CardHeader>
      <CardContent className="space-y-4">
        {(doc.insurances||[]).map((ins,i)=>(
          <div key={i} className="relative grid grid-cols-1 md:grid-cols-5 gap-4 bg-gray-50 p-3 rounded-md">
            {textInput('Provider', ins.provider, v=>updateField('insurances', i, 'provider', v))}
            {textInput('Policy #', ins.policyNumber, v=>updateField('insurances', i, 'policyNumber', v))}
            {numberInput('Cost', ins.cost, v=>updateField('insurances', i, 'cost', v))}
            {dateInput('Valid From', ins.validFrom, v=>updateField('insurances', i, 'validFrom', v))}
            {dateInput('Valid To', ins.validTo, v=>updateField('insurances', i, 'validTo', v))}
            <button type="button" onClick={()=>removeRow('insurances', i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 text-xs">×</button>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderLegal = () => doc && (
    <Card>
      <CardHeader>{sectionHeader('Pollution / Legal Papers', ()=>addRow('legalPapers', { type:'pollution', description:'', cost:0, expiryDate:'' }))}</CardHeader>
      <CardContent className="space-y-4">
        {(doc.legalPapers||[]).map((lp,i)=>(
          <div key={i} className="relative grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-3 rounded-md">
            {textInput('Type', lp.type, v=>updateField('legalPapers', i, 'type', v))}
            {textInput('Description', lp.description, v=>updateField('legalPapers', i, 'description', v))}
            {numberInput('Cost', lp.cost, v=>updateField('legalPapers', i, 'cost', v))}
            {dateInput('Expiry', lp.expiryDate, v=>updateField('legalPapers', i, 'expiryDate', v))}
            <button type="button" onClick={()=>removeRow('legalPapers', i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 text-xs">×</button>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={()=>navigate('/vehicles')}><Icon name="back" className="h-4 w-4 mr-1"/>Back</Button>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Servicing</h1>
        </div>
  {selectedVehicleId && <Button onClick={saveAll} disabled={loading || saving || !doc}><Icon name="file" className="h-4 w-4 mr-1"/>{saving?'Saving...':'Save'}</Button>}
      </div>

      <Card>
        <CardHeader><h2 className="text-lg font-semibold text-gray-800">Select Vehicle</h2></CardHeader>
        <CardContent>
          {vehiclesLoading ? <div className="text-sm text-gray-500">Loading vehicles...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vehicles
                .filter((v) => v.owner === "owned")
                .map(v => {
                const isActive = selectedVehicleId===v.id;
                const handleClick = () => {
                  // toggle collapse if same vehicle clicked
                  if (isActive) {
                    setSelectedVehicleId(null);
                    return;
                  }
                  setSelectedVehicleId(v.id);
                };
                return (
                  <button key={v.id} onClick={handleClick} className={`border rounded-md p-3 text-left transition hover:border-amber-500 ${isActive?'border-amber-500 bg-amber-50 shadow-inner':''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{v.registrationNumber}</p>
                        <p className="text-xs text-gray-500 capitalize">{v.category}</p>
                      </div>
                      <Icon name={isActive ? 'chevronUp' : 'chevronDown'} className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVehicleId && (
        <div className="transition-all">
          {loading && <div className="text-sm text-gray-500">Loading servicing...</div>}
          {!loading && doc && (
            <div className="space-y-6">
              {renderOilChanges()}
              {renderParts()}
              {renderTyres()}
              {renderInstallments()}
              {renderInsurance()}
              {renderLegal()}
            </div>
          )}
          {!loading && !doc && <div className="text-sm text-gray-500">No data yet. Add a row in any section to start.</div>}
        </div>
      )}
    </div>
  );
};
