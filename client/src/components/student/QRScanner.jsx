import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    QrCodeScanner,
    CameraAlt,
    FlashOn,
    FlashOff,
    Refresh,
    CheckCircle,
    Error,
} from '@mui/icons-material';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { studentAPI, handleApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getCurrentLocation, requestCameraPermission } from '../../utils/deviceFingerprint';

const QRScanner = () => {
    const { user } = useAuth();
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [cameraPermission, setCameraPermission] = useState(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [attendanceData, setAttendanceData] = useState(null);

    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    useEffect(() => {
        checkCameraPermission();
        return () => {
            stopScanner();
        };
    }, []);

    const checkCameraPermission = async () => {
        try {
            const hasPermission = await requestCameraPermission();
            setCameraPermission(hasPermission);
            if (!hasPermission) {
                setError('Camera permission is required to scan QR codes. Please enable camera access and refresh the page.');
            }
        } catch (error) {
            console.error('Camera permission check failed:', error);
            setCameraPermission(false);
            setError('Unable to access camera. Please check your browser settings.');
        }
    };

    const startScanner = async () => {
        if (!cameraPermission) {
            await checkCameraPermission();
            return;
        }

        setIsScanning(true);
        setError(null);
        setScanResult(null);

        try {
            const html5QrCode = new Html5Qrcode("qr-reader");
            html5QrCodeRef.current = html5QrCode;

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            };

            await html5QrCode.start(
                { facingMode: "environment" }, // Use back camera
                config,
                onScanSuccess,
                onScanFailure
            );
        } catch (error) {
            console.error('Scanner start error:', error);
            setError('Failed to start camera. Please check your camera permissions.');
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch (error) {
                console.error('Scanner stop error:', error);
            }
        }
        setIsScanning(false);
    };

    const onScanSuccess = async (decodedText, decodedResult) => {
        console.log('QR Code scanned:', decodedText);
        setScanResult(decodedText);
        await stopScanner();
        await markAttendance(decodedText);
    };

    const onScanFailure = (error) => {
        // Ignore scan failures as they're common during scanning
        // console.log('Scan failure:', error);
    };

    const markAttendance = async (qrToken) => {
        setIsLoading(true);
        setError(null);

        try {
            // Get location if available
            let location = null;
            try {
                location = await getCurrentLocation();
            } catch (locationError) {
                console.log('Location not available:', locationError.message);
            }

            const response = await studentAPI.markAttendance({
                qrToken,
                location,
            });

            if (response.data.success) {
                setAttendanceData(response.data.data.attendanceRecord);
                setShowSuccessDialog(true);
            }
        } catch (error) {
            const errorData = handleApiError(error);
            setError(errorData.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = () => {
        setError(null);
        setScanResult(null);
        setAttendanceData(null);
        startScanner();
    };

    const handleCloseSuccessDialog = () => {
        setShowSuccessDialog(false);
        setAttendanceData(null);
        setScanResult(null);
    };

    if (cameraPermission === false) {
        return (
            <Box sx={{ p: 3 }}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <CameraAlt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        Camera Access Required
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        To scan QR codes for attendance, please allow camera access in your browser settings.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={checkCameraPermission}
                        startIcon={<Refresh />}
                    >
                        Check Camera Permission
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QrCodeScanner />
                QR Code Scanner
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
                Scan the QR code displayed by your teacher to mark your attendance.
            </Typography>

            {/* Scanner Container */}
            <Paper sx={{ p: 3, mb: 3 }}>
                {!isScanning && !isLoading && (
                    <Box sx={{ textAlign: 'center' }}>
                        <QrCodeScanner sx={{ fontSize: 100, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Ready to Scan
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Position the QR code within the camera frame
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={startScanner}
                            startIcon={<CameraAlt />}
                        >
                            Start Scanning
                        </Button>
                    </Box>
                )}

                {isScanning && (
                    <Box>
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Scanning for QR Code...
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Point your camera at the QR code
                            </Typography>
                        </Box>

                        <Box
                            id="qr-reader"
                            sx={{
                                width: '100%',
                                maxWidth: 400,
                                mx: 'auto',
                                '& video': {
                                    width: '100%',
                                    borderRadius: 2,
                                },
                            }}
                        />

                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={stopScanner}
                                color="error"
                            >
                                Stop Scanning
                            </Button>
                        </Box>
                    </Box>
                )}

                {isLoading && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress size={60} />
                        <Typography variant="h6" sx={{ mt: 2 }}>
                            Marking Attendance...
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Error Display */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    action={
                        <Button color="inherit" size="small" onClick={handleRetry}>
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {/* Student Info Card */}
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Student Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Name:</strong> {user?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Student ID:</strong> {user?.studentId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Department:</strong> {user?.department}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Batch:</strong> {user?.batch}
                    </Typography>
                </CardContent>
            </Card>

            {/* Success Dialog */}
            <Dialog
                open={showSuccessDialog}
                onClose={handleCloseSuccessDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ textAlign: 'center', color: 'success.main' }}>
                    <CheckCircle sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="h5">
                        Attendance Marked Successfully!
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {attendanceData && (
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body1" paragraph>
                                <strong>Course:</strong> {attendanceData.course}
                            </Typography>
                            <Typography variant="body1" paragraph>
                                <strong>Date:</strong> {new Date(attendanceData.attendanceDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body1" paragraph>
                                <strong>Time:</strong> {attendanceData.attendanceTime}
                            </Typography>
                            <Typography variant="body1" paragraph>
                                <strong>Status:</strong>
                                <span style={{
                                    color: attendanceData.status === 'Present' ? 'green' :
                                        attendanceData.status === 'Late' ? 'orange' : 'blue',
                                    fontWeight: 'bold',
                                    marginLeft: '8px'
                                }}>
                                    {attendanceData.status}
                                </span>
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center' }}>
                    <Button
                        onClick={handleCloseSuccessDialog}
                        variant="contained"
                        color="primary"
                    >
                        Continue
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default QRScanner;