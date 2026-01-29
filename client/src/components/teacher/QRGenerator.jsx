import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    Alert,
    CircularProgress,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import {
    QrCode2,
    Timer,
    People,
    Refresh,
    CheckCircle,
    AccessTime,
    School,
    Class,
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { teacherAPI, handleApiError } from '../../services/api';

const QRGenerator = ({ preset, onClose }) => {
    const [qrData, setQrData] = useState(null);
    const [sessionStats, setSessionStats] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [recentAttendees, setRecentAttendees] = useState([]);

    useEffect(() => {
        if (preset) {
            generateQR();
        }
    }, [preset]);

    useEffect(() => {
        let interval;
        if (qrData && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        // QR expired
                        setQrData(null);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [qrData, timeRemaining]);

    useEffect(() => {
        let statsInterval;
        if (qrData?.session?._id) {
            // Poll for session statistics every 3 seconds
            statsInterval = setInterval(() => {
                fetchSessionStats();
            }, 3000);
        }
        return () => clearInterval(statsInterval);
    }, [qrData?.session?._id]);

    const generateQR = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await teacherAPI.generateQR(preset._id);
            if (response.data.success) {
                const data = response.data.data;
                setQrData(data);
                setTimeRemaining(data.remainingSeconds || 90);

                // Fetch initial stats
                if (data.session._id) {
                    fetchSessionStats();
                }
            }
        } catch (error) {
            const errorData = handleApiError(error);
            setError(errorData.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSessionStats = async () => {
        if (!qrData?.session?._id) return;

        try {
            const response = await teacherAPI.getSessionStats(qrData.session._id);
            if (response.data.success) {
                setSessionStats(response.data.data);
                setRecentAttendees(response.data.data.recentAttendees || []);
            }
        } catch (error) {
            console.error('Failed to fetch session stats:', error);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimeColor = () => {
        if (timeRemaining > 60) return 'success';
        if (timeRemaining > 30) return 'warning';
        return 'error';
    };

    const handleRegenerateQR = () => {
        generateQR();
    };

    if (isLoading) {
        return (
            <Dialog open={true} maxWidth="md" fullWidth>
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress size={60} />
                        <Typography variant="h6" sx={{ mt: 2 }}>
                            Generating QR Code...
                        </Typography>
                    </Box>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <QrCode2 />
                    QR Code - {preset.course}
                </Box>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 3
                }}>
                    {/* QR Code Display */}
                    <Paper sx={{ p: 3, textAlign: 'center', height: 'fit-content' }}>
                        {qrData ? (
                            <>
                                <Typography variant="h6" gutterBottom>
                                    Scan to Mark Attendance
                                </Typography>

                                <Box sx={{ mb: 3 }}>
                                    <QRCodeSVG
                                        value={qrData.qrToken}
                                        size={250}
                                        level="M"
                                        includeMargin={true}
                                        style={{
                                            border: '2px solid #1976d2',
                                            borderRadius: '8px',
                                            padding: '10px',
                                            backgroundColor: 'white'
                                        }}
                                    />
                                </Box>

                                {/* Timer */}
                                <Box sx={{ mb: 2 }}>
                                    <Chip
                                        icon={<Timer />}
                                        label={`${formatTime(timeRemaining)} remaining`}
                                        color={getTimeColor()}
                                        size="large"
                                        sx={{ fontSize: '1.1rem', py: 2 }}
                                    />
                                </Box>

                                {/* Progress Bar */}
                                <LinearProgress
                                    variant="determinate"
                                    value={(timeRemaining / 90) * 100}
                                    color={getTimeColor()}
                                    sx={{ height: 8, borderRadius: 4, mb: 2 }}
                                />

                                {timeRemaining === 0 && (
                                    <Button
                                        variant="contained"
                                        onClick={handleRegenerateQR}
                                        startIcon={<Refresh />}
                                        size="large"
                                    >
                                        Generate New QR Code
                                    </Button>
                                )}
                            </>
                        ) : (
                            <Box>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    QR Code Expired
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={handleRegenerateQR}
                                    startIcon={<Refresh />}
                                    size="large"
                                >
                                    Generate New QR Code
                                </Button>
                            </Box>
                        )}
                    </Paper>

                    {/* Class Information and Statistics */}
                    <Box>
                        {/* Class Info */}
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <School />
                                    Class Information
                                </Typography>
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 2
                                }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Course
                                        </Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {preset.course}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Type
                                        </Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {preset.classType}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Department
                                        </Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {preset.department}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Batch
                                        </Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {preset.batch}
                                        </Typography>
                                    </Box>
                                    {preset.section && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Section
                                            </Typography>
                                            <Typography variant="body1" fontWeight="bold">
                                                {preset.section}
                                            </Typography>
                                        </Box>
                                    )}
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Date & Time
                                        </Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Live Statistics */}
                        {sessionStats && (
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <People />
                                        Live Attendance Count
                                    </Typography>
                                    <Box sx={{ textAlign: 'center', py: 2 }}>
                                        <Typography variant="h2" color="primary" fontWeight="bold">
                                            {sessionStats.attendanceCount}
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            Students Present
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Attendees */}
                        {recentAttendees.length > 0 && (
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircle />
                                        Recent Attendees
                                    </Typography>
                                    <List dense>
                                        {recentAttendees.slice(0, 5).map((attendee, index) => (
                                            <ListItem key={index}>
                                                <ListItemIcon>
                                                    <CheckCircle
                                                        color={
                                                            attendee.status === 'Present' ? 'success' :
                                                                attendee.status === 'Late' ? 'warning' : 'info'
                                                        }
                                                        fontSize="small"
                                                    />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={attendee.studentName}
                                                    secondary={`${attendee.studentNumber} - ${new Date(attendee.markedAt).toLocaleTimeString()}`}
                                                />
                                                <Chip
                                                    label={attendee.status}
                                                    size="small"
                                                    color={
                                                        attendee.status === 'Present' ? 'success' :
                                                            attendee.status === 'Late' ? 'warning' : 'info'
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="outlined">
                    Close
                </Button>
                {qrData && (
                    <Button
                        onClick={handleRegenerateQR}
                        variant="contained"
                        startIcon={<Refresh />}
                    >
                        Generate New QR
                    </Button>
                )}
            </DialogActions>
        </Dialog >
    );
};

export default QRGenerator;