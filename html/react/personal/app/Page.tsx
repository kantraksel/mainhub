import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TopBar from '../../shared/TopBar';
import { initMetaDOM, getMetaValue } from './../../shared/MetaDOM';
import WorkSpace from '../../shared/WorkSpace';
import { FlexModal } from '../../shared/Modals';

function MainModal() {
  function onSignOut() {
    window.location.assign(`${import.meta.env.BASE_URL}logout`);
  }

  function onDashboard() {
    window.location.assign(`${import.meta.env.BASE_URL}dashboard/`);
  }

  return (
    <FlexModal width={380} height={250} color="#333333">
      <Typography color="textPrimary" variant="h5">
        Logged in as {getMetaValue('profileName')}
      </Typography>
      <Box sx={{ mt: 4, mb: 1 }}>
        <Button variant="contained" sx={{ mb: 1, mr: 1 }} onClick={onDashboard}>
          Dashboard
        </Button>
        <Button variant="contained" color="error" sx={{ mb: 1 }} onClick={onSignOut}>
          Sign out
        </Button>
      </Box>
    </FlexModal>
  );
}

function ServiceModal() {
  const serviceName = getMetaValue('serviceName');
  const serviceUrl = getMetaValue('serviceUrl');

  function onRedirect() {
    window.location.assign(serviceUrl!);
  }

  return (
    <FlexModal width={380} height={250} color="#333333">
      <Typography color="textPrimary" variant="h6">
        You've been logged out
      </Typography>
      <Typography color="textPrimary" variant="h6">
        in {serviceName}
      </Typography>
      <Box sx={{ mt: 4, mb: 1 }}>
        <Button variant="contained" sx={{ mb: 1, mr: 1 }} onClick={onRedirect}>
          Log in
        </Button>
      </Box>
    </FlexModal>
  );
}

export default function Page() {
  initMetaDOM(['serviceName', 'serviceUrl', 'profileName']);

  let modal;
  if (getMetaValue('serviceName') != null) {
    modal = <ServiceModal />;
  } else {
    modal = <MainModal />;
  }

  return (
    <>
      <TopBar title="Main Hub" loggedIn />
      <WorkSpace>
        {modal}
      </WorkSpace>
    </>
  );
}
