import { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    Button,
    IconButton,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Alert,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
} from '@mui/material';
import {
    Add,
    QrCode2,
    Edit,
    Delete,
    School,
    Class,
    People,
    TrendingUp,
    Visibility,
    GetApp,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { teacherAPI, handleApiError } from '../services/api';
import QRGenerator from '../components/teacher/QRGenerator';
import Loader from '../components/common/Loader';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const [presets, setPresets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showQRGenerator, setShowQRGenerator] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            department: user?.department || '',
            batch: '',
            course: '',
            classType: '',
            section: ''
        }
    });

    useEffect(() => {
        fetchPresets();
    }, []);

    const fetchPresets = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await teacherAPI.getPresets();
            if (response.data.success) {
                setPresets(response.data.data.presets);
            }
        } catch (error) {
            const errorData = handleApiError(error);
            setError(errorData.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePreset = async (data) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await teacherAPI.createPreset(data);
            if (response.data.success) {
                setPresets([response.data.data.preset, ...presets]);
                setShowCreateDialog(false);
                reset();
            }
        } catch (error) {
            const errorData = handleApiError(error);
            setError(errorData.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePreset = async (presetId) => {
        if (!window.confirm('Are you sure you want to delete this preset?')) {
            return;
        }

        try {
            await teacherAPI.deletePreset(presetId);
            setPresets(presets.filter(preset => preset._id !== presetId));
        } catch (error) {
            const errorData = handleApiError(error);
            setError(errorData.message);
        }
    };

    const handleGenerateQR = (preset) => {
        setSelectedPreset(preset);
        setShowQRGenerator(true);
    };

    const handleCloseQRGenerator = () => {
        setShowQRGenerator(false);
        setSelectedPreset(null);
    };

    const getClassTypeColor = (type) => {
        switch (type) {
            case 'Theory':
                return 'primary';
            case 'Lab':
                return 'success';
            case 'Tutorial':
                return 'warning';
            case 'Seminar':
                return 'info';
            default:
                return 'default';
        }
    };

    if (isLoading) {
        return <Loader message="Loading dashboard..." />;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Teacher Dashboard
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Welcome back, {user?.name} - {user?.department}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

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
                {/* Quick Stats */}
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Class color="primary" />
                            <Typography variant="h6" sx={{ ml: 1 }}>
                                Class Presets
                            </Typography>
                        </Box>
                        <Typography variant="h3" color="primary">
                            {presets.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total configurations
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <QrCode2 color="success" />
                            <Typography variant="h6" sx={{ ml: 1 }}>
                                Total Sessions
                            </Typography>
                        </Box>
                        <Typography variant="h3" color="success.main">
                            {presets.reduce((total, preset) => total + (preset.totalSessions || 0), 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            QR codes generated
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <School color="info" />
                            <Typography variant="h6" sx={{ ml: 1 }}>
                                Departments
                            </Typography>
                        </Box>
                        <Typography variant="h3" color="info.main">
                            {[...new Set(presets.map(p => p.department))].length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Teaching in
                        </Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <People color="secondary" />
                            <Typography variant="h6" sx={{ ml: 1 }}>
                                Quick Action
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            fullWidth
                            startIcon={<Add />}
                            onClick={() => setShowCreateDialog(true)}
                            size="large"
                        >
                            New Preset
                        </Button>
                    </CardContent>
                </Card>
            </Box>

            {/* Class Presets List */}
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">
                        Class Presets
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setShowCreateDialog(true)}
                    >
                        Create New Preset
                    </Button>
                </Box>

                {presets.length > 0 ? (
                    <List>
                        {presets.map((preset, index) => (
                            <ListItem
                                key={preset._id}
                                divider={index < presets.length - 1}
                                sx={{ py: 2 }}
                            >
                                <ListItemText
                                    primary={preset.course}
                                    secondary={
                                        <>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <Chip
                                                    label={preset.classType}
                                                    size="small"
                                                    color={getClassTypeColor(preset.classType)}
                                                />
                                                {preset.section && (
                                                    <Chip
                                                        label={`Section ${preset.section}`}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </Box>
                                            <Box component="span" sx={{ display: 'block' }}>
                                                {preset.department} - Batch {preset.batch}
                                            </Box>
                                            <Box component="span" sx={{ display: 'block' }}>
                                                Sessions: {preset.totalSessions || 0} |
                                                Last used: {preset.lastUsed ?
                                                    new Date(preset.lastUsed).toLocaleDateString() :
                                                    'Never'
                                                }
                                            </Box>
                                        </>
                                    }
                                    primaryTypographyProps={{ variant: 'h6' }}
                                    secondaryTypographyProps={{ component: 'div' }}
                                />
                                <ListItemSecondaryAction>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<QrCode2 />}
                                            onClick={() => handleGenerateQR(preset)}
                                        >
                                            Generate QR
                                        </Button>
                                        <IconButton
                                            size="small"
                                            onClick={() => {/* View attendance */ }}
                                        >
                                            <Visibility />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => {/* Export data */ }}
                                        >
                                            <GetApp />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeletePreset(preset._id)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Box>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Class sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No class presets yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Create your first class preset to start generating QR codes for attendance
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setShowCreateDialog(true)}
                        >
                            Create Your First Preset
                        </Button>
                    </Box>
                )}
            </Paper>

            {/* Floating Action Button */}
            {!showCreateDialog && !showQRGenerator && (
                <Fab
                    color="primary"
                    aria-label="add preset"
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                    }}
                    onClick={() => setShowCreateDialog(true)}
                >
                    <Add />
                </Fab>
            )}

            {/* Create Preset Dialog */}
            <Dialog
                open={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Create New Class Preset</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Course Name"
                            placeholder="e.g., Data Structures and Algorithms"
                            {...register('course', {
                                required: 'Course name is required',
                            })}
                            error={!!errors.course}
                            helperText={errors.course?.message}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Department"
                            defaultValue={user?.department}
                            {...register('department', {
                                required: 'Department is required',
                            })}
                            error={!!errors.department}
                            helperText={errors.department?.message}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Batch"
                            placeholder="e.g., 2024"
                            {...register('batch', {
                                required: 'Batch is required',
                            })}
                            error={!!errors.batch}
                            helperText={errors.batch?.message}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            select
                            label="Class Type"
                            defaultValue=""
                            {...register('classType', {
                                required: 'Class type is required',
                            })}
                            error={!!errors.classType}
                            helperText={errors.classType?.message}
                        >
                            <MenuItem value="">Select Class Type</MenuItem>
                            <MenuItem value="Theory">Theory</MenuItem>
                            <MenuItem value="Lab">Lab</MenuItem>
                            <MenuItem value="Tutorial">Tutorial</MenuItem>
                            <MenuItem value="Seminar">Seminar</MenuItem>
                        </TextField>

                        <TextField
                            margin="normal"
                            fullWidth
                            select
                            label="Section (Optional)"
                            defaultValue=""
                            {...register('section')}
                        >
                            <MenuItem value="">No Section</MenuItem>
                            <MenuItem value="A">Section A</MenuItem>
                            <MenuItem value="B">Section B</MenuItem>
                            <MenuItem value="C">Section C</MenuItem>
                            <MenuItem value="D">Section D</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCreateDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit(handleCreatePreset)}
                        variant="contained"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Preset'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* QR Generator Dialog */}
            {showQRGenerator && selectedPreset && (
                <QRGenerator
                    preset={selectedPreset}
                    onClose={handleCloseQRGenerator}
                />
            )}
        </Container>
    );
};

export default TeacherDashboard;