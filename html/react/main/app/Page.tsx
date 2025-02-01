import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import TopBar from '../../shared/TopBar';
import DiscordIcon from './DiscordIcon';
import { initMetaDOM, getMetaValue } from '../../shared/MetaDOM';
import WorkSpace from '../../shared/WorkSpace';
import { FlexModal } from '../../shared/Modals';

function LoginModal(props: { children: JSX.Element | JSX.Element[] }) {
  return (
    <FlexModal width={380} height={250} color="#333333">
      <Typography color="textPrimary" variant="h5">
        Kantraksel Portal
      </Typography>
      <Box sx={{ mt: 4, mb: 1 }}>
        {props.children}
      </Box>
    </FlexModal>
  );
}

type LoginInterState = 'button' | 'progress';
function LoginInteraction(props: { type: LoginInterState, onClick: () => void }) {
  if (props.type === 'button') {
    return (
      <Button variant="contained" startIcon={<DiscordIcon />} sx={{ mb: 1 }} onClick={props.onClick}>
        Sign in
      </Button>
    );
  } else if (props.type === 'progress') {
    return <CircularProgress size={36} />;
  }
}

function AuthAlert(props: { value: string | null }) {
  if (props.value == null) {
    return <></>;
  } else {
    return <Alert severity="error" variant="filled">{props.value}</Alert>;
  }
}

function Page() {
  const [state, setState] = useState<LoginInterState>('button');

  function onSignIn() {
    setState('progress');
    
    const url = `${import.meta.env.BASE_URL}login`;
    window.location.assign(url);
  }

  initMetaDOM(['authError']);

  return (
    <>
      <TopBar title="Main Hub" />
      <WorkSpace>
        <AuthAlert value={getMetaValue('authError')} />
        <LoginModal>
          <LoginInteraction type={state} onClick={onSignIn}/>
        </LoginModal>
      </WorkSpace>
    </>
  );
}

export default Page;
