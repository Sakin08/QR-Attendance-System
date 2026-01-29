import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const ProtectedRoute = ({ children, requiredRole = null, requiredRoles = null }) => {
    const { isAuthenticated, isLoading, user, hasRole, hasAnyRole } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                gap={2}
            >
                <CircularProgress size={60} />
                <Typography variant="h6" color="textSecondary">
                    Loading...
                </Typography>
            </Box>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access
    if (requiredRole && !hasRole(requiredRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    if (requiredRoles && !hasAnyRole(requiredRoles)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Render children if all checks pass
    return children;
};

export default ProtectedRoute;