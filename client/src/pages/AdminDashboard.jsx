import { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    Button,
    Alert,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
} from '@mui/material';
import {
    Dashboard,
    People,
    School,
    Class,
    TrendingUp,
    Security,
    Assessment,
    PersonAdd,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Mock data for demonstration
    const [stats, setStats] = useState({
        totalUsers: 1250,
        totalStudents: 1000,
        totalTeachers: 45,
        totalAdmins: 5,
        totalDepartments: 8,
        totalCourses: 120,
        totalSessions: 2500,
        activeToday: 350,
    });

    const [recentActivity, setRecentActivity] = useState([
        {
            id: 1,
            action: 'User Registration',
            user: 'John Doe (Student)',
            timestamp: new Date().toISOString(),
            status: 'success'
        },
        {
            id: 2,
            action: 'QR Generated',
            user: 'Dr. Smith (Teacher)',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            status: 'info'
        },
        {
            id: 3,
            action: 'Bulk Import',
            user: 'Admin User',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            status: 'success'
        },
        {
            id: 4,
            action: 'Suspicious Activity',
            user: 'Unknown User',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            status: 'warning'
        },
    ]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success':
                return 'success';
            case 'warning':
                return 'warning';
            case 'error':
                return 'error';
            case 'info':
                return 'info';
            default:
                return 'default';
        }
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    if (isLoading) {
        return <Loader message="Loading admin dashboard..." />;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Admin Dashboard
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Welcome back, {user?.name} - System Administrator
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab icon={<Dashboard />} label="Overview" />
                    <Tab icon={<People />} label="Users" />
                    <Tab icon={<School />} label="Departments" />
                    <Tab icon={<Class />} label="Courses" />
                    <Tab icon={<Assessment />} label="Reports" />
                    <Tab icon={<Security />} label="Security" />
                </Tabs>
            </Paper>

            {/* Tab Content */}
            {tabValue === 0 && (
                <>
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
                        {/* Stats Cards */}
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <People color="primary" />
                                    <Typography variant="h6" sx={{ ml: 1 }}>
                                        Total Users
                                    </Typography>
                                </Box>
                                <Typography variant="h3" color="primary">
                                    {stats.totalUsers.toLocaleString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    All registered users
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <School color="success" />
                                    <Typography variant="h6" sx={{ ml: 1 }}>
                                        Students
                                    </Typography>
                                </Box>
                                <Typography variant="h3" color="success.main">
                                    {stats.totalStudents.toLocaleString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Active students
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <PersonAdd color="info" />
                                    <Typography variant="h6" sx={{ ml: 1 }}>
                                        Teachers
                                    </Typography>
                                </Box>
                                <Typography variant="h3" color="info.main">
                                    {stats.totalTeachers}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Faculty members
                                </Typography>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <TrendingUp color="secondary" />
                                    <Typography variant="h6" sx={{ ml: 1 }}>
                                        Active Today
                                    </Typography>
                                </Box>
                                <Typography variant="h3" color="secondary.main">
                                    {stats.activeToday}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Users online today
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                        gap: 3,
                        mb: 3
                    }}>
                        {/* System Stats */}
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                System Statistics
                            </Typography>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: 2
                            }}>
                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                    <Typography variant="h4" color="primary">
                                        {stats.totalDepartments}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Departments
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                    <Typography variant="h4" color="success.main">
                                        {stats.totalCourses}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Courses
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center', py: 2, gridColumn: '1 / -1' }}>
                                    <Typography variant="h4" color="info.main">
                                        {stats.totalSessions.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total QR Sessions Generated
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>

                        {/* Recent Activity */}
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Recent Activity
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Action</TableCell>
                                            <TableCell>User</TableCell>
                                            <TableCell>Time</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {recentActivity.map((activity) => (
                                            <TableRow key={activity.id}>
                                                <TableCell>{activity.action}</TableCell>
                                                <TableCell>{activity.user}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formatTimestamp(activity.timestamp)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={activity.status}
                                                        size="small"
                                                        color={getStatusColor(activity.status)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>

                    {/* Quick Actions */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Quick Actions
                        </Typography>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, 1fr)',
                                md: 'repeat(4, 1fr)'
                            },
                            gap: 2
                        }}>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<PersonAdd />}
                                onClick={() => {/* Navigate to user creation */ }}
                            >
                                Add User
                            </Button>

                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<School />}
                                onClick={() => {/* Navigate to department management */ }}
                            >
                                Manage Departments
                            </Button>

                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<Class />}
                                onClick={() => {/* Navigate to course management */ }}
                            >
                                Manage Courses
                            </Button>

                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<Assessment />}
                                onClick={() => {/* Navigate to reports */ }}
                            >
                                View Reports
                            </Button>
                        </Box>
                    </Paper>
                </>
            )}

            {/* Other tab contents would go here */}
            {tabValue === 1 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        User Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        User management functionality will be implemented here.
                    </Typography>
                </Paper>
            )}

            {tabValue === 2 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Department Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Department management functionality will be implemented here.
                    </Typography>
                </Paper>
            )}

            {tabValue === 3 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Course Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Course management functionality will be implemented here.
                    </Typography>
                </Paper>
            )}

            {tabValue === 4 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Reports & Analytics
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Reports and analytics functionality will be implemented here.
                    </Typography>
                </Paper>
            )}

            {tabValue === 5 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Security & Activity Logs
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Security monitoring and activity logs will be implemented here.
                    </Typography>
                </Paper>
            )}
        </Container>
    );
};

export default AdminDashboard;