import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Container,
    Paper,
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    Tab,
    Tabs,
    MenuItem,
    InputAdornment,
    IconButton,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    QrCodeScanner,
    Person,
    Email,
    Lock,
    School,
    Badge,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [tabValue, setTabValue] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { login, register, isAuthenticated, clearError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    // Clear errors when switching tabs
    useEffect(() => {
        setError('');
        clearError();
    }, [tabValue]);

    const {
        register: registerField,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm({
        defaultValues: {
            role: ''
        }
    });

    const watchRole = watch('role');

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setError('');
        reset();
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        setError('');

        try {
            let result;
            if (tabValue === 0) {
                // Login
                result = await login({
                    email: data.email,
                    password: data.password,
                });
            } else {
                // Register
                result = await register(data);
            }

            if (result.success) {
                navigate(from, { replace: true });
            } else {
                setError(result.error || 'An error occurred');
            }
        } catch (error) {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {/* Logo and Title */}
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <QrCodeScanner sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography component="h1" variant="h4" fontWeight="bold">
                        Smart Attendance
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        QR-Based Attendance Management System
                    </Typography>
                </Box>

                <Paper elevation={3} sx={{ width: '100%', p: 4 }}>
                    {/* Tabs */}
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        centered
                        sx={{ mb: 3 }}
                    >
                        <Tab label="Login" />
                        <Tab label="Register" />
                    </Tabs>

                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Form */}
                    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                        {tabValue === 1 && (
                            <>
                                {/* Name Field */}
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="Full Name"
                                    autoComplete="name"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Person />
                                            </InputAdornment>
                                        ),
                                    }}
                                    {...registerField('name', {
                                        required: 'Name is required',
                                        minLength: {
                                            value: 2,
                                            message: 'Name must be at least 2 characters',
                                        },
                                    })}
                                    error={!!errors.name}
                                    helperText={errors.name?.message}
                                />

                                {/* Role Selection */}
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    select
                                    label="Role"
                                    defaultValue=""
                                    {...registerField('role', {
                                        required: 'Role is required',
                                    })}
                                    error={!!errors.role}
                                    helperText={errors.role?.message}
                                >
                                    <MenuItem value="">Select Role</MenuItem>
                                    <MenuItem value="student">Student</MenuItem>
                                    <MenuItem value="teacher">Teacher</MenuItem>
                                    <MenuItem value="admin">Admin</MenuItem>
                                </TextField>
                            </>
                        )}

                        {/* Email Field */}
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Email Address"
                            type="email"
                            autoComplete="email"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Email />
                                    </InputAdornment>
                                ),
                            }}
                            {...registerField('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address',
                                },
                            })}
                            error={!!errors.email}
                            helperText={errors.email?.message}
                        />

                        {/* Password Field */}
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete={tabValue === 0 ? 'current-password' : 'new-password'}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={togglePasswordVisibility}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            {...registerField('password', {
                                required: 'Password is required',
                                minLength: {
                                    value: 6,
                                    message: 'Password must be at least 6 characters',
                                },
                            })}
                            error={!!errors.password}
                            helperText={errors.password?.message}
                        />

                        {/* Additional fields for registration */}
                        {tabValue === 1 && (
                            <Box sx={{ mt: 2 }}>
                                {/* Department (for teachers and students) */}
                                {(watchRole === 'teacher' || watchRole === 'student') && (
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        label="Department"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <School />
                                                </InputAdornment>
                                            ),
                                        }}
                                        {...registerField('department', {
                                            required: 'Department is required',
                                        })}
                                        error={!!errors.department}
                                        helperText={errors.department?.message}
                                    />
                                )}

                                {/* Batch and Student ID for students */}
                                {watchRole === 'student' && (
                                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            label="Batch"
                                            placeholder="e.g., 2024"
                                            {...registerField('batch', {
                                                required: 'Batch is required',
                                            })}
                                            error={!!errors.batch}
                                            helperText={errors.batch?.message}
                                        />
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            label="Student ID"
                                            placeholder="e.g., CS2024001"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Badge />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            {...registerField('studentId', {
                                                required: 'Student ID is required',
                                                minLength: {
                                                    value: 3,
                                                    message: 'Student ID must be at least 3 characters',
                                                },
                                            })}
                                            error={!!errors.studentId}
                                            helperText={errors.studentId?.message}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? 'Please wait...'
                                : tabValue === 0
                                    ? 'Sign In'
                                    : 'Sign Up'}
                        </Button>
                    </Box>

                    {/* Additional Info */}
                    {tabValue === 1 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                <strong>Note:</strong> For testing purposes, you can use any email address.
                                In production, students would need to use their university email.
                            </Typography>
                        </Alert>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;