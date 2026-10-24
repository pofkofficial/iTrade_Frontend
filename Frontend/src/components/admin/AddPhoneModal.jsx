// AddPhoneModal.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiPlus, FiLoader, FiTrash } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '@utils/api';

const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

const PhoneModal = ({ phone, onClose, onSave }) => {
  const isEdit = !!phone;
  const currentPhoneId = phone?.id;

  // Form state
  const [formData, setFormData] = useState({
    brand: phone?.brand || 'Samsung',
    model: phone?.model || '',
    display_size: phone?.display_size || '6.1 inches',
    camera_details: phone?.camera_details || '',
    battery_capacity: phone?.battery_capacity || '5000mAh',
    physical_sim: phone?.physical_sim ?? false,
    esim: phone?.esim ?? false,
    number_of_sims: phone?.number_of_sims ?? 1,
    support_5G: phone?.support_5G ?? false,
    Fingerprint: phone?.Fingerprint ?? false,
    FaceScanner: phone?.FaceScanner ?? false,
    Iris_scanner: phone?.Iris_scanner ?? false,
    link: phone?.link || '',
    thumbnail: null,
    photo_1: null,
    photo_2: null,
    photo_3: null,
  });

  const [imagePreviews, setImagePreviews] = useState({
    thumbnail: phone?.thumbnail || null,
    photo_1: phone?.photo_1 || null,
    photo_2: phone?.photo_2 || null,
    photo_3: phone?.photo_3 || null,
  });

  // Variants
  const [variants, setVariants] = useState([]);
  const [originalVariants, setOriginalVariants] = useState([]);
  const [ramOptions, setRamOptions] = useState([]);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Load RAM + variants
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        // Load RAM options – filter by current phone when editing
        let ramUrl = '/phone/ram/';
        if (isEdit && currentPhoneId) {
          ramUrl += `?phone=${currentPhoneId}`;
        }

        const ramRes = await api.get(ramUrl);
        if (mounted) {
          setRamOptions(Array.isArray(ramRes.data) ? ramRes.data : []);
        }

        // Load existing variants when editing
        if (isEdit && currentPhoneId) {
          const variantRes = await api.get(`/phone/storage-selector/${currentPhoneId}/`);
          if (mounted && variantRes.data?.storage_variants) {
            const loaded = variantRes.data.storage_variants.map(v => ({
              id: v.id,
              ram: v.ram?.id || '',
              ramName: v.ram?.ram || '—',
              storage_capacity: v.storage_capacity || '',
              price: v.price != null ? String(v.price) : '',
              old_price: v.old_price != null ? String(v.old_price) : '',
              stock: v.stock != null ? String(v.stock) : '0',
            }));

            setVariants(loaded);
            setOriginalVariants(JSON.parse(JSON.stringify(loaded)));
          }
        } else {
          // New phone → one empty slot (RAM will be selected later)
          setVariants([{ id: null, ram: '', ramName: '', storage_capacity: '', price: '', old_price: '', stock: '10' }]);
        }
      } catch (err) {
        console.error('Load failed:', err);
        if (mounted) {
          setLoadError('Failed to load RAM options or variants');
          toast.error('Could not load required data');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();

    return () => { mounted = false; };
  }, [isEdit, currentPhoneId]);

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImage = (e, field) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return toast.error('Select a valid image');
    const preview = URL.createObjectURL(file);
    setImagePreviews(p => ({ ...p, [field]: preview }));
    setFormData(p => ({ ...p, [field]: file }));
  };

  const addVariant = () => {
    setVariants(prev => [
      ...prev,
      { id: null, ram: '', ramName: '', storage_capacity: '', price: '', old_price: '', stock: '10' },
    ]);
  };

  const updateVariant = (index, field, value) => {
    setVariants(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeVariant = (index) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const fd = new FormData();

    Object.entries(formData).forEach(([key, val]) => {
      if (val == null) return;
      if (val instanceof File) fd.append(key, val);
      else fd.append(key, val);
    });

    try {
      let phoneId = phone?.id;

      if (isEdit) {
        await api.put(`/phones/${phoneId}/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        const res = await api.post('/phones/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        phoneId = res.data.id;
      }

      // Variant sync (edit mode)
      if (isEdit) {
        const origIds = new Set(originalVariants.map(v => v.id).filter(Boolean));
        const currIds = new Set(variants.map(v => v.id).filter(Boolean));

        // Delete removed
        for (const ov of originalVariants) {
          if (ov.id && !currIds.has(ov.id)) {
            await api.delete(`/phone/storage/${ov.id}/`);
          }
        }

        // Update existing + create new
        for (const v of variants) {
          const data = {
            storage_capacity: v.storage_capacity || '',
            price: Number(v.price) || 0,
            old_price: v.old_price ? Number(v.old_price) : null,
            stock: Number(v.stock) || 0,
          };

          if (v.id) {
            // PATCH existing
            const orig = originalVariants.find(o => o.id === v.id);
            if (orig && (
              String(orig.price) !== String(v.price) ||
              String(orig.old_price || '') !== String(v.old_price || '') ||
              String(orig.stock) !== String(v.stock)
            )) {
              await api.patch(`/phone/storage/${v.id}/`, data);
            }
          } else {
            // POST new – ensure RAM is selected
            if (!v.ram) {
              toast.error('Please select a RAM for the new variant');
              continue;
            }

            await api.post('/phone/storage/', {
              ...data,
              phone: phoneId,
              ram: v.ram,
            });
          }
        }
      }

      toast.success(isEdit ? 'Phone & variants updated' : 'Phone & variants created');
      onClose();
    } catch (err) {
      console.error('Submit error:', err);
      const errMsg = err.response?.data?.detail || 
                     err.response?.data?.ram?.[0] || 
                     err.response?.data?.phone?.[0] || 
                     'Failed to save';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">
              {isEdit ? 'Edit Phone' : 'Add New Phone'}
            </h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
              <FiX size={28} />
            </button>
          </div>

          {loadError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {loadError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <select name="brand" value={formData.brand} onChange={handleChange} className="w-full border rounded px-4 py-2">
                  <option value="Samsung">Samsung</option>
                  <option value="Google">Google</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Model *</label>
                <input name="model" value={formData.model} onChange={handleChange} required className="w-full border rounded px-4 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Display Size</label>
                <input name="display_size" value={formData.display_size} onChange={handleChange} className="w-full border rounded px-4 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Camera Details</label>
                <input name="camera_details" value={formData.camera_details} onChange={handleChange} className="w-full border rounded px-4 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Battery Capacity</label>
                <input name="battery_capacity" value={formData.battery_capacity} onChange={handleChange} className="w-full border rounded px-4 py-2" />
              </div>
            </div>

            {/* Network & Security */}
            <div className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h4 className="text-lg font-semibold mb-4">Network & Security</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <input
                    id="physical_sim"
                    name="physical_sim"
                    type="checkbox"
                    checked={formData.physical_sim}
                    onChange={handleChange}
                    className="mt-1 h-5 w-5 text-blue-600 rounded border-gray-300"
                  />
                  <label htmlFor="physical_sim" className="ml-3 text-sm">Physical SIM support</label>
                </div>

                <div className="flex items-start">
                  <input
                    id="esim"
                    name="esim"
                    type="checkbox"
                    checked={formData.esim}
                    onChange={handleChange}
                    className="mt-1 h-5 w-5 text-blue-600 rounded border-gray-300"
                  />
                  <label htmlFor="esim" className="ml-3 text-sm">eSIM support</label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Number of SIMs</label>
                  <select
                    name="number_of_sims"
                    value={formData.number_of_sims}
                    onChange={handleChange}
                    className="w-full border rounded px-4 py-2"
                  >
                    <option value={1}>Single SIM</option>
                    <option value={2}>Dual SIM</option>
                  </select>
                </div>

                <div className="flex items-start">
                  <input
                    id="support_5G"
                    name="support_5G"
                    type="checkbox"
                    checked={formData.support_5G}
                    onChange={handleChange}
                    className="mt-1 h-5 w-5 text-blue-600 rounded border-gray-300"
                  />
                  <label htmlFor="support_5G" className="ml-3 text-sm">5G support</label>
                </div>

                {/* Biometrics */}
                <div className="col-span-full mt-4">
                  <p className="text-sm font-medium mb-2">Biometric Security</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <input
                        id="Fingerprint"
                        name="Fingerprint"
                        type="checkbox"
                        checked={formData.Fingerprint}
                        onChange={handleChange}
                        className="h-5 w-5 text-blue-600 rounded"
                      />
                      <label htmlFor="Fingerprint" className="ml-3 text-sm">Fingerprint</label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="FaceScanner"
                        name="FaceScanner"
                        type="checkbox"
                        checked={formData.FaceScanner}
                        onChange={handleChange}
                        className="h-5 w-5 text-blue-600 rounded"
                      />
                      <label htmlFor="FaceScanner" className="ml-3 text-sm">Face Scanner</label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="Iris_scanner"
                        name="Iris_scanner"
                        type="checkbox"
                        checked={formData.Iris_scanner}
                        onChange={handleChange}
                        className="h-5 w-5 text-blue-600 rounded"
                      />
                      <label htmlFor="Iris_scanner" className="ml-3 text-sm">Iris Scanner</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold mb-4">Product Images</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['thumbnail', 'photo_1', 'photo_2', 'photo_3'].map(key => (
                  <div key={key} className="space-y-2">
                    <label className="block text-sm font-medium capitalize">
                      {key.replace('_', ' ')}
                    </label>
                    {imagePreviews[key] ? (
                      <div className="relative rounded-lg overflow-hidden border">
                        <img src={imagePreviews[key]} alt="" className="w-full h-32 object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreviews(p => ({ ...p, [key]: null }));
                            setFormData(p => ({ ...p, [key]: null }));
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-md"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleImageUpload(e, key)}
                          className="hidden"
                        />
                        <span className="text-sm text-gray-500 mt-2">Upload</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Variants */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold">Storage Variants</h4>
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                  disabled={isLoading || isSubmitting}
                >
                  <FiPlus size={18} /> Add Variant
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <FiLoader className="animate-spin mx-auto text-blue-600" size={32} />
                  <p className="mt-3 text-gray-500">Loading variants...</p>
                </div>
              ) : loadError ? (
                <div className="text-center py-12 text-red-600 font-medium">{loadError}</div>
              ) : variants.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border">
                  No variants yet — add one to continue
                </div>
              ) : (
                <div className="space-y-5">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-5 gap-4 p-5 bg-gray-50 rounded-xl border"
                    >
                      <div>
                        <label className="block text-sm font-medium mb-1">RAM</label>
                        <select
                          value={v.ram}
                          onChange={e => updateVariant(idx, 'ram', e.target.value)}
                          className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={!!v.id}
                          required={!v.id}  // required for new variants
                        >
                          <option value="">Select RAM *</option>
                          {ramOptions.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.ram}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Storage</label>
                        <select
                          value={v.storage_capacity}
                          onChange={e => updateVariant(idx, 'storage_capacity', e.target.value)}
                          className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={!!v.id}
                        >
                          <option value="">Select</option>
                          {STORAGE_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Price (GHS)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={v.price}
                          onChange={e => updateVariant(idx, 'price', e.target.value)}
                          className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Old Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={v.old_price}
                          onChange={e => updateVariant(idx, 'old_price', e.target.value)}
                          className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-end">
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1">Stock</label>
                          <input
                            type="number"
                            value={v.stock}
                            onChange={e => updateVariant(idx, 'stock', e.target.value)}
                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          className="ml-3 text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50 transition"
                        >
                          <FiTrash size={22} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4 mt-10">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-60 transition"
              >
                {isSubmitting && <FiLoader className="animate-spin" />}
                {isEdit ? 'Update Phone' : 'Create Phone'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PhoneModal;