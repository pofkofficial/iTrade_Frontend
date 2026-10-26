import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiPlus, FiLoader, FiTrash } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '@utils/api';

const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

const field = (label, children) => (
  <div>
    <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const PhoneModal = ({ phone, onClose, onSave }) => {
  const isEdit         = !!phone;
  const currentPhoneId = phone?.id;

  const [formData, setFormData] = useState({
    brand:            phone?.brand            || 'Samsung',
    model:            phone?.model            || '',
    display_size:     phone?.display_size     || '',
    camera_details:   phone?.camera_details   || '',
    battery_capacity: phone?.battery_capacity || '',
    physical_sim:     phone?.physical_sim     ?? false,
    esim:             phone?.esim             ?? false,
    number_of_sims:   phone?.number_of_sims   ?? 1,
    link:             phone?.link             || '',
    thumbnail:        null,
  });

  const [thumbnailPreview, setThumbnailPreview] = useState(phone?.thumbnail || null);
  const [variants,         setVariants]         = useState([]);
  const [originalVariants, setOriginalVariants] = useState([]);
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [isLoading,        setIsLoading]        = useState(isEdit);
  const [loadError,        setLoadError]        = useState(null);

  // ── load existing variants when editing ───────────────────────────────────
  useEffect(() => {
    if (!isEdit || !currentPhoneId) {
      setVariants([{ id: null, storage_capacity: '', price: '', old_price: '', availability: true }]);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);

    api.get(`/phone/storage-selector/${currentPhoneId}/`)
      .then(res => {
        if (!mounted) return;
        const loaded = (res.data?.storage_variants || []).map(v => ({
          id:               v.id,
          storage_capacity: v.storage_capacity || '',
          price:            v.price    != null ? String(v.price)    : '',
          old_price:        v.old_price != null ? String(v.old_price) : '',
          availability:     v.availability !== undefined ? v.availability : true,
        }));
        setVariants(loaded);
        setOriginalVariants(JSON.parse(JSON.stringify(loaded)));
      })
      .catch(err => {
        console.error('Load variants failed:', err);
        if (mounted) {
          setLoadError('Failed to load variants');
          toast.error('Could not load variants');
        }
      })
      .finally(() => { if (mounted) setIsLoading(false); });

    return () => { mounted = false; };
  }, [isEdit, currentPhoneId]);

  // ── field handlers ────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleThumbnail = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return toast.error('Select a valid image');
    setThumbnailPreview(URL.createObjectURL(file));
    setFormData(p => ({ ...p, thumbnail: file }));
  };

  // ── variant handlers ──────────────────────────────────────────────────────
  const addVariant = () =>
    setVariants(prev => [
      ...prev,
      { id: null, storage_capacity: '', price: '', old_price: '', availability: true },
    ]);

  const updateVariant = (idx, field, value) =>
    setVariants(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });

  const removeVariant = (idx) =>
    setVariants(prev => prev.filter((_, i) => i !== idx));

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const fd = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (val == null) return;
      fd.append(key, val instanceof File ? val : String(val));
    });

    try {
      let phoneId = currentPhoneId;

      if (isEdit) {
        await api.patch(`/phones/${phoneId}/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        const res = await api.post('/phones/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        phoneId = res.data.id;
      }

      // ── variant sync ──────────────────────────────────────────────────────
      const currIds = new Set(variants.map(v => v.id).filter(Boolean));

      // delete removed variants
      for (const ov of originalVariants) {
        if (ov.id && !currIds.has(ov.id)) {
          await api.delete(`/phone/storage/${ov.id}/`);
        }
      }

      for (const v of variants) {
        const payload = {
          storage_capacity: v.storage_capacity,
          price:            Number(v.price)    || 0,
          old_price:        v.old_price ? Number(v.old_price) : null,
          availability:     v.availability,
        };

        if (v.id) {
          // only PATCH if something changed
          const orig = originalVariants.find(o => o.id === v.id);
          const changed = orig && (
            String(orig.price)            !== String(v.price)           ||
            String(orig.old_price  || '') !== String(v.old_price  || '') ||
            orig.availability             !== v.availability
          );
          if (changed) await api.patch(`/phone/storage/${v.id}/`, payload);
        } else {
          if (!v.storage_capacity) { toast.error('Select storage for all new variants'); continue; }
          await api.post('/phone/storage/', { ...payload, phone: phoneId });
        }
      }

      toast.success(isEdit ? 'Phone updated' : 'Phone created');
      onSave?.();
      onClose();
    } catch (err) {
      console.error('Submit error:', err);
      console.error("Backend response:", error.response?.data);
      console.error("HTTP status:", error.response?.status);
      console.log(
        "Django validation response:",
        JSON.stringify(error.response?.data, null, 2)
      );
          } finally {
      setIsSubmitting(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 32 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 space-y-8">

          {/* header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-neutral-900">
              {isEdit ? 'Edit Phone' : 'Add Phone'}
            </h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-800 transition">
              <FiX size={24} />
            </button>
          </div>

          {loadError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {loadError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ── Basic info ── */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
                Basic Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('Brand',
                  <select name="brand" value={formData.brand} onChange={handleChange} className={inputCls}>
                    <option value="Samsung">Samsung</option>
                    <option value="Google">Google</option>
                  </select>
                )}
                {field('Model *',
                  <input name="model" value={formData.model} onChange={handleChange}
                    required className={inputCls} placeholder="e.g. Galaxy S24 Ultra" />
                )}
                {field('Display Size',
                  <input name="display_size" value={formData.display_size} onChange={handleChange}
                    className={inputCls} placeholder='e.g. 6.8"' />
                )}
                {field('Camera',
                  <input name="camera_details" value={formData.camera_details} onChange={handleChange}
                    className={inputCls} placeholder="e.g. 200MP + 12MP + 10MP" />
                )}
                {field('Battery',
                  <input name="battery_capacity" value={formData.battery_capacity} onChange={handleChange}
                    className={inputCls} placeholder="e.g. 5000mAh" />
                )}
                {field('Spec Link',
                  <input name="link" value={formData.link} onChange={handleChange}
                    className={inputCls} placeholder="https://..." />
                )}
              </div>
            </section>

            {/* ── Network ── */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
                Network & SIM
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: 'physical_sim', label: 'Physical SIM' },
                  { name: 'esim',         label: 'eSIM'         },
                ].map(({ name, label }) => (
                  <label key={name} className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input type="checkbox" name={name} checked={!!formData[name]}
                      onChange={handleChange}
                      className="h-4 w-4 rounded text-blue-600 border-neutral-300 focus:ring-blue-500" />
                    <span className="text-sm text-neutral-700">{label}</span>
                  </label>
                ))}
                {field('SIMs',
                  <select name="number_of_sims" value={formData.number_of_sims}
                    onChange={handleChange} className={inputCls}>
                    <option value={1}>1 SIM</option>
                    <option value={2}>2 SIMs</option>
                  </select>
                )}
              </div>
            </section>

            {/* ── Thumbnail ── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
                Thumbnail
              </h3>
              {thumbnailPreview ? (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-neutral-200">
                  <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-contain" />
                  <button type="button"
                    onClick={() => { setThumbnailPreview(null); setFormData(p => ({ ...p, thumbnail: null })); }}
                    className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow"
                  >×</button>
                </div>
              ) : (
                <label className="inline-flex items-center justify-center w-32 h-32 border-2 border-dashed border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50 transition">
                  <input type="file" accept="image/*" onChange={handleThumbnail} className="hidden" />
                  <span className="text-sm text-neutral-400">Upload</span>
                </label>
              )}
            </section>

            {/* ── Variants ── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
                  Storage Variants
                </h3>
                <button type="button" onClick={addVariant}
                  disabled={isLoading || isSubmitting}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-40">
                  <FiPlus size={15} /> Add Variant
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-10 gap-3 text-neutral-400">
                  <FiLoader className="animate-spin" size={20} />
                  <span className="text-sm">Loading variants...</span>
                </div>
              ) : variants.length === 0 ? (
                <div className="text-center py-10 text-sm text-neutral-400 bg-neutral-50 rounded-xl border border-dashed">
                  No variants — add one above
                </div>
              ) : (
                <div className="space-y-3">
                  {variants.map((v, idx) => (
                    <div key={idx}
                      className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200 items-end">

                      {/* Storage */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Storage</label>
                        <select value={v.storage_capacity}
                          onChange={e => updateVariant(idx, 'storage_capacity', e.target.value)}
                          disabled={!!v.id}
                          className={`${inputCls} disabled:bg-neutral-100 disabled:text-neutral-400`}>
                          <option value="">Select</option>
                          {STORAGE_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Price */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Price (GHS)</label>
                        <input type="number" step="0.01" min="0" value={v.price}
                          onChange={e => updateVariant(idx, 'price', e.target.value)}
                          className={inputCls} placeholder="0.00" />
                      </div>

                      {/* Old Price */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Old Price</label>
                        <input type="number" step="0.01" min="0" value={v.old_price}
                          onChange={e => updateVariant(idx, 'old_price', e.target.value)}
                          className={inputCls} placeholder="0.00" />
                      </div>

                      {/* Availability toggle */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-neutral-500">Availability</label>
                        <button type="button"
                          onClick={() => updateVariant(idx, 'availability', !v.availability)}
                          role="switch"
                          aria-checked={v.availability}
                          className={`
                            relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
                            border-2 border-transparent transition-colors duration-200
                            focus:outline-none
                            ${v.availability ? 'bg-green-500' : 'bg-neutral-300'}
                          `}
                        >
                          <span className={`
                            pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
                            transform transition-transform duration-200
                            ${v.availability ? 'translate-x-5' : 'translate-x-0'}
                          `} />
                        </button>
                        <span className={`text-xs font-medium ${v.availability ? 'text-green-600' : 'text-neutral-400'}`}>
                          {v.availability ? 'Available' : 'Out of stock'}
                        </span>
                      </div>

                      {/* Delete */}
                      <div className="flex justify-end">
                        <button type="button" onClick={() => removeVariant(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                          <FiTrash size={16} />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Actions ── */}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} disabled={isSubmitting}
                className="px-5 py-2.5 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50 transition disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting || isLoading}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition hover:bg-blue-700">
                {isSubmitting && <FiLoader className="animate-spin" size={14} />}
                {isEdit ? 'Save Changes' : 'Create Phone'}
              </button>
            </div>

          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PhoneModal;