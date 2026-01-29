import React from 'react';
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material';

const Loader = ({
    open = true,
    message = 'Loading...',
    size = 60,
    backdrop = false
}) => {
    const LoaderContent = (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            gap={2}
            sx={backdrop ? {} : { minHeight: '200px' }}
        >
            <CircularProgress size={size} />
            {message && (
                <Typography variant="h6" color="textSecondary">
                    {message}
                </Typography>
            )}
        </Box>
    );

    if (backdrop) {
        return (
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                }}
                open={open}
            >
                {LoaderContent}
            </Backdrop>
        );
    }

    return LoaderContent;
};

export default Loader;