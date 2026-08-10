// "use client";

// import React, { createContext, useContext, useEffect, useState } from "react";
// import { onAuthStateChanged, User, signOut } from "firebase/auth";
// import { auth } from "@/lib/firebase";
// import { authStorage } from "@/lib/auth";

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   logout: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType>({
//   user: null,
//   loading: true,
//   logout: async () => {},
// });

// export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//       setUser(firebaseUser);
//       setLoading(false);
      
//       if (firebaseUser) {
//         try {
//           const token = await firebaseUser.getIdToken();
//           authStorage.setIdToken(token);
          
//           const isGoogle = firebaseUser.providerData.some(p => p.providerId === 'google.com');
//           if (isGoogle) {
//             authStorage.setGoogleUid(firebaseUser.uid);
//           }

//           // Gọi API Sync để lưu vào Firestore trên Backend
//           const apiBaseUrl =
//             process.env.NEXT_PUBLIC_API_BASE_URL ||
//             process.env.NEXT_PUBLIC_API_URL ||
//             "https://api.bmi-foodtour.io.vn";
//           await fetch(`${apiBaseUrl}/api/v1/auth/sync`, {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               "Authorization": `Bearer ${token}`
//             },
//             body: JSON.stringify({
//               email: firebaseUser.email,
//               name: firebaseUser.displayName,
//               photo_url: firebaseUser.photoURL
//             })
//           });

//         } catch (error) {
//           console.error("Lỗi đồng bộ người dùng:", error);
//         }
//       } else {
//         authStorage.clear();
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   const logout = async () => {
//     try {
//       await signOut(auth);
//       authStorage.clear();
//     } catch (error) {
//       console.error("Lỗi đăng xuất:", error);
//     }
//   };

//   return (
//     <AuthContext.Provider value={{ user, loading, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);



"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { authStorage } from "@/lib/auth";
import { getApiOrigin } from "@/lib/apiBase";

// 1. Định nghĩa kiểu dữ liệu mở rộng để User có chứa thuộc tính role
export interface AuthUser extends User {
  role?: "admin" | "user";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Bật loading trong lúc đợi gọi API Sync lấy quyền
          setLoading(true);

          const token = await firebaseUser.getIdToken();
          authStorage.setIdToken(token);
          
          const isGoogle = firebaseUser.providerData.some(p => p.providerId === 'google.com');
          if (isGoogle) {
            authStorage.setGoogleUid(firebaseUser.uid);
          }

          // Gọi API Sync để lưu vào Firestore trên Backend
          const apiBaseUrl = getApiOrigin();

          const response = await fetch(`${apiBaseUrl}/api/v1/auth/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              photo_url: firebaseUser.photoURL
            })
          });

          // Mặc định dự phòng quyền là "user" nếu API lỗi hoặc không trả về role
          let userRole: "admin" | "user" = "user"; 

          // 2. HỨNG VAI TRÒ (ROLE) TỪ BACKEND PYTHON TRẢ VỀ
          if (response.ok) {
            const resData = await response.json();
            if (resData.role) {
              userRole = resData.role; // Nhận "admin" hoặc "user"
            }
          }

          // 3. Giữ nguyên Firebase User instance để không mất getIdToken/reload.
          (firebaseUser as AuthUser).role = userRole;
          setUser(firebaseUser as AuthUser);

        } catch (error) {
          console.error("Lỗi đồng bộ người dùng:", error);
          // Fallback nếu lỗi kết nối mạng, vẫn giữ user đăng nhập dạng thường
          setUser(firebaseUser as AuthUser);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        authStorage.clear();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      authStorage.clear();
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
