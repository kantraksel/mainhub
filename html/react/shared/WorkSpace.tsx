import { Box } from "@mui/material";

export default function WorkSpace(props: { children: JSX.Element | JSX.Element[] }) {
    return <Box sx={{ position: 'fixed', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>{props.children}</Box>;
}
