// 'use client';

// import { useState } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Separator } from '@/components/ui/separator';
// import { Edit } from 'lucide-react';
// import { toast } from 'sonner';

// export default function ProfileSection() {
//   const { user } = useAuth();
//   const [isEditing, setIsEditing] = useState({
//     contacts: false,
//     email: false,
//     storeName: false,
//     password: false
//   });

//   const [formData, setFormData] = useState({
//     name: user?.name || '',
//     contacts: user?.contacts || '',
//     email: user?.email || '',
//     storeName: 'Store name',
//     password: '',
//     confirmPassword: ''
//   });

//   const handleEdit = (field: keyof typeof isEditing) => {
//     setIsEditing(prev => ({ ...prev, [field]: !prev[field] }));
//   };

//   const handleSave = (field: string) => {
//     setIsEditing(prev => ({ ...prev, [field]: false }));
//     toast.success(`${field} updated successfully`);
//   };

//   const handlePasswordSave = () => {
//     if (formData.password !== formData.confirmPassword) {
//       toast.error('Passwords do not match');
//       return;
//     }
//     handleSave('password');
//     setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
//   };

//   const handleDeleteAccount = () => {
//     if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
//       toast.success('Account deleted successfully');
//     }
//   };

//   return (
//     <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8">
//       {/* Header */}
//       {/* <div className="flex items-center justify-between">
//         <h1 className="text-3xl font-bold text-green-600">Profile</h1>
//       </div> */}

//       {/* Profile Form */}
//       <Card>
//       <CardHeader>
//   <div className="flex flex-col items-center">
//     <div className="text-sm text-gray-600 text-center w-full mb-2">Store type: Retail</div>
//     <div className="flex justify-between w-full">
//       <div className="relative">
//         <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
//           <span className="text-xs text-gray-500 text-center">Upload Photo</span>
//         </div>
//         <label htmlFor="upload-profile" className="absolute inset-0 cursor-pointer opacity-0">
//           Upload Store Profile/logo
//         </label>
//         <input
//           id="upload-profile"
//           type="file"
//           accept="image/*"
//           className="hidden"
//           onChange={(e) => {
//             const file = e.target.files?.[0];
//             if (file) {
//               // Simple placeholder - you can add actual upload logic here
//               alert(`Selected file: ${file.name}`);
//             }
//           }}
//         />
//       </div>
//       <div className="text-right">
//         <div className="text-sm text-gray-600 mt-1">Account reference number</div>
//       </div>
//     </div>
//   </div>
// </CardHeader>
//         <CardContent className="space-y-6">
//           {/* Account Info */}
//           <div>
//             <h3 className="text-green-600 font-medium mb-4">Account info</h3>

//             <div className="space-y-4">
//               <div>
//                 <Label>Name</Label>
//                 <Input
//                   value={formData.name}
//                   onChange={(e) => setFormData({...formData, name: e.target.value})}
//                   disabled
//                 />
//               </div>

//               <div>
//                 <Label>Contacts</Label>
//                 <div className="flex items-center space-x-2">
//                   <Input
//                     value={formData.contacts}
//                     onChange={(e) => setFormData({...formData, contacts: e.target.value})}
//                     disabled={!isEditing.contacts}
//                   />
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => isEditing.contacts ? handleSave('contacts') : handleEdit('contacts')}
//                   >
//                     <Edit className="h-4 w-4 text-red-500" />
//                   </Button>
//                 </div>
//               </div>

//               <div>
//                 <Label>Email address</Label>
//                 <div className="flex items-center space-x-2">
//                   <Input
//                     value={formData.email}
//                     onChange={(e) => setFormData({...formData, email: e.target.value})}
//                     disabled={!isEditing.email}
//                   />
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => isEditing.email ? handleSave('email') : handleEdit('email')}
//                   >
//                     <Edit className="h-4 w-4 text-red-500" />
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Store Info */}
//           <div>
//             <h3 className="text-green-600 font-medium mb-4">Store info</h3>

//             <div>
//               <Label>Store name</Label>
//               <div className="flex items-center space-x-2">
//                 <Input
//                   value={formData.storeName}
//                   onChange={(e) => setFormData({...formData, storeName: e.target.value})}
//                   disabled={!isEditing.storeName}
//                 />
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={() => isEditing.storeName ? handleSave('storeName') : handleEdit('storeName')}
//                 >
//                   <Edit className="h-4 w-4 text-red-500" />
//                 </Button>
//               </div>
//             </div>
//           </div>

//           <Separator />

//           {/* Security */}
//           <div>
//             <h3 className="text-green-600 font-medium mb-4">Security</h3>
//             {isEditing.password ? (
//               <div className="space-y-4">
//                 <div>
//                   <Label>New Password</Label>
//                   <Input
//                     type="password"
//                     value={formData.password}
//                     onChange={(e) => setFormData({...formData, password: e.target.value})}
//                   />
//                 </div>
//                 <div>
//                   <Label>Confirm Password</Label>
//                   <Input
//                     type="password"
//                     value={formData.confirmPassword}
//                     onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
//                   />
//                 </div>
//                 <div className="flex space-x-2">
//                   <Button
//                     variant="outline"
//                     className="w-full"
//                     onClick={handlePasswordSave}
//                   >
//                     Save Password
//                   </Button>
//                   <Button
//                     variant="outline"
//                     className="w-full"
//                     onClick={() => handleEdit('password')}
//                   >
//                     Cancel
//                   </Button>
//                 </div>
//               </div>
//             ) : (
//               <Button
//                 variant="outline"
//                 className="w-full"
//                 onClick={() => handleEdit('password')}
//               >
//                 Change password
//               </Button>
//             )}
//           </div>

