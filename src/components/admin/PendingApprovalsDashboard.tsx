'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Check, X, RefreshCw, LogOut, Store, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { PendingRetailShop, PendingBranchShop } from '@/lib/authTypes';

type PendingEntry =
  | { kind: 'retail'; shop: PendingRetailShop }
  | { kind: 'branch'; shop: PendingBranchShop };

export default function PendingApprovalsDashboard() {
  const { logout } = useAuth();
  const [retailShops, setRetailShops] = useState<PendingRetailShop[]>([]);
  const [branchShops, setBranchShops] = useState<PendingBranchShop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<PendingEntry | null>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [retail, branches] = await Promise.all([
        authAPI.getPendingRetailShops(),
        authAPI.getPendingBranchShops(),
      ]);
      setRetailShops(retail);
      setBranchShops(branches);
    } catch (error: any) {
      console.error('[PendingApprovalsDashboard] Failed to fetch pending registrations:', error);
      toast.error(error.message || 'Failed to load pending registrations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleApprove = async (entry: PendingEntry) => {
    const key = `${entry.kind}-${entry.shop.id}`;
    setActioningId(key);
    try {
      const response =
        entry.kind === 'retail'
          ? await authAPI.approveRetailShop(entry.shop.id)
          : await authAPI.approveBranch(entry.shop.id);

      if (response.statusCode === 200) {
        toast.success(`${entry.shop.shopName} approved. Login credentials have been emailed to them.`);
        await fetchAll();
      } else {
        toast.error(response.message || 'Failed to approve.');
      }
    } catch (error: any) {
      console.error('[PendingApprovalsDashboard] Approve error:', error);
      toast.error(error.message || 'Failed to approve.');
    } finally {
      setActioningId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    const key = `${rejecting.kind}-${rejecting.shop.id}`;
    setActioningId(key);
    try {
      const response =
        rejecting.kind === 'retail'
          ? await authAPI.rejectRetailShop(rejecting.shop.id)
          : await authAPI.rejectBranch(rejecting.shop.id);

      if (response.statusCode === 200) {
        toast.success(`${rejecting.shop.shopName} rejected.`);
        setRejecting(null);
        await fetchAll();
      } else {
        toast.error(response.message || 'Failed to reject.');
      }
    } catch (error: any) {
      console.error('[PendingApprovalsDashboard] Reject error:', error);
      toast.error(error.message || 'Failed to reject.');
    } finally {
      setActioningId(null);
    }
  };

  const renderTable = (
    title: string,
    icon: React.ReactNode,
    rows: PendingRetailShop[] | PendingBranchShop[],
    kind: 'retail' | 'branch'
  ) => (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-medium text-gray-900 mb-4">
        {icon}
        {title}
        <span className="text-sm font-normal text-gray-500">({rows.length} pending)</span>
      </h2>
      <Card className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shop Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500">
                  Nothing pending.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((shop) => {
                const entry: PendingEntry =
                  kind === 'retail' ? { kind: 'retail', shop } : { kind: 'branch', shop };
                const key = `${kind}-${shop.id}`;
                return (
                  <TableRow key={key} className="hover:bg-gray-50">
                    <TableCell>{shop.shopName}</TableCell>
                    <TableCell>{shop.email}</TableCell>
                    <TableCell>{shop.tellphone || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actioningId === key}
                          onClick={() => handleApprove(entry)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actioningId === key}
                          onClick={() => setRejecting(entry)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="eMALL Logo" className="h-60 w-auto -ml-16" />
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border-2 border-gray-300 rounded-full">
                <AvatarFallback className="bg-green-100 text-green-600 border-2 border-gray-300 rounded-full">
                  A
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" onClick={logout} className="flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAll}
            disabled={isLoading}
            className="flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="animate-spin h-8 w-8 border-4 border-gray-400 border-t-transparent rounded-full mx-auto" />
            <p className="mt-2 text-gray-500">Loading pending registrations...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {renderTable('Retail Shops', <Store className="h-5 w-5 text-gray-500" />, retailShops, 'retail')}
            {renderTable('Branch Shops', <Building2 className="h-5 w-5 text-gray-500" />, branchShops, 'branch')}
          </div>
        )}
      </div>

      <Dialog open={rejecting !== null} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Reject registration?</DialogTitle>
            <DialogDescription>
              Reject "{rejecting?.shop.shopName}"'s registration? They'll be notified by email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)} className="border-gray-300 text-gray-700">
              Cancel
            </Button>
            <Button onClick={confirmReject} className="bg-red-600 hover:bg-red-700">
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
