'use client';

import { useState, useEffect, Fragment } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FiBox, FiPlusCircle, FiEdit, FiTrash2, FiFilter, FiSearch, FiDollarSign, FiArchive, FiImage, FiLink, FiCheckSquare, FiTag, FiTruck, FiMaximize, FiUploadCloud, FiLoader } from 'react-icons/fi';
import { Dialog, Transition } from '@headlessui/react';
import ProductsList from '@/components/products/ProductsList';

// Updated Interface for Product
interface Product {
  id: string;
  created_at?: string; // Made optional
  updated_at?: string; // Made optional
  name: string;
  description?: string;
  price: number;
  image_url?: string; // Primary image
  image_urls?: string[]; // Additional images
  category: string;
  stock: number;
  tags?: string[];
  weight?: number;
  dimensions?: { l?: number; w?: number; h?: number; unit?: string };
  source_platform?: 'whatsapp' | 'website' | 'crm' | string; // Raw DB value
  external_ids?: any; // JSONB can be flexible, or define a stricter type
  is_published_on_whatsapp?: boolean;
  last_whatsapp_sync_at?: string;
  source?: 'whatsapp' | 'website' | 'crm' | string; // Mapped frontend value
}

const productSourcePlatforms = ['crm', 'Website1', 'Website2', 'Website3', 'Website4', 'WhatsApp_Catalog']; // Added 'crm', ensure this is 'crm' for consistency
const dimensionUnits = ['cm', 'inch', 'mm'];
const productCategories = ['Wellness', 'Healing', 'Spiritual', 'Books', 'Courses', 'Other']; // Keep for now

const productSourceFilterOptions = [
    { value: 'crm', label: 'CRM' },
    { value: 'website', label: 'Website' },
    { value: 'whatsapp', label: 'WhatsApp' }
];