//           <Separator />

//           {/* Account Actions */}
//           <div className="flex items-center justify-between">
//             <Button
//               variant="link"
//               className="text-red-600 p-0"
//               onClick={handleDeleteAccount}
//             >
//               Delete account
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }


'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Phone, Mail, Building, Shield, LogOut, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';

interface ShopProfile {
  id: number;
  shopName: string;
  shopType: string;
  username: string;
  phone: string;
  email: string;
  imageBase64?: string;
}

export default function ProfileSection() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [shopProfile, setShopProfile] = useState<ShopProfile>({
    id: Number(user?.id) || 0,
    shopName: user?.name || '',
    shopType: '',
    username: user?.username || '',
    phone: user?.contacts || '',
    email: user?.email || '',
  });

  // A Retail Shop Owner's user.id IS the RShop_ID directly - there's no
  // separate Manager/roleID lookup chain the way there is on the ShopManager
  // side, and RetailShopEntity has no name/surname, only a shop name.
  useEffect(() => {
    const fetchShopProfile = async () => {
      if (!user?.id) {
        console.error('[ProfileSection] User ID not found:', user);
        toast.error('User ID not found. Please log in again.');
        return;
      }

      setLoading(true);
      try {
        const shop = await authAPI.getRetailShopById(Number(user.id));
        setShopProfile({
          id: shop.rShopId,
          shopName: shop.shopName || user?.name || 'Unknown',
          shopType: shop.shopType,
          username: shop.username || user?.username || '',
          phone: shop.tellphone || user?.contacts || '',
          email: shop.email || user?.email || '',
          imageBase64: shop.imageBase64,
        });
      } catch (error: any) {
        console.error('[ProfileSection] Failed to fetch shop profile:', error);
        toast.error(error.message || 'Failed to load shop information');
      } finally {
        setLoading(false);
      }
    };

    fetchShopProfile();
  }, [user?.id, user?.username, user?.name, user?.contacts, user?.email]);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/login');
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('[ProfileSection] Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleChangePassword = () => {
    setIsChangePasswordOpen(true);
  };

  if (loading && !shopProfile.shopName) {
    return (
      <div className="w-full h-screen flex items-center justify-center py-12">
        <div className="animate-pulse">
          <Briefcase className="h-12 w-12 text-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 md:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20 ring-4 ring-green-100">
            <AvatarImage
              src={shopProfile.imageBase64 ? `data:image/jpeg;base64,${shopProfile.imageBase64}` : ''}
              alt={shopProfile.shopName || 'Shop'}
            />
            <AvatarFallback className="text-xl font-semibold bg-green-100 text-green-700">
              {shopProfile.shopName ? shopProfile.shopName.slice(0, 2).toUpperCase() : 'SM'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{shopProfile.shopName}</h1>
            <Badge variant="secondary" className="mt-1 bg-green-100 text-green-700">
              Retail Shop
            </Badge>
            <p className="text-sm text-gray-600 mt-1">
              Username: {shopProfile.username}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-green-700">
              <User className="h-5 w-5" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Phone Field */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>Contact Number</span>
              </Label>
              <Input value={shopProfile.phone} disabled className="bg-gray-50" />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>Email Address</span>
              </Label>
              <Input value={shopProfile.email} disabled className="bg-gray-50" />
            </div>
            <p className="text-xs text-gray-500">
              Contact information cannot be changed here yet. Contact support if you need updates.
            </p>
          </CardContent>
        </Card>

        {/* Shop Information */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-green-700">
              <Building className="h-5 w-5" />
              <span>Shop Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Shop Name Field */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2 text-sm font-medium">
                <Building className="h-4 w-4 text-gray-500" />
                <span>Shop Name</span>
              </Label>
              <Input value={shopProfile.shopName || 'Not assigned'} disabled className="bg-gray-50" />
            </div>

            {/* Shop Type Field */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2 text-sm font-medium">
                <Building className="h-4 w-4 text-gray-500" />
                <span>Shop Type</span>
              </Label>
              <Input value={shopProfile.shopType || 'Not assigned'} disabled className="bg-gray-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security & Actions */}
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-green-700">
            <Shield className="h-5 w-5" />
            <span>Security & Account Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              onClick={handleChangePassword}
              className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
            >
              <Shield className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button
              onClick={handleSignOut}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <Separator />

          <p className="text-center text-sm text-gray-500">
            To close your shop's account, please contact support.
          </p>
        </CardContent>
      </Card>

      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-green-700">Change Password</DialogTitle>
          </DialogHeader>
          <ChangePasswordForm onSuccess={() => setIsChangePasswordOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
