// import { useCallback, useMemo, useState } from 'react'
// import { authApi } from '../services/api'
// import { AuthContext } from './authState'

// const storedUser = () => {
//   try {
//     return JSON.parse(localStorage.getItem('morafeq_user'))
//   } catch {
//     return null
//   }
// }

// export function AuthProvider({ children }) {
//   const [token, setToken] = useState(() =>
//     localStorage.getItem('morafeq_access_token'),
//   )
//   const [user, setUser] = useState(storedUser)

//   const saveSession = useCallback((accessToken, nextUser) => {
//     localStorage.setItem('morafeq_access_token', accessToken)
//     setToken(accessToken)

//     if (nextUser) {
//       localStorage.setItem('morafeq_user', JSON.stringify(nextUser))
//       setUser(nextUser)
//     }
//   }, [])

//   const login = useCallback(async (payload) => {
//     const data = await authApi.login(payload)
//     saveSession(data.accessToken, data.user)
//     return data
//   }, [saveSession])

//   const confirmOtp = useCallback(async (payload) => {
//     const data = await authApi.confirm(payload)
//     if (data.accessToken) {
//       saveSession(data.accessToken, data.user)
//       const currentUser = await authApi.me()
//       localStorage.setItem('morafeq_user', JSON.stringify(currentUser))
//       setUser(currentUser)
//     }
//     return data
//   }, [saveSession])

//   const completeGoogleLogin = useCallback(async (accessToken) => {
//     saveSession(accessToken, null)
//     const currentUser = await authApi.me()
//     localStorage.setItem('morafeq_user', JSON.stringify(currentUser))
//     setUser(currentUser)
//     return currentUser
//   }, [saveSession])

//   const logout = useCallback(async () => {
//     try {
//       await authApi.logout()
//     } finally {
//       localStorage.removeItem('morafeq_access_token')
//       localStorage.removeItem('morafeq_user')
//       setToken(null)
//       setUser(null)
//     }
//   }, [])

//   const value = useMemo(
//     () => ({
//       token,
//       user,
//       isAuthenticated: Boolean(token),
//       login,
//       confirmOtp,
//       completeGoogleLogin,
//       logout,
//     }),
//     [token, user, login, confirmOtp, completeGoogleLogin, logout],
//   )

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
// }

import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/authApi";
import { AuthContext } from "../utils/authState";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem("morafeq_access_token"),
  );

  const [user, setUser] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const saveSession = useCallback((accessToken, nextUser = null) => {
    localStorage.setItem("morafeq_access_token", accessToken);
    setToken(accessToken);

    if (nextUser) {
      setUser(nextUser);
    }
  }, []);

  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!token) {
        setIsUserLoading(false);
        return;
      }

      try {
        setIsUserLoading(true);
        const currentUser = await authApi.me();
        setUser(currentUser);
      } catch {
        localStorage.removeItem("morafeq_access_token");
        localStorage.removeItem("morafeq_user");
        setToken(null);
        setUser(null);
      } finally {
        setIsUserLoading(false);
      }
    };

    loadCurrentUser();
  }, [token]);

  const login = useCallback(
    async (payload) => {
      const data = await authApi.login(payload);
      saveSession(data.accessToken, data.user);
      return data;
    },
    [saveSession],
  );

  // const confirmOtp = useCallback(
  //   async (payload) => {
  //     const data = await authApi.confirm(payload);

  //     if (data.accessToken) {
  //       saveSession(data.accessToken);

  //       const currentUser = await authApi.me();
  //       setUser(currentUser);
  //     }

  //     return data;
  //   },
  //   [saveSession],
  // );

  const confirmOtp = useCallback(
    async (payload) => {
      const data = await authApi.confirm(payload);

      if (data.accessToken) {
        saveSession(data.accessToken);

        const currentUser = await authApi.me();
        setUser(currentUser);

        return {
          ...data,
          user: currentUser,
        };
      }

      return data;
    },
    [saveSession],
  );

  const completeGoogleLogin = useCallback(
    async (accessToken) => {
      saveSession(accessToken);

      const currentUser = await authApi.me();
      setUser(currentUser);

      return currentUser;
    },
    [saveSession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem("morafeq_access_token");

      // remove old stored user if it existed from previous version
      localStorage.removeItem("morafeq_user");

      setToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isUserLoading,
      isAuthenticated: Boolean(token),
      login,
      confirmOtp,
      completeGoogleLogin,
      logout,
    }),
    [
      token,
      user,
      isUserLoading,
      login,
      confirmOtp,
      completeGoogleLogin,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
