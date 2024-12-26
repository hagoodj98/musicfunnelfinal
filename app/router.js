import { createBrowserRouter, RouterProvider } from 'next/router';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './page';
import Landing from './landing/page';
import ThankYou from './landing/thankyou/page';
import Cancel from './landing/cancel/page'


function ProtectedRoute({ children }){
    const {user, loading } = useAuth();
    
    if (loading) {
        return <div>Loading...</div>;
    }
    if (!user) {
        //Redirect to Home if not subscribed
        return <Home />;
    }
    return children;
}

const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />
    },
    {
        path: '/landing',
        element: <ProtectedRoute><Landing /></ProtectedRoute>
    },
    {
        path: '/landing/thankyou',
        element: <ProtectedRoute><ThankYou /></ProtectedRoute>
    },
    {
        path: 'landing/cancel',
        element: <ProtectedRoute><Cancel /></ProtectedRoute>
    }
]);

export function AppRouter() {
    return (
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    )
}