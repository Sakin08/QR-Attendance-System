import { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    Button,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Alert,
    Fab,
} from '@mui/material';
import {
    QrCodeScanner,
    TrendingUp,
    CalendarToday,
    School,
    CheckCircle,
    Schedule,
    Warning,
    CameraAlt,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { studentAPI, handleApiError } from '../services/api';
import QRScanner from '../components/student/QRScanner';
import Loader from '../components/common/Loader';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [summaryResponse] = await Promise.all([
                studentAPI.getAttendanceSummary(),
                studentAPI.getMyAttendance({ limit: 5 })
            ]);

            if (summaryResponse.data.success) {
                setSummary(summaryResponse.data.data.summary);
                setRecentAttendance(summaryResponse.data.data.recentAttendance || []);
            }
        } catch (error) {
            const errorData = handleApiError(error);
            setError(errorData.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present':
                return 'success';
            case 'Late':
                return 'warning';
            case 'Excused':
                return 'info';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Present':
                return <CheckCircle />;
            case 'Late':
                return <Schedule />;
            case 'Excused':
                return <Warning />;
            default:
                return <CheckCircle />;
        }
    };

    if (isLoading) {
        return <Loader message="Loading dashboard..." />;
    }

    if (showScanner) {
        return <QRScanner onClose={() => setShowScanner(false)} />;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Welcome back, {user?.name}!
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    {user?.department} - Batch {user?.batch}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Quick Stats */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(4, 1fr)'
                },
                gap: 3,
                mb: 3
            }}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <TrendingUp color="primary" />
                            <Typography variant="h6" sx={{ ml: 1 }}>
                                Total Classes
                            </Typography>
                        </Box>
                        <Typography variant="h3" color="primary">
                            {summary?.totalAttendance || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            All time
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <CalendarToday color="success" />
                            <Typography variant="h6" sx={{ ml: 1 }}>
                                This Month
                            </Typography>
                        </Box>
                        <Typography variant="h3" color="success.main">
                            {summary?.monthlyAttendance || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Classes attended
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <School color="info" />
                            <Typography variant="h6" sx={{ ml: 1 }}>
                                This Week
                            </Typography>
                        </Box>
                        <Typography variant="h3" color="info.main">
                            {summary?.weeklyAttendance || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Classes attended
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <QrCodeScanner color="secondary" />
                            <Typography variant="h6" sx={{ ml: 1 }}>
                                Quick Scan
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            fullWidth
                            startIcon={<CameraAlt />}
                            onClick={() => setShowScanner(true)}
                            size="large"
                        >
                            Scan QR Code
                        </Button>
                    </CardContent>
                </Card>
            </Box>

            {/* Main Content */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                gap: 3
            }}>
                {/* Recent Attendance */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Recent Attendance
                    </Typography>
                    {recentAttendance.length > 0 ? (
                        <List>
                            {recentAttendance.map((record, index) => (
                                <ListItem key={index} divider={index < recentAttendance.length - 1}>
                                    <ListItemIcon>
                                        {getStatusIcon(record.status)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={record.course}
                                        secondary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {new Date(record.attendanceDate).toLocaleDateString()} - {record.attendanceTime}
                                                </Typography>
                                                <Chip
                                                    label={record.status}
                                                    size="small"
                                                    color={getStatusColor(record.status)}
                                                />
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <QrCodeScanner sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No attendance records yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Start scanning QR codes to mark your attendance
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<CameraAlt />}
                                onClick={() => setShowScanner(true)}
                            >
                                Scan Your First QR Code
                            </Button>
                        </Box>
                    )}
                </Paper>

                {/* Student Info */}
                <Box>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Student Information
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Student ID
                            </Typography>
                            <Typography variant="body1" fontWeight="bold" gutterBottom>
                                {user?.studentId}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Email
                            </Typography>
                            <Typography variant="body1" fontWeight="bold" gutterBottom>
                                {user?.email}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Department
                            </Typography>
                            <Typography variant="body1" fontWeight="bold" gutterBottom>
                                {user?.department}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                Batch
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                                {user?.batch}
                            </Typography>
                        </Box>
                    </Paper>

                    {/* Quick Actions */}
                    <Paper sx={{ p: 3, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Quick Actions
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<CalendarToday />}
                                onClick={() => {/* Navigate to attendance history */ }}
                            >
                                View Full History
                            </Button>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<TrendingUp />}
                                onClick={() => {/* Navigate to statistics */ }}
                            >
                                Attendance Statistics
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Box>

            {/* Floating Action Button for Quick Scan */}
            <Fab
                color="primary"
                aria-label="scan qr code"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                }}
                onClick={() => setShowScanner(true)}
            >
                <QrCodeScanner />
            </Fab>
        </Container>
    );
};

export default StudentDashboard;