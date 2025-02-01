import { Box } from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";

export function FlexModal(props: { children: JSX.Element | JSX.Element[], width: number, height: number, color: string }) {
    return (
        <Box sx={{ border: `3px solid ${props.color}`, borderRadius: '5px', background: props.color, width: props.width, height: props.height, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            {props.children}
        </Box>
    );
}

export function GridModal(props: { children: JSX.Element | JSX.Element[], width: number, height: number, color: string }) {
    return (
        <Grid2 container columnSpacing={{ xs: 1, sm: 2, md: 3}} alignItems='center' sx={{ border: `3px solid ${props.color}`, borderRadius: '5px', background: props.color, width: props.width, height: props.height }}>
            {props.children}
        </Grid2>
    );
}

export { Grid2 };
