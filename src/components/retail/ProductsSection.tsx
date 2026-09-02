'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { RetailProduct, CategoryWithSubs } from '@/lib/authTypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, Package, ShoppingBag, Plus, RefreshCw, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface VariantDraft {
  key: number;
  id?: number;
  colorName: string;
  imageFile: File | null;
  existingImageUrl?: string;
  sizes: string[];
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

function computeSale(price: number, discPerc?: number, discAmount?: number) {
  if (discPerc) {
    const salePrice = price * (1 - discPerc / 100);
    return { salePrice, amountSaved: price - salePrice };
  }
  if (discAmount) {
    const salePrice = Math.max(price - discAmount, 0);
    return { salePrice, amountSaved: price - salePrice };
  }
  return { salePrice: price, amountSaved: 0 };
}

export default function ProductsSection() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<RetailProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All products');
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [shopId, setShopId] = useState<number>(0);
  const [categoriesWithSubs, setCategoriesWithSubs] = useState<CategoryWithSubs[]>([]);

  const [viewingProduct, setViewingProduct] = useState<RetailProduct | null>(null);
  const [viewingVariantIndex, setViewingVariantIndex] = useState<number | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<RetailProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newProduct, setNewProduct] = useState<{
    name: string;
    description: string;
    category: string;
    subCategory: string;
    price: string;
    discPerc: string;
    discAmount: string;
    weight: string;
    imageFile: File | null;
    existingImageUrl?: string;
    hasVariant: boolean;
    variants: VariantDraft[];
  }>({
    name: '',
    description: '',
    category: '',
    subCategory: '',
    price: '',
    discPerc: '',
    discAmount: '',
    weight: '',
    imageFile: null,
    existingImageUrl: undefined,
    hasVariant: false,
    variants: [],
  });

  const [variantDraft, setVariantDraft] = useState<{
    key?: number;
    id?: number;
    colorName: string;
    imageFile: File | null;
    existingImageUrl?: string;
    sizes: string[];
  }>({
    colorName: '',
    imageFile: null,
    sizes: [],
  });

  const toggleVariantDraftSize = (size: string) => {
    setVariantDraft((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size) ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size],
    }));
  };

  const resetVariantDraft = () => {
    setVariantDraft({ colorName: '', imageFile: null, sizes: [] });
  };

  const resetNewProduct = () => {
    setNewProduct({
      name: '',
      description: '',
      category: '',
      subCategory: '',
      price: '',
      discPerc: '',
      discAmount: '',
      weight: '',
      imageFile: null,
      existingImageUrl: undefined,
      hasVariant: false,
      variants: [],
    });
    resetVariantDraft();
  };

  const closeProductForm = () => {
    setIsProductFormOpen(false);
    setEditingProductId(null);
    resetNewProduct();
  };

  const openAddProduct = () => {
    setEditingProductId(null);
    resetNewProduct();
    setIsProductFormOpen(true);
  };

  const openEditProduct = (product: RetailProduct) => {
    setEditingProductId(product.id);
    setNewProduct({
      name: product.prod_Name,
      description: product.prod_Desc,
      category: product.prod_Categ,
      subCategory: product.prod_Subcateg,
      price: String(product.price),
      discPerc: product.discPerc ? String(product.discPerc) : '',
      discAmount: product.discAmount ? String(product.discAmount) : '',
      weight: product.prod_Weight || '',
      imageFile: null,
      existingImageUrl: product.imageUrl,
      hasVariant: product.hasVariant,
      variants: (product.variants ?? []).map((v, idx) => ({
        key: v.id ?? Date.now() + idx,
        id: v.id,
        colorName: v.colorName,
        imageFile: null,
        existingImageUrl: v.colorPicture,
        sizes: v.sizes,
      })),
    });
    resetVariantDraft();
    setIsProductFormOpen(true);
  };

  useEffect(() => {
    if (loading) return;

    if (!user || !user.id) {
      console.error('[ProductsSection] Invalid or missing user data:', user);
      toast.error('Please log in to access products.');
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      setIsFetching(true);
      setFetchError(null);
      try {
        // A Retail Shop Owner's user.id IS the RShop_ID (no ShopManager/roleID lookup applies here).
        const rShopId = user.id;
        setShopId(rShopId);

        try {
          const cats = await authAPI.getCategoriesWithSubs();
          setCategoriesWithSubs(cats);
        } catch (catError) {
          console.error('[ProductsSection] Failed to fetch categories:', catError);
          // Non-fatal - the product list can still load without categories.
        }

        await fetchProducts(rShopId);
      } catch (error: any) {
        console.error('[ProductsSection] Failed to fetch data:', error);
        setFetchError(error.message || 'Failed to load shop data.');
        toast.error(error.message || 'Failed to load shop data.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [user, loading, router]);

  const fetchProducts = async (rShopId: number) => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const productsResponse = await authAPI.getRProductsByRShopID(rShopId);
      setProducts(productsResponse);
    } catch (error: any) {
      console.error('[ProductsSection] Error fetching products:', error);
      setFetchError(error.message || 'Failed to load products. Please try again.');
      toast.error(error.message || 'Failed to load products.');
      setProducts([]);
    } finally {
      setIsFetching(false);
    }
  };

  const subcategoryOptions =
    categoriesWithSubs.find((c) => c.catName === newProduct.category)?.subs ?? [];

  const handleCategoryChange = (value: string) => {
    setNewProduct({ ...newProduct, category: value, subCategory: '' });
  };

  const handleDiscPercChange = (value: string) => {
    setNewProduct({ ...newProduct, discPerc: value, discAmount: value ? '' : newProduct.discAmount });
  };

  const handleDiscAmountChange = (value: string) => {
    setNewProduct({ ...newProduct, discAmount: value, discPerc: value ? '' : newProduct.discPerc });
  };

  const commitVariantDraft = () => {
    if (variantDraft.sizes.length === 0 && !variantDraft.colorName.trim()) {
      toast.error('Add a color name or pick at least one size');
      return;
    }
    // A variant being edited (has existingImageUrl) can keep its current image;
    // a brand-new variant needs either its own image or a freshly-picked main
    // product image to fall back to (there's no local File for an existing,
    // unreplaced main image to reuse).
    const hasUsableImage = Boolean(variantDraft.imageFile || variantDraft.existingImageUrl || newProduct.imageFile);
    if (!hasUsableImage) {
      toast.error(
        editingProductId
          ? 'Pick an image for this new color, or replace the main product image first.'
          : 'Upload the product image first, or pick a specific image for this color'
      );
      return;
    }
    // Color name and image are optional - fall back to "Default" and the main
    // product image, so a single-color product can still get a size picker
    // without needing a distinct color/image of its own.
    const defaultIndex = newProduct.variants.filter(
      (v) => v.key !== variantDraft.key && (!v.colorName || v.colorName === 'Default')
    ).length;
    const entry: VariantDraft = {
      key: variantDraft.key ?? Date.now(),
      id: variantDraft.id,
      colorName: variantDraft.colorName.trim() || (defaultIndex > 0 ? `Default ${defaultIndex + 1}` : 'Default'),
      imageFile: variantDraft.imageFile || (!variantDraft.existingImageUrl ? newProduct.imageFile : null),
      existingImageUrl: variantDraft.existingImageUrl,
      sizes: variantDraft.sizes,
    };

    setNewProduct({
      ...newProduct,
      variants: variantDraft.key
        ? newProduct.variants.map((v) => (v.key === variantDraft.key ? entry : v))
        : [...newProduct.variants, entry],
    });
    resetVariantDraft();
  };

  const editVariantChip = (v: VariantDraft) => {
    setVariantDraft({
      key: v.key,
      id: v.id,
      colorName: v.colorName === 'Default' || /^Default \d+$/.test(v.colorName) ? '' : v.colorName,
      imageFile: v.imageFile,
      existingImageUrl: v.existingImageUrl,
      sizes: v.sizes,
    });
  };

  const deleteVariant = (key: number) => {
    setNewProduct({
      ...newProduct,
      variants: newProduct.variants.filter((v) => v.key !== key),
    });
    if (variantDraft.key === key) {
      resetVariantDraft();
    }
  };

  const validateProductForm = () => {
    if (!newProduct.name) {
      toast.error('Product name is required');
      return false;
    }
    if (!newProduct.price) {
      toast.error('Price is required');
      return false;
    }
    if (!newProduct.category) {
      toast.error('Category is required');
      return false;
    }
    if (!newProduct.imageFile && !newProduct.existingImageUrl) {
      toast.error('Product image is required');
      return false;
    }
    if (newProduct.hasVariant && newProduct.variants.length === 0) {
      toast.error('Add at least one color variant, or turn off "Has variants"');
      return false;
    }
    return true;
  };

  const handleSaveProduct = async () => {
    if (!validateProductForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const productData = new FormData();
      productData.append('Prod_Name', newProduct.name);
      productData.append('Prod_Desc', newProduct.description);
      productData.append('Prod_Categ', newProduct.category);
      productData.append('Prod_Subcateg', newProduct.subCategory);
      productData.append('Price', newProduct.price);
      if (newProduct.weight) {
        productData.append('Prod_Weight', newProduct.weight);
      }
      productData.append('HasVariant', newProduct.hasVariant ? 'true' : 'false');
      // Only one of DiscPerc/DiscAmount is ever appended - the unused one is left
      // out entirely so it binds to null on the backend rather than an arbitrary value.
      if (newProduct.discPerc) {
        productData.append('DiscPerc', newProduct.discPerc);
      } else if (newProduct.discAmount) {
        productData.append('DiscAmount', newProduct.discAmount);
      }
      // A new file is only appended when the user actually picked one - omitting
      // it on edit tells the backend to keep the product's existing image.
      if (newProduct.imageFile) {
        productData.append('image', newProduct.imageFile);
      }
      if (newProduct.hasVariant && newProduct.variants.length > 0) {
        // Existing variants carry their DB id and a NewImage flag; new variants
        // (no id) always need an image. variantImages is appended only for
        // variants that actually have a file, in the same order as varientsJson -
        // the backend consumes the next image only when it's expecting one.
        productData.append(
          'varientsJson',
          JSON.stringify(
            newProduct.variants.map((v) => ({
              id: v.id ?? null,
              ColorName: v.colorName,
              Sizes: v.sizes,
              NewImage: Boolean(v.imageFile),
            }))
          )
        );
        newProduct.variants.forEach((v) => {
          if (v.imageFile) {
            productData.append('variantImages', v.imageFile);
          }
        });
      }

      let response;
      if (editingProductId) {
        response = await authAPI.editRProduct(editingProductId, productData);
      } else {
        productData.append('RShopId', shopId.toString());
        response = await authAPI.uploadRProduct(productData);
      }

      if (response.statusCode === 200) {
        toast.success(editingProductId ? 'Product updated successfully!' : 'Product added successfully!');
        closeProductForm();
        await fetchProducts(shopId);
      } else {
        console.error('[ProductsSection] Save product failed:', response);
        toast.error(response.message || 'Failed to save product.');
      }
    } catch (error: any) {
      console.error('[ProductsSection] Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  const openProductView = (product: RetailProduct) => {
    setViewingProduct(product);
    // Default to the first color/size variant when one exists, so sizes show
    // immediately - the same thing the customer would see after clicking a
    // color swatch, without making them click one first.
    setViewingVariantIndex(product.hasVariant && product.variants && product.variants.length > 0 ? 0 : null);
  };

  const handleDeleteProduct = (product: RetailProduct) => {
    setDeletingProduct(product);
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      const response = await authAPI.deleteRProduct(deletingProduct.id);
      if (response.statusCode === 200) {
        toast.success('Product deleted.');
        setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
        setDeletingProduct(null);
      } else {
        toast.error(response.message || 'Failed to delete product.');
      }
    } catch (error: any) {
      console.error('[ProductsSection] Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = [
    'All products',
    ...Array.from(new Set(products.map((p) => p.prod_Categ))).filter(Boolean),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.prod_Name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All products' || product.prod_Categ === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const newProductPrice = parseFloat(newProduct.price) || 0;
  const newProductDiscPerc = newProduct.discPerc ? parseFloat(newProduct.discPerc) : undefined;
  const newProductDiscAmount = newProduct.discAmount ? parseFloat(newProduct.discAmount) : undefined;
  const newProductSale = computeSale(newProductPrice, newProductDiscPerc, newProductDiscAmount);
  const hasNewProductDiscount = Boolean(newProductDiscPerc || newProductDiscAmount);

  const viewingImage =
    viewingVariantIndex !== null && viewingProduct?.variants?.[viewingVariantIndex]?.colorPicture
      ? viewingProduct.variants[viewingVariantIndex].colorPicture
      : viewingProduct?.imageUrl;
  const viewingSale = viewingProduct
    ? computeSale(viewingProduct.price, viewingProduct.discPerc, viewingProduct.discAmount)
    : null;
  const viewingSizes =
    viewingVariantIndex !== null ? viewingProduct?.variants?.[viewingVariantIndex]?.sizes ?? [] : [];

  if (loading || isFetching) {
    return (
      <div className="w-full h-screen flex items-center justify-center py-12">
        <div className="animate-pulse">
          <ShoppingBag className="h-12 w-12 text-green-600" />
          <p className="text-gray-500 mt-2">{loading ? 'Loading authentication...' : 'Loading products...'}</p>
        </div>
      </div>
    );
  }

  if (!user || !user.id) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="space-y-6 w-full">
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-300 rounded-lg shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchProducts(shopId)}
              disabled={isFetching}
              className="flex items-center text-green-600 border-gray-300"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Dialog
              open={isProductFormOpen}
              onOpenChange={(open) => (open ? setIsProductFormOpen(true) : closeProductForm())}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={openAddProduct}
                  className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                  <DialogTitle className="text-green-700">
                    {editingProductId ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Product Info */}
                  <div>
                    <h3 className="text-green-700 font-medium text-lg mb-4">Product Info</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {newProduct.imageFile ? (
                            <img
                              src={URL.createObjectURL(newProduct.imageFile)}
                              alt="Preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : newProduct.existingImageUrl ? (
                            <img
                              src={newProduct.existingImageUrl}
                              alt="Preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="image" className="text-sm">
                            Product Image{editingProductId ? '' : ' *'}
                          </Label>
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setNewProduct({
                                ...newProduct,
                                imageFile: e.target.files?.[0] || null,
                              })
                            }
                            className="border-gray-300"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="product-name" className="text-sm">Product Name *</Label>
                        <Input
                          id="product-name"
                          value={newProduct.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewProduct({ ...newProduct, name: e.target.value })
                          }
                          placeholder="Enter product name"
                          className="border-gray-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description" className="text-sm">Description</Label>
                        <Textarea
                          id="description"
                          value={newProduct.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setNewProduct({ ...newProduct, description: e.target.value })
                          }
                          placeholder="Enter product description"
                          className="border-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <h3 className="text-green-700 font-medium text-lg mb-4">Category</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category" className="text-sm">Category *</Label>
                        <Select value={newProduct.category} onValueChange={handleCategoryChange}>
                          <SelectTrigger className="border-gray-300">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categoriesWithSubs.map((cat) => (
                              <SelectItem key={cat.id} value={cat.catName}>
                                {cat.catName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="subCategory" className="text-sm">Sub-Category</Label>
                        <Select
                          value={newProduct.subCategory}
                          onValueChange={(value) => setNewProduct({ ...newProduct, subCategory: value })}
                          disabled={!newProduct.category || subcategoryOptions.length === 0}
                        >
                          <SelectTrigger className="border-gray-300">
                            <SelectValue placeholder={newProduct.category ? 'Select sub-category' : 'Pick a category first'} />
                          </SelectTrigger>
                          <SelectContent>
                            {subcategoryOptions.map((sub) => (
                              <SelectItem key={sub.subcatName} value={sub.subcatName}>
                                {sub.subcatName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {categoriesWithSubs.length === 0 && (
                      <p className="mt-2 text-sm text-amber-600">
                        No categories are set up yet - ask an admin to add some before listing products.
                      </p>
                    )}
                  </div>

                  {/* Pricing & Discount */}
                  <div>
                    <h3 className="text-green-700 font-medium text-lg mb-4">Pricing</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price" className="text-sm">Price (R) *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={newProduct.price}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewProduct({ ...newProduct, price: e.target.value })
                          }
                          placeholder="0.00"
                          min="0.01"
                          className="border-gray-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="weight" className="text-sm">Weight / Size (optional)</Label>
                        <Input
                          id="weight"
                          value={newProduct.weight}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewProduct({ ...newProduct, weight: e.target.value })
                          }
                          placeholder="e.g., 500g, Size 9, Medium"
                          className="border-gray-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="discPerc" className="text-sm">Discount %</Label>
                        <Input
                          id="discPerc"
                          type="number"
                          step="0.01"
                          value={newProduct.discPerc}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDiscPercChange(e.target.value)}
                          placeholder="e.g., 20"
                          min="0"
                          max="100"
                          disabled={Boolean(newProduct.discAmount)}
                          className="border-gray-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="discAmount" className="text-sm">Discount Amount (R)</Label>
                        <Input
                          id="discAmount"
                          type="number"
                          step="0.01"
                          value={newProduct.discAmount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDiscAmountChange(e.target.value)}
                          placeholder="e.g., 50"
                          min="0"
                          disabled={Boolean(newProduct.discPerc)}
                          className="border-gray-300"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Use either a percentage or a fixed amount, not both.
                    </p>
                    {hasNewProductDiscount && newProductPrice > 0 && (
                      <div className="mt-2 text-sm text-gray-700">
                        Sale price: <span className="font-semibold text-green-700">R{newProductSale.salePrice.toFixed(2)}</span>{' '}
                        <span className="text-gray-500">(save R{newProductSale.amountSaved.toFixed(2)})</span>
                      </div>
                    )}
                  </div>

                  {/* Variants */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        id="hasVariant"
                        type="checkbox"
                        checked={newProduct.hasVariant}
                        onChange={(e) => setNewProduct({ ...newProduct, hasVariant: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="hasVariant" className="text-green-700 font-medium text-lg">
                        This product has colors and/or sizes
                      </Label>
                    </div>

                    {newProduct.hasVariant && (
                      <div className="space-y-4">
                        <p className="text-xs text-gray-500">
                          Add one entry per color. Only tracking sizes, not different colors? Leave the color
                          name and image blank and just pick sizes below - it'll use the main product image.
                        </p>
                        {variantDraft.key && (
                          <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                            Editing this color - update the fields below and click &quot;Update Variant&quot;, or{' '}
                            <button type="button" className="underline" onClick={resetVariantDraft}>
                              cancel
                            </button>
                            .
                          </p>
                        )}
                        <div className="grid grid-cols-3 gap-4 items-end">
                          <div className="col-span-1">
                            <Label htmlFor="variant-color" className="text-sm">Color Name (optional)</Label>
                            <Input
                              id="variant-color"
                              value={variantDraft.colorName}
                              onChange={(e) => setVariantDraft({ ...variantDraft, colorName: e.target.value })}
                              placeholder="e.g., Navy"
                              className="border-gray-300"
                            />
                          </div>
                          <div className="col-span-1">
                            <Label htmlFor="variant-image" className="text-sm">
                              Color Image {variantDraft.existingImageUrl ? '(leave blank to keep current)' : '(optional)'}
                            </Label>
                            <Input
                              id="variant-image"
                              type="file"
                              accept="image/*"
                              onChange={(e) => setVariantDraft({ ...variantDraft, imageFile: e.target.files?.[0] || null })}
                              className="border-gray-300"
                            />
                          </div>
                          <Button
                            type="button"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={commitVariantDraft}
                            disabled={!variantDraft.colorName && variantDraft.sizes.length === 0}
                          >
                            {variantDraft.key ? 'Update Variant' : 'Add Variant'}
                          </Button>
                        </div>
                        <div>
                          <Label className="text-sm">Sizes available in this color</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {AVAILABLE_SIZES.map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => toggleVariantDraftSize(size)}
                                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                  variantDraft.sizes.includes(size)
                                    ? 'bg-green-600 text-white border-green-600'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                        {newProduct.variants.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {newProduct.variants.map((v) => (
                              <div
                                key={v.key}
                                className={`relative border rounded-lg p-2 flex flex-col items-center ${
                                  variantDraft.key === v.key ? 'border-green-600 ring-1 ring-green-600' : ''
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => deleteVariant(v.key)}
                                  className="absolute top-1 right-1 text-gray-400 hover:text-red-500"
                                  aria-label={`Remove ${v.colorName}`}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => editVariantChip(v)}
                                  className="flex flex-col items-center w-full"
                                  aria-label={`Edit ${v.colorName}`}
                                >
                                  {v.imageFile || v.existingImageUrl ? (
                                    <img
                                      src={v.imageFile ? URL.createObjectURL(v.imageFile) : v.existingImageUrl}
                                      alt={v.colorName}
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center">
                                      <Package className="h-6 w-6 text-gray-400" />
                                    </div>
                                  )}
                                  <span className="text-xs mt-1 truncate w-full text-center">{v.colorName}</span>
                                  {v.sizes.length > 0 && (
                                    <span className="text-[10px] text-gray-500 truncate w-full text-center">
                                      {v.sizes.join(', ')}
                                    </span>
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={closeProductForm}
                      className="border-gray-300 text-gray-700"
                    >
                      Discard
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleSaveProduct}
                      disabled={isLoading}
                    >
                      {isLoading
                        ? editingProductId
                          ? 'Saving...'
                          : 'Uploading...'
                        : editingProductId
                          ? 'Save Changes'
                          : 'Upload'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 bg-white rounded-lg p-1 w-full shadow-sm">
          {categories.map((category) => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? 'default' : 'ghost'}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Error State */}
        {fetchError && !isFetching && (
          <div className="text-center py-8 bg-red-50 rounded-lg shadow-sm">
            <p className="text-red-600 mb-2">{fetchError}</p>
            <Button
              variant="outline"
              onClick={() => fetchProducts(shopId)}
              className="text-green-600 border-green-300"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isFetching && (
          <div className="text-center py-8 bg-gray-50 rounded-lg shadow-sm">
            <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading products...</p>
          </div>
        )}

        {/* Products Grid */}
        {!isFetching && !fetchError && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredProducts.map((product) => {
              const sale = computeSale(product.price, product.discPerc, product.discAmount);
              const onSale = Boolean(product.discPerc || product.discAmount);
              return (
                <Card
                  key={product.id}
                  className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center relative group">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.prod_Name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center">
                        <ShoppingBag className="h-8 w-8 mb-2" />
                        <span className="text-xs">No Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white text-green-600 hover:bg-green-50"
                        onClick={() => openProductView(product)}
                      >
                        View
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white text-green-600 hover:bg-green-50"
                        onClick={() => openEditProduct(product)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white text-red-600 hover:bg-red-50 px-2"
                        onClick={() => handleDeleteProduct(product)}
                        aria-label={`Delete ${product.prod_Name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm text-gray-900 truncate">{product.prod_Name}</h3>
                    <p
                      className="text-xs text-gray-600 mt-1 truncate"
                      title={`${product.prod_Categ}${product.prod_Subcateg ? ` > ${product.prod_Subcateg}` : ''}`}
                    >
                      {product.prod_Categ}
                      {product.prod_Subcateg && ` > ${product.prod_Subcateg}`}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      {onSale ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400 line-through">R{product.price.toFixed(2)}</span>
                          <span className="text-sm font-bold text-red-600">R{sale.salePrice.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-green-600">R{product.price.toFixed(2)}</span>
                      )}
                      {product.hasVariant && product.variants && product.variants.length > 0 && (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                          {product.variants.length} colors
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {!isFetching && !fetchError && filteredProducts.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg shadow-sm">
            <ShoppingBag className="h-12 w-12 text-gray-300 mb-3 mx-auto" />
            <p className="text-gray-600 mb-2">No products found.</p>
            <p className="text-gray-500 text-sm">Try changing your search or category filter, or add a new product.</p>
          </div>
        )}
      </div>

      {/* Product View Dialog */}
      <Dialog open={viewingProduct !== null} onOpenChange={(open) => !open && setViewingProduct(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white">
          {viewingProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-green-700">{viewingProduct.prod_Name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="aspect-square max-h-[50vh] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mx-auto">
                  {viewingImage ? (
                    <img src={viewingImage} alt={viewingProduct.prod_Name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="h-12 w-12 text-gray-300" />
                  )}
                </div>
                {viewingProduct.hasVariant && viewingProduct.variants && viewingProduct.variants.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingVariantIndex(null)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${
                        viewingVariantIndex === null ? 'border-green-600' : 'border-transparent'
                      }`}
                      title="Default image"
                    >
                      {viewingProduct.imageUrl && (
                        <img src={viewingProduct.imageUrl} alt="Default" className="w-full h-full object-cover" />
                      )}
                    </button>
                    {viewingProduct.variants.map((v, idx) => (
                      <button
                        type="button"
                        key={v.id ?? idx}
                        onClick={() => setViewingVariantIndex(idx)}
                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${
                          viewingVariantIndex === idx ? 'border-green-600' : 'border-transparent'
                        }`}
                        title={v.colorName}
                      >
                        {v.colorPicture && (
                          <img src={v.colorPicture} alt={v.colorName} className="w-full h-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {viewingSizes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {viewingSizes.map((size) => (
                      <span key={size} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                        {size}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-600">{viewingProduct.prod_Desc}</p>
                <p className="text-sm text-gray-500">
                  {viewingProduct.prod_Categ}
                  {viewingProduct.prod_Subcateg && ` > ${viewingProduct.prod_Subcateg}`}
                </p>
                {viewingSale && (
                  <div>
                    {viewingSale.amountSaved > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 line-through">R{viewingProduct.price.toFixed(2)}</span>
                        <span className="text-lg font-bold text-red-600">R{viewingSale.salePrice.toFixed(2)}</span>
                        <span className="text-sm text-gray-500">(save R{viewingSale.amountSaved.toFixed(2)})</span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-green-600">R{viewingProduct.price.toFixed(2)}</span>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deletingProduct !== null} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Delete product?</DialogTitle>
            <DialogDescription>
              Delete "{deletingProduct?.prod_Name}"? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingProduct(null)}
              disabled={isDeleting}
              className="border-gray-300 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteProduct}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
