import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Box,
    Chip,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    AccountCircle,
    ExitToApp,
    Dashboard,
    QrCodeScanner,
    School,
    AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const { user, logout, hasRole } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [anchorEl, setAnchorEl] = useState(null);
    const isMenuOpen = Boolean(anchorEl);

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        handleMenuClose();
        await logout();
        navigate('/login');
    };

    const handleNavigation = (path) => {
        navigate(path);
        handleMenuClose();
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin':
                return 'error';
            case 'teacher':
                return 'primary';
            case 'student':
                return 'success';
            default:
                return 'default';
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return <AdminPanelSettings fontSize="small" />;
            case 'teacher':
                return <School fontSize="small" />;
            case 'student':
                return <QrCodeScanner fontSize="small" />;
            default:
                return null;
        }
    };

    const getDashboardPath = (role) => {
        switch (role) {
            case 'admin':
                return '/admin';
            case 'teacher':
                return '/teacher';
            case 'student':
                return '/student';
            default:
                return '/';
        }
    };

    const menuId = 'primary-search-account-menu';
    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            id={menuId}
            keepMounted
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            open={isMenuOpen}
            onClose={handleMenuClose}
        >
            <MenuItem onClick={() => handleNavigation(getDashboardPath(user?.role))}>
                <Dashboard sx={{ mr: 1 }} />
                Dashboard
            </MenuItem>
            <MenuItem onClick={() => handleNavigation('/profile')}>
                <AccountCircle sx={{ mr: 1 }} />
                Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} />
                Logout
            </MenuItem>
        </Menu>
    );

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" elevation={2}>
                <Toolbar>
                    {/* Logo/Title */}
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={{
                            flexGrow: 1,
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}
                        onClick={() => navigate(getDashboardPath(user?.role))}
                    >
                        <QrCodeScanner />
                        {!isMobile && 'Smart Attendance'}
                    </Typography>

                    {/* User Info */}
                    {user && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {/* Role Chip */}
                            <Chip
                                icon={getRoleIcon(user.role)}
                                label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                color={getRoleColor(user.role)}
                                size="small"
                                variant="outlined"
                                sx={{
                                    color: 'white',
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                    '& .MuiChip-icon': {
                                        color: 'white'
                                    }
                                }}
                            />

                            {/* User Name (hidden on mobile) */}
                            {!isMobile && (
                                <Typography variant="body2" sx={{ color: 'white' }}>
                                    {user.name}
                                </Typography>
                            )}

                            {/* Profile Menu */}
                            <IconButton
                                size="large"
                                edge="end"
                                aria-label="account of current user"
                                aria-controls={menuId}
                                aria-haspopup="true"
                                onClick={handleProfileMenuOpen}
                                color="inherit"
                            >
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: theme.palette.secondary.main
                                    }}
                                >
                                    {user.name.charAt(0).toUpperCase()}
                                </Avatar>
                            </IconButton>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>
            {renderMenu}
        </Box>
    );
};

export default Navbar;