const initialProductState: Partial<Product> = {
  name: '',
  price: 0,
  category: productCategories[0],
  stock: 0,
  image_urls: [],
  tags: [],
  dimensions: { unit: dimensionUnits[0] },
  source: 'crm', // Changed from source_platform to source, and set to 'crm'
  is_published_on_whatsapp: false,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [currentProductForModal, setCurrentProductForModal] = useState<Partial<Product> | null>(initialProductState);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ category: '', stock_status: '', source: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedAdditionalFiles, setSelectedAdditionalFiles] = useState<FileList | null>(null);
  const [uploadingAdditionalImages, setUploadingAdditionalImages] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, filters]);

  const handleOpenProductModal = (productToEdit?: Product) => {
    setSelectedFile(null); 
    setSelectedAdditionalFiles(null);
    if (productToEdit) {
      setCurrentProductForModal({
        ...productToEdit,
        tags: Array.isArray(productToEdit.tags) ? productToEdit.tags : [],
        image_urls: Array.isArray(productToEdit.image_urls) ? productToEdit.image_urls : [],
      });
      setIsEditMode(true);
    } else {
      setCurrentProductForModal(initialProductState);
      setIsEditMode(false);
    }
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
  };

  const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!currentProductForModal) return;
    const { name, value, type } = e.target;

    if (name === "image_file_input") {
        const file = (e.target as HTMLInputElement).files?.[0];
        setSelectedFile(file || null);
        return;
    }
    if (name === "additional_image_files_input") {
        setSelectedAdditionalFiles((e.target as HTMLInputElement).files);
        return;
    }
    if (name.startsWith('dim_')) {
        const dimKey = name.split('_')[1] as keyof NonNullable<Product['dimensions']>;
        setCurrentProductForModal({
            ...currentProductForModal,
            dimensions: {
                ...currentProductForModal.dimensions,
                [dimKey]: type === 'number' ? parseFloat(value) : value,
            }
        });
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCurrentProductForModal({ ...currentProductForModal, [name]: checked });
    } else if (name === 'tags') {
      setCurrentProductForModal({ ...currentProductForModal, [name]: value.split(',').map(s => s.trim()).filter(s => s) });
    } else if (name === 'image_urls' && typeof value === 'string') {
       setCurrentProductForModal({ ...currentProductForModal, [name]: value.split(',').map(s => s.trim()).filter(s => s) });
    } else {
      setCurrentProductForModal({ ...currentProductForModal, [name]: type === 'number' && value !== '' ? parseFloat(value) : value });
    }
  };

  const handlePrimaryImageUpload = async (): Promise<string | undefined> => {
    if (!selectedFile) return currentProductForModal?.image_url; // Return existing if no new file
    if (!currentProductForModal) return undefined;

    setUploadingImage(true);
    const toastId = toast.loading('Uploading primary image...');
    try {
      const fileName = `${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('dhruva-holistic-wellness') // Ensure this is your bucket name
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('dhruva-holistic-wellness') // Ensure this is your bucket name
        .getPublicUrl(filePath);

      toast.success('Primary image uploaded!', { id: toastId });
      setCurrentProductForModal({ ...currentProductForModal, image_url: publicUrlData.publicUrl });
      setSelectedFile(null); // Clear selected file after successful upload
      return publicUrlData.publicUrl;
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`, { id: toastId });
      console.error("Image upload error:", error);
      return undefined;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAdditionalImagesUpload = async (): Promise<string[] | undefined> => {
    if (!selectedAdditionalFiles || selectedAdditionalFiles.length === 0) {
      return currentProductForModal?.image_urls || []; // Return existing if no new files
    }
    if (!currentProductForModal) return undefined;

    setUploadingAdditionalImages(true);
    const toastId = toast.loading(`Uploading ${selectedAdditionalFiles.length} additional image(s)...`);
    const uploadedUrls: string[] = currentProductForModal?.image_urls ? [...currentProductForModal.image_urls] : [];

    try {
      for (let i = 0; i < selectedAdditionalFiles.length; i++) {
        const file = selectedAdditionalFiles[i];
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `product-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('dhruva-holistic-wellness')
          .upload(filePath, file);

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}: ${uploadError.message}`, { id: toastId });
          continue; // Continue with next file
        }

        const { data: publicUrlData } = supabase.storage
          .from('dhruva-holistic-wellness')
          .getPublicUrl(filePath);
        
        if (publicUrlData?.publicUrl) {
            uploadedUrls.push(publicUrlData.publicUrl);
        }
      }

      toast.success('Additional images uploaded!', { id: toastId });
      setCurrentProductForModal(prev => prev ? { ...prev, image_urls: uploadedUrls } : null);
      setSelectedAdditionalFiles(null); // Clear selected files
      return uploadedUrls;
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`, { id: toastId });
      console.error("Additional images upload error:", error);
      return undefined; // Or return partially uploaded URLs if preferred
    } finally {
      setUploadingAdditionalImages(false);
    }
  };

  const handleSubmitProduct = async () => {
    if (!currentProductForModal || !currentProductForModal.name || currentProductForModal.price == null || !currentProductForModal.category || currentProductForModal.stock == null) {
      toast.error('Name, Price, Category, and Stock are required.');
      return;
    }
    setIsUpdating(true);
    const submissionToastId = toast.loading(isEditMode ? 'Updating product...' : 'Adding product...');

    let finalImageUrl = currentProductForModal.image_url;
    if (selectedFile) {
        finalImageUrl = await handlePrimaryImageUpload();
        if (finalImageUrl === undefined && selectedFile) {
            toast.error('Primary image upload failed. Please try again.', { id: submissionToastId });
            setIsUpdating(false);
            return;
        }
    }

    let finalAdditionalImageUrls = currentProductForModal.image_urls || [];
    if (selectedAdditionalFiles && selectedAdditionalFiles.length > 0) {
        const uploadedUrls = await handleAdditionalImagesUpload();
        if (uploadedUrls === undefined) { 
            toast.error('Additional images upload failed. Please try again.', { id: submissionToastId });
            setIsUpdating(false);
            return;
        }
        finalAdditionalImageUrls = uploadedUrls;
    }
    
    const productDataForDb = {
        ...currentProductForModal,
        price: Number(currentProductForModal.price) || 0,
        stock: Number(currentProductForModal.stock) || 0,
        weight: Number(currentProductForModal.weight) || null,
        dimensions: {
            l: Number(currentProductForModal.dimensions?.l) || null,
            w: Number(currentProductForModal.dimensions?.w) || null,
            h: Number(currentProductForModal.dimensions?.h) || null,
            unit: currentProductForModal.dimensions?.unit || dimensionUnits[0],
        },
        tags: currentProductForModal.tags?.filter(t => t) || [],
        image_url: finalImageUrl,
        image_urls: finalAdditionalImageUrls.filter(url => url),
        source_platform: currentProductForModal.source || 'crm',
    };
    
    delete (productDataForDb as Partial<Product>).source;

    try {
      let error;
      if (isEditMode && currentProductForModal.id) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productDataForDb)
          .eq('id', currentProductForModal.id);
        error = updateError;
      } else {
        const { id, ...insertData } = productDataForDb;
        const { error: insertError } = await supabase
          .from('products')
          .insert(insertData as any);
        error = insertError;
      }

      if (error) throw error;
      toast.success(isEditMode ? 'Product updated!' : 'Product added!', { id: submissionToastId });
      handleCloseProductModal();
      fetchProducts();
    } catch (error: any) {
      toast.error(`Operation failed: ${error.message}`, { id: submissionToastId });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    const toastId = toast.loading('Deleting product...');
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      toast.success('Product deleted!', { id: toastId });
      fetchProducts();
    } catch (error: any) {
      toast.error(`Delete failed: ${error.message}`, { id: toastId });
    } 
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('products').select('*').order('name', { ascending: true });
      if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.source) query = query.eq('source_platform', filters.source);
      const { data, error } = await query;
      if (error) throw error;

      const formattedProducts = data?.map(p => {
        let mappedSource: string | undefined = undefined;
        if (p.source_platform === 'CRM_source') {
          mappedSource = 'crm';
        } else if (p.source_platform === 'Your_Website_Source_Value_In_DB') { // <-- TODO: Replace with actual DB value for website products
          mappedSource = 'website';
        } else if (p.source_platform === 'Your_WhatsApp_Source_Value_In_DB') { // <-- TODO: Replace with actual DB value for WhatsApp products
          mappedSource = 'whatsapp';
        } else {
          mappedSource = p.source_platform; // Keep original if no specific match
        }
        return {
          ...p,
          source: mappedSource,
          tags: Array.isArray(p.tags) ? p.tags : [],
          image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
        };
      }) || [];
      
      setProducts(formattedProducts as Product[]);
    } catch (error: any) {
      toast.error(`Failed to fetch products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Manage Products">
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-white p-6 shadow-lg sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-orbitly-charcoal">Product Inventory</h2>
            <p className="mt-1 text-sm text-orbitly-dark-sage">Add, edit, and manage your product catalog with multi-platform details.</p>
          </div>
          <button onClick={() => handleOpenProductModal()} className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors">
            <FiPlusCircle className="h-4 w-4" /> Add Product
          </button>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-lg">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="searchTerm" className="block text-xs font-medium text-orbitly-dark-sage">Search Product</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><FiSearch className="h-4 w-4 text-orbitly-soft-gray" /></div>
                <input type="text" name="searchTerm" id="searchTerm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Product name..." className="block w-full rounded-lg border-orbitly-soft-gray bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"/>
              </div>
            </div>
            <div>
              <label htmlFor="category" className="block text-xs font-medium text-orbitly-dark-sage">Category</label>
              <select id="category" name="category" value={filters.category} onChange={handleFilterChange} className="mt-1 block w-full rounded-lg border-orbitly-soft-gray bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                <option value="">All Categories</option>
                {productCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="source" className="block text-xs font-medium text-orbitly-dark-sage">Source Platform</label>
              <select 
                id="source" 
                name="source" 
                value={filters.source} 
                onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))} 
                className="mt-1 block w-full rounded-lg border-orbitly-soft-gray bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">All Platforms</option>
                {productSourceFilterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl bg-white shadow-lg">
          {loading && products.length === 0 && <div className="p-8 text-center text-orbitly-dark-sage"><FiLoader className="mx-auto h-12 w-12 animate-spin text-primary-500" />Loading products...</div>}
          {!loading && products.length === 0 && (
            <div className="p-12 text-center">
              <FiArchive className="mx-auto h-16 w-16 text-orbitly-soft-gray" />
              <h3 className="mt-4 text-lg font-medium text-orbitly-charcoal">No Products Found</h3>
              <p className="mt-1 text-sm text-orbitly-dark-sage">Add your first product or adjust filters.</p>
            </div>
          )}
          {products.length > 0 && (
            <ProductsList 
              products={products} 
              onEditProduct={handleOpenProductModal}
            />
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      <Transition appear show={isProductModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseProductModal}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/30" /></Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-orbitly-charcoal">
                    {isEditMode ? 'Edit Product' : 'Add New Product'}
                  </Dialog.Title>
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmitProduct(); }} className="mt-6 space-y-5">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-orbitly-dark-sage">Product Name*</label>
                            <input type="text" name="name" id="name" value={currentProductForModal?.name || ''} onChange={handleModalInputChange} required className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 px-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-orbitly-dark-sage">Category*</label>
                            <select name="category" id="category" value={currentProductForModal?.category || ''} onChange={handleModalInputChange} required className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                                <option value="" disabled>Select category</option>
                                {productCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-orbitly-dark-sage">Description</label>
                        <textarea name="description" id="description" value={currentProductForModal?.description || ''} onChange={handleModalInputChange} rows={3} className="mt-1 block w-full rounded-lg border-orbitly-soft-gray p-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"></textarea>
                    </div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-orbitly-dark-sage">Price (₹)*</label>
                            <input type="number" name="price" id="price" value={currentProductForModal?.price ?? ''} onChange={handleModalInputChange} required min="0" step="0.01" className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 px-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                        </div>
                        <div>
                            <label htmlFor="stock" className="block text-sm font-medium text-orbitly-dark-sage">Stock Quantity*</label>
                            <input type="number" name="stock" id="stock" value={currentProductForModal?.stock ?? ''} onChange={handleModalInputChange} required min="0" step="1" className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 px-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="image_url" className="block text-sm font-medium text-orbitly-dark-sage">Primary Image URL</label>
                        <input 
                            type="text" 
                            name="image_url" 
                            id="image_url" 
                            value={currentProductForModal?.image_url || ''} 
                            onChange={handleModalInputChange} 
                            placeholder="https://... or will be auto-filled by upload" 
                            className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 px-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 mb-2"
                        />
                        <label htmlFor="image_file_input" className="block text-sm font-medium text-orbitly-dark-sage">Or Upload New Primary Image</label>
                        <div className="mt-1 flex items-center">
                            <input 
                                type="file" 
                                name="image_file_input" 
                                id="image_file_input"
                                onChange={handleModalInputChange} 
                                accept="image/png, image/jpeg, image/webp, image/gif"
                                className="block w-full text-sm text-orbitly-dark-sage file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100 disabled:opacity-50"
                                disabled={uploadingImage || uploadingAdditionalImages}
                            />
                        </div>
                        {selectedFile && <p className="mt-1 text-xs text-orbitly-dark-sage">Selected Primary: {selectedFile.name}</p>}
                        {currentProductForModal?.image_url && !selectedFile && (
                            <div className="mt-2">
                                <img src={currentProductForModal.image_url} alt="Current product image" className="h-20 w-20 rounded-md object-cover"/>
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="image_urls" className="block text-sm font-medium text-orbitly-dark-sage">Additional Image URLs (comma-separated)</label>
                        <textarea name="image_urls" id="image_urls" value={currentProductForModal?.image_urls?.join(', ') || ''} onChange={handleModalInputChange} rows={2} placeholder="https://.../img1.jpg, https://.../img2.jpg or will be auto-filled by upload" className="mt-1 block w-full rounded-lg border-orbitly-soft-gray p-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 mb-2"></textarea>
                        <label htmlFor="additional_image_files_input" className="block text-sm font-medium text-orbitly-dark-sage">Or Upload New Additional Images</label>
                        <div className="mt-1 flex items-center">
                            <input 
                                type="file" 
                                name="additional_image_files_input" 
                                id="additional_image_files_input"
                                onChange={handleModalInputChange} 
                                accept="image/png, image/jpeg, image/webp, image/gif"
                                multiple
                                className="block w-full text-sm text-orbitly-dark-sage file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100 disabled:opacity-50"
                                disabled={uploadingImage || uploadingAdditionalImages}
                            />
                        </div>
                        {selectedAdditionalFiles && selectedAdditionalFiles.length > 0 && (
                            <p className="mt-1 text-xs text-orbitly-dark-sage">
                                Selected Additional: {Array.from(selectedAdditionalFiles).map(f => f.name).join(', ')}
                            </p>
                        )}
                        {currentProductForModal?.image_urls && currentProductForModal.image_urls.length > 0 && (
                             <div className="mt-2 flex flex-wrap gap-2">
                                {currentProductForModal.image_urls.map((url, index) => (
                                    <img key={index} src={url} alt={`Additional product image ${index + 1}`} className="h-20 w-20 rounded-md object-cover"/>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="weight" className="block text-sm font-medium text-orbitly-dark-sage">Weight (kg)</label>
                            <input type="number" name="weight" id="weight" value={currentProductForModal?.weight ?? ''} onChange={handleModalInputChange} min="0" step="0.01" className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 px-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                        </div>
                        <div className="grid grid-cols-4 gap-x-2 items-end">
                            <div className="col-span-1"><label htmlFor="dim_l" className="block text-xs font-medium text-orbitly-dark-sage">L</label><input type="number" name="dim_l" id="dim_l" value={currentProductForModal?.dimensions?.l ?? ''} onChange={handleModalInputChange} min="0" className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 px-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
                            <div className="col-span-1"><label htmlFor="dim_w" className="block text-xs font-medium text-orbitly-dark-sage">W</label><input type="number" name="dim_w" id="dim_w" value={currentProductForModal?.dimensions?.w ?? ''} onChange={handleModalInputChange} min="0" className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 px-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
                            <div className="col-span-1"><label htmlFor="dim_h" className="block text-xs font-medium text-orbitly-dark-sage">H</label><input type="number" name="dim_h" id="dim_h" value={currentProductForModal?.dimensions?.h ?? ''} onChange={handleModalInputChange} min="0" className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 px-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
                            <div className="col-span-1"><label htmlFor="dim_unit" className="block text-xs font-medium text-orbitly-dark-sage">Unit</label><select name="dim_unit" id="dim_unit" value={currentProductForModal?.dimensions?.unit || dimensionUnits[0]} onChange={handleModalInputChange} className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"><option value="cm">cm</option><option value="inch">inch</option><option value="mm">mm</option></select></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="source" className="block text-sm font-medium text-orbitly-dark-sage">Source</label>
                            <select name="source" id="source" value={currentProductForModal?.source || 'crm'} onChange={handleModalInputChange} className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                                {productSourceFilterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-orbitly-dark-sage">Tags (comma-separated)</label>
                            <input type="text" name="tags" id="tags" value={currentProductForModal?.tags?.join(', ') || ''} onChange={handleModalInputChange} placeholder="e.g. bestseller, eco-friendly" className="mt-1 block w-full rounded-lg border-orbitly-soft-gray py-2 px-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="external_ids" className="block text-sm font-medium text-orbitly-dark-sage">External IDs (JSON format)</label>
                        <textarea name="external_ids" id="external_ids" value={currentProductForModal?.external_ids ? JSON.stringify(currentProductForModal.external_ids, null, 2) : ''} 
                            onChange={(e) => {
                                if (!currentProductForModal) return;
                                try { setCurrentProductForModal({ ...currentProductForModal, external_ids: JSON.parse(e.target.value) }); }
                                catch (err) { /* Maybe show a small error if JSON is invalid */ }
                            }}
                            rows={3} placeholder='{
  "website1_sku": "SKU123",
  "echt_catalog_item_id": "wp_prod_abc"
}' className="mt-1 block w-full rounded-lg border-orbitly-soft-gray p-2.5 text-sm shadow-sm font-mono focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"></textarea>
                    </div>
                    <div className="flex items-center">
                        <input id="is_published_on_whatsapp" name="is_published_on_whatsapp" type="checkbox" checked={currentProductForModal?.is_published_on_whatsapp || false} onChange={handleModalInputChange} className="h-4 w-4 text-primary-600 border-orbitly-soft-gray rounded focus:ring-primary-500" />
                        <label htmlFor="is_published_on_whatsapp" className="ml-2 block text-sm text-orbitly-dark-sage">Publish to WhatsApp Catalog</label>
                    </div>

                    <div className="mt-8 flex justify-end space-x-3">
                      <button type="button" onClick={handleCloseProductModal} disabled={isUpdating || uploadingImage || uploadingAdditionalImages} className="rounded-lg border border-orbitly-soft-gray px-4 py-2 text-sm font-medium text-orbitly-dark-sage hover:bg-orbitly-light-green focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors">Cancel</button>
                      <button type="submit" disabled={isUpdating || uploadingImage || uploadingAdditionalImages} className="flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-70">
                        {(isUpdating || uploadingImage || uploadingAdditionalImages) && <FiUploadCloud className="animate-spin mr-2" />} 
                        {isEditMode ? 'Save Changes' : 'Add Product'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </DashboardLayout>
  );
} 