'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, Check, X, RefreshCw, Store } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { BranchShop } from '@/lib/authTypes';

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
  const [branches, setBranches] = useState<BranchShop[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [shopId, setShopId] = useState<number>(0);
  const [rejectingBranch, setRejectingBranch] = useState<BranchShop | null>(null);

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

  const filteredBranches = branches.filter(
    (branch) =>
      branch.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchBranches(shopId)}
          className="flex items-center text-green-600 border-gray-300"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      <p className="text-sm text-gray-500">
        Branches register themselves under your shop. Approve or reject registrations here - approving
        emails the branch its login credentials.
      </p>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search branches..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
        />
      </div>
      <Card className="bg-white rounded-lg border shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBranches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  No branches registered under your shop yet.
                </TableCell>
              </TableRow>
            ) : (
              filteredBranches.map((branch) => (
                <TableRow key={branch.id} className="hover:bg-gray-50">
                  <TableCell>{branch.shopName}</TableCell>
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
