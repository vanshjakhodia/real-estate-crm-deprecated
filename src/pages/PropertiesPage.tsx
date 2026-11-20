import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext';
import { Property } from '../types/crm';
import {
  Building2,
  Plus,
  FileSpreadsheet,
  MapPin,
  ExternalLink,
  ShieldCheck,
  X,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { formatIndianCurrency } from '../lib/utils';
import { exportPropertiesToExcel } from '../lib/excel';

interface PropertiesPageProps {
  onBack?: () => void;
}

export const PropertiesPage: React.FC<PropertiesPageProps> = ({ onBack }) => {
  const { properties, addProperty, updateProperty, archiveProperty, currentRole } = useCrm();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const [form, setForm] = useState<Partial<Property>>({
    project_name: '',
    location: 'Civil Lines, Kanpur',
    property_type: 'Apartment',
    bhk: '3 & 4 BHK',
    carpet_area: 1850,
    price_min: 8000000,
    price_max: 15000000,
    payment_plan: 'Construction Linked Plan (CLP)',
    rera_number: 'UPRERAPRJ' + Math.floor(100000 + Math.random() * 900000),
    brochure_url: '',
    status: 'available',
    description: ''
  });

  const handleOpenAdd = () => {
    setEditingProperty(null);
    setForm({
      project_name: '',
      location: 'Civil Lines, Kanpur',
      property_type: 'Apartment',
      bhk: '3 & 4 BHK',
      carpet_area: 1850,
      price_min: 8000000,
      price_max: 15000000,
      payment_plan: 'Construction Linked Plan (CLP)',
      rera_number: 'UPRERAPRJ' + Math.floor(100000 + Math.random() * 900000),
      brochure_url: '',
      status: 'available',
      description: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (prop: Property) => {
    setEditingProperty(prop);
    setForm(prop);
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.project_name || !form.description) {
      alert('Estate title and description are required.');
      return;
    }

    if (editingProperty) {
      updateProperty(editingProperty.id, form);
    } else {
      addProperty(form);
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-normal text-[#F4EFE6]">
              Estate Portfolio & Catalog
            </h2>
            <span className="flex items-center gap-1.5 rounded px-2.5 py-0.5 text-[10px] font-mono tracking-widest uppercase badge-gold font-sans">
              <Sparkles className="h-3 w-3 text-[#C2A675]" />
              <span>AI Ground Truth</span>
            </span>
          </div>
          <p className="text-xs text-[#8C8477] mt-1">
            Gemini AI uses this verified ledger exclusively to quote pricing, RERA credentials, and Kanpur localities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportPropertiesToExcel(properties)}
            className="flex items-center gap-2 rounded-lg border border-[#352F26] bg-[#1A1814] px-4 py-2 text-xs font-medium text-[#D5CEBF] hover:bg-[#221F1A]"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#9DBFA5]" />
            <span>Export Portfolio (.xlsx)</span>
          </button>

          {currentRole === 'admin' && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-4 py-2 text-xs font-medium text-[#11100E] border border-[#A68A56] transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Register Estate</span>
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {properties.length === 0 ? (
        <div className="rounded-xl border border-[#2E2820] bg-[#161411] p-12 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#221F1A] border border-[#383126] text-[#C2A675]">
            <Building2 className="h-7 w-7 stroke-[1.4]" />
          </div>
          <h3 className="font-serif font-bold text-[#F4EFE6] text-lg">No Properties Registered Yet</h3>
          <p className="text-xs text-[#8C8477] max-w-md mx-auto leading-relaxed">
            Record your authentic Kanpur developments (apartments, residential plots, commercial suites, villas) with certified RERA numbers and price bands. Gemini AI uses this as its ground truth.
          </p>
          {currentRole === 'admin' && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-5 py-2 text-xs font-medium text-[#11100E]"
            >
              <Plus className="h-4 w-4" />
              <span>Register First Estate</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((prop) => {
            const isAvailable = prop.status === 'available';
            return (
              <div
                key={prop.id}
                className={`flex flex-col justify-between rounded-xl border bg-[#181613] p-5 shadow-xs transition-all ${
                  isAvailable
                    ? 'border-[#2E2820] hover:border-[#443C30]'
                    : 'border-[#2E2820] opacity-60'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded px-2.5 py-0.5 text-[10px] font-mono tracking-wider uppercase badge-gold">
                      {prop.property_type} {prop.bhk ? `• ${prop.bhk}` : ''}
                    </span>
                    <span
                      className={`rounded px-2.5 py-0.5 text-[10px] font-mono tracking-wider uppercase ${
                        isAvailable ? 'badge-forest' : 'badge-stone'
                      }`}
                    >
                      {isAvailable ? 'Available' : 'Archived / Sold'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#F4EFE6]">{prop.project_name}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-[#8C8477] font-medium">
                      <MapPin className="h-3.5 w-3.5 text-[#C2A675] shrink-0" />
                      <span>{prop.location}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#28231C] bg-[#12110E] p-3.5 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[#8C8477]">Valuation Band:</span>
                      <span className="font-serif font-bold text-[#C2A675] text-sm">
                        {formatIndianCurrency(prop.price_min)} - {formatIndianCurrency(prop.price_max)}
                      </span>
                    </div>
                    {prop.carpet_area && (
                      <div className="flex justify-between items-center">
                        <span className="text-[#8C8477]">Carpet Area:</span>
                        <span className="font-mono text-[#D5CEBF]">{prop.carpet_area} sq.ft</span>
                      </div>
                    )}
                    {prop.payment_plan && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#8C8477]">Payment Structure:</span>
                        <span className="text-[#A8A194] truncate max-w-[160px]">{prop.payment_plan}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-[#A8A194] line-clamp-3 leading-relaxed">
                    {prop.description}
                  </p>

                  {prop.rera_number && (
                    <div className="flex items-center gap-1.5 text-[11px] badge-forest rounded px-2.5 py-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#9DBFA5] shrink-0" />
                      <span className="font-mono">RERA: {prop.rera_number}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="mt-5 flex items-center justify-between border-t border-[#26221B] pt-3 text-xs">
                  {prop.brochure_url ? (
                    <a
                      href={prop.brochure_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[11px] font-medium text-[#C2A675] hover:text-[#D5BE8F] transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Brochure</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-[#736B5F]">Brochure on request</span>
                  )}

                  {currentRole === 'admin' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(prop)}
                        className="rounded border border-[#352F26] bg-[#221F1A] px-2.5 py-1 text-[11px] font-medium text-[#D5CEBF] hover:bg-[#2A2620]"
                      >
                        Edit
                      </button>
                      {isAvailable && (
                        <button
                          onClick={() => archiveProperty(prop.id)}
                          className="rounded border border-[#482D27] bg-[#2A1D1A] px-2.5 py-1 text-[11px] font-medium text-[#BFA0A0] hover:bg-[#34221E]"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT PROPERTY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0A09]/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-[#181613] p-6 shadow-2xl border border-[#383126] text-[#EAE5D9] text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2C2720] pb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex items-center gap-1 text-xs text-[#C2A675] hover:text-[#F4EFE6] px-2 py-1 rounded bg-[#221F1A] border border-[#3E362A] transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#F4EFE6]">
                    {editingProperty ? 'Edit Estate Records' : 'Register Kanpur Estate'}
                  </h3>
                  <p className="text-[11px] text-[#8C8477]">Details form the AI Knowledge Base for buyer inquiries</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-[#8C8477] hover:bg-[#221F1A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="font-medium text-[#C8C2B5]">Estate Title *</label>
                <input
                  type="text"
                  required
                  value={form.project_name || ''}
                  onChange={(e) => setForm({ ...form, project_name: e.target.value })}
                  placeholder="e.g. Ganga Heights Luxury Towers"
                  className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#C8C2B5]">Kanpur Locality *</label>
                  <input
                    type="text"
                    required
                    value={form.location || ''}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Civil Lines, Kanpur"
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#C8C2B5]">Property Classification *</label>
                  <select
                    value={form.property_type || 'Apartment'}
                    onChange={(e) => setForm({ ...form, property_type: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] focus:border-[#C2A675] focus:outline-none"
                  >
                    <option value="Apartment">Apartment Suite</option>
                    <option value="Plot">Residential Plot</option>
                    <option value="Commercial">Commercial / Retail</option>
                    <option value="Villa">Independent Villa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#C8C2B5]">Configuration</label>
                  <input
                    type="text"
                    value={form.bhk || ''}
                    onChange={(e) => setForm({ ...form, bhk: e.target.value })}
                    placeholder="e.g. 3 & 4 BHK"
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#C8C2B5]">Carpet Area (sqft)</label>
                  <input
                    type="number"
                    value={form.carpet_area || ''}
                    onChange={(e) => setForm({ ...form, carpet_area: Number(e.target.value) })}
                    placeholder="e.g. 2150"
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#C8C2B5]">Base Valuation (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.price_min || ''}
                    onChange={(e) => setForm({ ...form, price_min: Number(e.target.value) })}
                    placeholder="e.g. 14500000"
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#C8C2B5]">Ceiling Valuation (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.price_max || ''}
                    onChange={(e) => setForm({ ...form, price_max: Number(e.target.value) })}
                    placeholder="e.g. 22500000"
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#C8C2B5]">RERA Registration</label>
                  <input
                    type="text"
                    value={form.rera_number || ''}
                    onChange={(e) => setForm({ ...form, rera_number: e.target.value })}
                    placeholder="UPRERAPRJ882190"
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#C8C2B5]">Catalog Status</label>
                  <select
                    value={form.status || 'available'}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] focus:border-[#C2A675] focus:outline-none"
                  >
                    <option value="available">Available in Catalog</option>
                    <option value="sold_out">Archived / Sold Out</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-[#C8C2B5]">Payment Structure</label>
                <input
                  type="text"
                  value={form.payment_plan || ''}
                  onChange={(e) => setForm({ ...form, payment_plan: e.target.value })}
                  placeholder="e.g. 20:80 Construction Linked / Bank Subvention"
                  className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-[#C8C2B5]">Brochure URL</label>
                <input
                  type="url"
                  value={form.brochure_url || ''}
                  onChange={(e) => setForm({ ...form, brochure_url: e.target.value })}
                  placeholder="https://domain.com/brochure.pdf"
                  className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-[#C8C2B5]">Description (Strict AI Ground Truth) *</label>
                <textarea
                  rows={3}
                  required
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Accurate details regarding amenities, possession timeline, construction quality, parking..."
                  className="mt-1 w-full rounded-lg border border-[#332D24] bg-[#11100E] p-2.5 text-[#EAE5D9] placeholder-[#736B5F] focus:border-[#C2A675] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#2C2720]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-[#352F26] px-4 py-2 font-medium text-[#8C8477] hover:text-[#EAE5D9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#C2A675] hover:bg-[#B39562] px-5 py-2 font-medium text-[#11100E]"
                >
                  Save to Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
