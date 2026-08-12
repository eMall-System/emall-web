// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";

// export default function Home() {
//   const router = useRouter();

//   useEffect(() => {
//     router.replace("/login");
//   }, [router]);

//   return (
//     <div className="flex items-center justify-center min-h-screen">
//       <div className="text-center">
//         <div className="text-green-600 text-lg">Redirecting to login...</div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoginPage from "./login/page";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [minLoading, setMinLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || minLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
       
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (user.type === "Packager") {
    router.push("/dashboard");
    return null;
  }

  return <LoginPage />;
}
