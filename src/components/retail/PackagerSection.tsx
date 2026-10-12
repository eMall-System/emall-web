'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, Check, X, RefreshCw, Store, Plus, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { BranchShop, Mall } from '@/lib/authTypes';

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

function statusBadgeClass(status: string) {
  switch (status) {
    case 'Approved':
      return 'bg-green-100 text-green-700';
    case 'Rejected':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-amber-100 text-amber-700';
  }
}

export default function PackagerSection() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branches, setBranches] = useState<BranchShop[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [shopId, setShopId] = useState<number>(0);
  const [rejectingBranch, setRejectingBranch] = useState<BranchShop | null>(null);

  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [malls, setMalls] = useState<Mall[]>([]);
  const [isSubmittingBranch, setIsSubmittingBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({
    shopName: '',
    email: '',
    tellphone: '',
    mallId: '',
    imageFile: null as File | null,
    leaseFile: null as File | null,
  });

  useEffect(() => {
    if (loading) return;

    if (!user || !user.id) {
      console.error('[PackagerSection] Invalid or missing user data:', user);
      toast.error('Please log in to access branches.');
      router.push('/login');
      return;
    }

    setShopId(user.id);
    fetchBranches(user.id);
  }, [user, loading, router]);

  const fetchBranches = async (rShopId: number) => {
    setDataLoading(true);
    try {
      const data = await authAPI.getBranchesByRShopID(rShopId);
      setBranches(data);
    } catch (error: any) {
      console.error('[PackagerSection] Failed to fetch branches:', error);
      toast.error(error.message || 'Failed to load branches.');
      setBranches([]);
    } finally {
      setDataLoading(false);
    }
  };

  const resetNewBranch = () => {
    setNewBranch({ shopName: '', email: '', tellphone: '', mallId: '', imageFile: null, leaseFile: null });
  };

  const openAddBranch = () => {
    resetNewBranch();
    setIsAddBranchOpen(true);
    authAPI
      .getMalls()
      .then(setMalls)
      .catch((error: any) => {
        console.error('[PackagerSection] Failed to fetch malls:', error);
        // Non-fatal - the dialog can still be reviewed, just without mall options yet.
      });
  };

  const closeAddBranch = () => {
    setIsAddBranchOpen(false);
    resetNewBranch();
  };

  const handleRegisterBranch = async () => {
    if (!newBranch.shopName.trim()) {
      toast.error('Please enter a branch name.');
      return;
    }
    if (!newBranch.email.trim()) {
      toast.error('Please enter an email address.');
      return;
    }
    if (!newBranch.tellphone.trim()) {
      toast.error('Please enter a phone number.');
      return;
    }
    if (!newBranch.mallId) {
      toast.error('Please select a mall.');
      return;
    }
    if (!newBranch.imageFile) {
      toast.error('Please upload a branch image.');
      return;
    }
    if (!newBranch.leaseFile) {
      toast.error('Please upload the lease agreement.');
      return;
    }

    setIsSubmittingBranch(true);
    try {
      const formData = new FormData();
      formData.append('ShopName', newBranch.shopName);
      formData.append('Email', newBranch.email);
      formData.append('Tellphone', newBranch.tellphone);
      formData.append('RShop_ID', String(shopId));
      formData.append('MallID', newBranch.mallId);
      formData.append('image', newBranch.imageFile);
      formData.append('lease_agreement', newBranch.leaseFile);

      const response = await authAPI.registerBranch(formData);
      if (response.statusCode === 200) {
        toast.success(response.message || 'Branch submitted. It will appear below once reviewed.');
        closeAddBranch();
        await fetchBranches(shopId);
      } else {
        toast.error(response.message || 'Failed to register branch.');
      }
    } catch (error: any) {
      console.error('[PackagerSection] Register branch error:', error);
      toast.error(error.message || 'Failed to register branch.');
    } finally {
      setIsSubmittingBranch(false);
    }
  };

  const handleApprove = async (branch: BranchShop) => {
    setActioningId(branch.id);
    try {
      const response = await authAPI.approveBranch(branch.id);
      if (response.statusCode === 200) {
        toast.success(`${branch.shopName} approved. Login credentials have been emailed to them.`);
        await fetchBranches(shopId);
      } else {
        toast.error(response.message || 'Failed to approve branch.');
      }
    } catch (error: any) {
      console.error('[PackagerSection] Approve branch error:', error);
      toast.error(error.message || 'Failed to approve branch.');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = (branch: BranchShop) => {
    setRejectingBranch(branch);
  };

  const confirmReject = async () => {
    if (!rejectingBranch) return;
    setActioningId(rejectingBranch.id);
    try {
      const response = await authAPI.rejectBranch(rejectingBranch.id);
      if (response.statusCode === 200) {
        toast.success(`${rejectingBranch.shopName} rejected.`);
        setRejectingBranch(null);
        await fetchBranches(shopId);
      } else {
        toast.error(response.message || 'Failed to reject branch.');
      }
    } catch (error: any) {
      console.error('[PackagerSection] Reject branch error:', error);
      toast.error(error.message || 'Failed to reject branch.');
    } finally {
      setActioningId(null);
    }
  };

  const filteredBranches = branches.filter((branch) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      branch.shopName.toLowerCase().includes(query) ||
      branch.email.toLowerCase().includes(query) ||
      branch.mallName.toLowerCase().includes(query) ||
      String(branch.id).includes(query);
    const matchesStatus = statusFilter === 'All' || (branch.regStatus || 'Pending') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading || dataLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center py-12">
        <div className="animate-pulse">
          <Store className="h-12 w-12 text-green-600" />
          <p className="text-gray-500 mt-2">{loading ? 'Loading authentication...' : 'Loading branches...'}</p>
        </div>
      </div>
    );
  }

  if (!user || !user.id) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="space-y-6 px-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-green-600">Branches</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBranches(shopId)}
            className="flex items-center text-green-600 border-gray-300"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isAddBranchOpen} onOpenChange={(open) => (open ? setIsAddBranchOpen(true) : closeAddBranch())}>
            <DialogTrigger asChild>
              <Button onClick={openAddBranch} className="bg-green-600 hover:bg-green-700 flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add New Branch</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle className="text-green-700">Add New Branch</DialogTitle>
                <DialogDescription>
                  Submits for approval the same way a branch registering itself would - you'll see it
                  below with a Pending status until it's approved.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                    {newBranch.imageFile ? (
                      <img
                        src={URL.createObjectURL(newBranch.imageFile)}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="branch-image" className="text-sm">Branch Image *</Label>
                    <Input
                      id="branch-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewBranch({ ...newBranch, imageFile: e.target.files?.[0] || null })}
                      className="border-gray-300"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="branch-name" className="text-sm">Shop Name *</Label>
                  <Input
                    id="branch-name"
                    value={newBranch.shopName}
                    onChange={(e) => setNewBranch({ ...newBranch, shopName: e.target.value })}
                    placeholder="e.g., Checkers Sandton"
                    className="border-gray-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="branch-email" className="text-sm">Email Address *</Label>
                    <Input
                      id="branch-email"
                      type="email"
                      value={newBranch.email}
                      onChange={(e) => setNewBranch({ ...newBranch, email: e.target.value })}
                      placeholder="branch@example.com"
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="branch-phone" className="text-sm">Tellphone *</Label>
                    <Input
                      id="branch-phone"
                      value={newBranch.tellphone}
                      onChange={(e) => setNewBranch({ ...newBranch, tellphone: e.target.value })}
                      placeholder="0821234567"
                      className="border-gray-300"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="branch-mall" className="text-sm">Mall *</Label>
                  <Select
                    value={newBranch.mallId}
                    onValueChange={(value) => setNewBranch({ ...newBranch, mallId: value })}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Select mall" />
                    </SelectTrigger>
                    <SelectContent>
                      {malls.map((mall) => (
                        <SelectItem key={mall.mallID} value={String(mall.mallID)}>
                          {mall.mallName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {malls.length === 0 && (
                    <p className="mt-2 text-sm text-amber-600">
                      No malls are set up yet - ask an admin to add one before registering a branch.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="branch-lease" className="text-sm">Lease Agreement *</Label>
                  <Input
                    id="branch-lease"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setNewBranch({ ...newBranch, leaseFile: e.target.files?.[0] || null })}
                    className="border-gray-300"
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={closeAddBranch} className="border-gray-300 text-gray-700">
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleRegisterBranch}
                  disabled={isSubmittingBranch}
                >
                  {isSubmittingBranch ? 'Submitting...' : 'Submit Branch'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <p className="text-sm text-gray-500">
        Branches register themselves under your shop, or you can add one directly here. Approve or reject
        registrations below - approving emails the branch its login credentials.
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, ID, email, or mall..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 border-gray-300">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card className="bg-white rounded-lg border shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Branch Name</TableHead>
              <TableHead>Mall</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBranches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  {branches.length === 0
                    ? 'No branches registered under your shop yet.'
                    : 'No branches match your search or filter.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredBranches.map((branch) => (
                <TableRow key={branch.id} className="hover:bg-gray-50">
                  <TableCell className="text-gray-500">{branch.id}</TableCell>
                  <TableCell>{branch.shopName}</TableCell>
                  <TableCell>{branch.mallName || 'N/A'}</TableCell>
                  <TableCell>{branch.email}</TableCell>
                  <TableCell>{branch.tellphone || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusBadgeClass(branch.regStatus)}>
                      {branch.regStatus || 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {branch.regStatus === 'Approved' || branch.regStatus === 'Rejected' ? (
                      <span className="text-xs text-gray-400">No action needed</span>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actioningId === branch.id}
                          onClick={() => handleApprove(branch)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actioningId === branch.id}
                          onClick={() => handleReject(branch)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={rejectingBranch !== null} onOpenChange={(open) => !open && setRejectingBranch(null)}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Reject branch registration?</DialogTitle>
            <DialogDescription>
              Reject "{rejectingBranch?.shopName}"'s branch registration? They'll be notified by email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectingBranch(null)}
              disabled={actioningId === rejectingBranch?.id}
              className="border-gray-300 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReject}
              disabled={actioningId === rejectingBranch?.id}
              className="bg-red-600 hover:bg-red-700"
            >
              {actioningId === rejectingBranch?.id ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
